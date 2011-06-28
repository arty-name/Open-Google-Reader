/*
  OVERVIEW
  
  At first all native Google Reader data is removed from page (`clearDocument`)
  and replaced with new structure (`createLayout`): panel
  with buttons (`createHeader`) and container for entries. New css styles
  are also added (`addStyles`).
  
  Then code requests entries data from google (`getViewData`). Data for each
  entry is filtered (`titleFilters` and `bodyFilters`),
  preprocessed (`entryAlterations`) and new entry (`createEntry`) is appended
  to the container. When you switch to another view, it does the same, but first
  it resets page (`resetView` and `resetContainer`).
  
  When you click any button, code (`clickHandler`) looks at button's class,
  picks from `actions` a function with the same name and runs it.
  Same functions are used when you press a button on a keyboard (`keyHandler`).
  
  Sharing an entry, liking it, starring it or marking it as read is just
  assigning specific tags (using `toggleEntryTag`). These are based on userId
  and created via `createTags`. Same tags are appended to base url to request
  specific view like "shared entries", "starred entries", "unread entries" or
  "entries tagged with X". Commenting and altering the entry is actually
  creating a new entry (`checkIfAltered`).
  
  Tagging an entry (and hence almost any other operation) requires a token.
  Tokens are valid for short time, and need to be re-requested (`updateToken`).
  
  When you have read almost all entries (`checkNeedMoreEntries`), new portion
  of data is requested. To get it you need `continuation` from previous request.
  
  
  Generally functions are declared directly below the function which uses them
  in the same order, so you can read code from top to bottom.
*/

function ui() {

  // static user id 
  var userId = settings.userId || window._USER_ID || (window.localStorage && localStorage.userId) || '-';
  
  // session token (can be updated)
  var token = window._COMMAND_TOKEN;
  
  // subscriptions data
  var subscriptions = window._STREAM_LIST_SUBSCRIPTIONS && _STREAM_LIST_SUBSCRIPTIONS.subscriptions;
  
  // sort orders
  var sort = {
    oldestFirst: 'o',
    newestFirst: 'd'
  }; 
  
  // various "tags": some to filter entries, some to assign
  var tags = initTags();  
  
  
  var mobile = !!/mobi/i.test(window.navigator.userAgent);

  var body = document.compatMode == 'CSS1Compat' ? document.documentElement : document.body;
  
  // container of entries
  var container;
  
  // div to cover read part of entry
  var shadow;
  
  // div to let body scroll a little more
  var spacer;
  
  
  // hash of available actions, defined at the bottom of file
  var actions;
  
  // handle of currently selected item
  var currentEntry;
  
  // name of current view
  var currentView;
  
  // number of unread items to display in title
  var unreadCount = 0;
  
  // that's where we keep entries original data
  var storage = {};

  
  // handle to ajax request, used to fetch entries (only one used, previous is aborted)
  var dataRequest;
  
  // 
  var continuation;
  var displayedItems;
  var noMoreItems;
  var inBackground = false;


  // replace google's dom with own layout
  createLayout();
  // start regular updating of unread items count 
  initUnreadCount();
  // get entries for current view when we have subscriptions data
  ensureSubscriptions(switchToView.curry(window.localStorage && localStorage.currentView || 'unread'));
  // get token if we don't have any
  if (!token) updateToken();
  
  // attach listeners for clicks and keypresses
  document.addEventListener('click', clickHandler, false);
  document.addEventListener('keypress', keyHandler, false);

  // attach listeners for window resize, blur and focus
  window.addEventListener('resize', resizeHandler, false);
  window.addEventListener('focus', function(){ inBackground = false; }, false);
  window.addEventListener('blur',  function(){ inBackground = true;  }, false);

  // window scroll requires special handling on mobile
  if (!mobile) {
    window.addEventListener('scroll', scrollHandler, false);
  } else {
    window.addEventListener('touchend', scrollHandler, false);
  }

  function initTags() {
    // prefix of user tags
    var tagPrefix = 'user/' + userId + '/state/com.google/';

    // various "tags": some to filter entries, some to assign
    return {
      unread: tagPrefix + 'reading-list',
      read: tagPrefix + 'read',
      like: tagPrefix + 'like',
      star: tagPrefix + 'starred',
      share: tagPrefix + 'broadcast',
      friends: tagPrefix + 'broadcast-friends-comments'
    }
  }

  function createLayout() {
    clearDocument(); // remove existing body children
    addStyles(); // add own css styles

    container = DOM('div.container', {innerHTML: 'Loading...'});

    var body = document.body;
    body.appendChild(createHeader()); // header contains buttons
    body.appendChild(container);

    // this one will shadow read portion of entry
    shadow = DOM('div.shadow');
    body.appendChild(shadow);

    // this will let body scroll a little more
    spacer = DOM('div.spacer');
  }

  // remove existing body children
  function clearDocument() {
    var body = document.body;
    body.innerHTML = '';
    body.removeAttribute('text');
    body.removeAttribute('bgcolor');
    body.className = mobile ? 'mobile' : 'desktop';

    var head = document.head || document.body.previousElementSibling;
    while (head.firstChild) head.removeChild(head.firstChild);
    head.appendChild(DOM('title'));
    head.appendChild(DOM('link', {href: '/reader/ui/favicon.ico', rel: 'SHORTCUT ICON'}));
    
    if (mobile) {
      // on first load I must use smaller dimension, 
      // otherwise opera will not resize to smaller one later 
      head.appendChild(DOM('meta', {name: 'viewport', content: getMetaViewPortContent(true)}));
    }

    Array.prototype.slice.call(document.styleSheets, 0).forEach(function(ss){ ss.disabled = true; });
  }
  
  function getMetaViewPortContent(forceMin) {
    var viewPortWidth = 
      (!forceMin && screen.width > screen.height) ? 
        settings.mobileViewPort.max : 
        settings.mobileViewPort.min;  
    
    return [
      'width=' + viewPortWidth, 
      'initial-scale=1.0',
      'maximum-scale=1.0',
      'user-scalable=0',
      'target-densitydpi=device-dpi'
    ].join(', ');
  }
  
  // add own css styles
  function addStyles() {
    document.body.previousElementSibling.appendChild(
      DOM('style', undefined, [document.createTextNode(settings.css)])
    );
  }

  // create container with buttons
  function createHeader() {
    if (mobile) {
      var titles = {
        reload: 'Reload',
        friends: 'Comments',
        unread: 'Unread',
        starred: 'Starred',
        shared: 'Shared',
        next: 'Next',
        prev: 'Previous'
      };
    } else {
      titles = {
        reload: '⟳ Reload',
        friends: '✉',
        unread: 'Unread',
        starred: '☆ Starred',
        shared: '⚐ Shared',
        next: '▽ Next',
        prev: '△ Previous'
      };
    }
    return DOM('header', undefined, [
      createButton('reload',  titles.reload),
      createButton('friends', titles.friends, DOM('var')),
      createButton('unread',  titles.unread,  DOM('var')),
      createButton('starred', titles.starred),
      createButton('shared',  titles.shared),
      createButton('next',    titles.next),
      createButton('prev',    titles.prev),
      DOM('a.resetView', {
        href: 'http://google.com/reader/view#',
        innerHTML: 'Normal View'
      })
    ]);
  }

  function createButton(class_, text, child) {
    var button = DOM('button.' + class_, {innerHTML: text});
    if (child) button.insertBefore(child, button.firstChild);
    return button;
  }

  // update unread count now, every minute and on every window focus
  function initUnreadCount() {
    updateUnreadCount(true);
    setInterval(updateUnreadCount, 60000);
    window.addEventListener('focus', updateUnreadCount, false);
  }

  // that's how unread count is updated
  function updateUnreadCount(force) {
    
    // do not update too often, unless forced
    var time = (new Date()).getTime();
    if (force !== true && time - (updateUnreadCount.time || 0) < 60000) {
      setTimeout(updateUnreadCount, 60000);
      return;
    }
    updateUnreadCount.time = time;
    
    // request data
    APIRequest('unread-count', {
      parameters: {
        allcomments: 'true',
        output: 'json'
      },
      onSuccess: function(response) {
        var data = response.responseJSON;
        var count = 0;
        
        // summarize all values for feeds (not tags/folders)
        var friends;
        data.unreadcounts.forEach(function(feed){
          if (feed.id.match(/^feed/)) count += feed.count;
          if (feed.id == tags.friends) {
            friends = feed.count;
          }
        });
        document.querySelector('body > header > button.friends > var').innerHTML = friends || '';

        // if unread count increased, current continuation isn't complete anymore
        // thus we get a new one
        // when force specified, new continuation is already being loaded, ignore
        if (count > unreadCount && currentView == 'unread' && !force) {
          // TODO: sometimes this happens right after reading an item
          // when you get unread count for the moment before you read it
          getNewUnreadContinuation();
        }
        
        unreadCount = count;
        updateTitle(); // show unread count in page title
      }
    });
  }
  
  // show unread count in page title
  function updateTitle() {
    var string = '';
    if (unreadCount) {
      string = '(' + unreadCount + ') ';
    }
    document.title = string + 'Google Reader';

    document.querySelector('body > header > button.unread > var').innerHTML = unreadCount || '';
  }
  
  // this replaces active continuation with new, containing all unread items
  function getNewUnreadContinuation() {
    // if user hasn't started reading, we simply reload
    if (inBackground && !currentEntry) {
      actions.reload();
      return;
    }

    // here was some logic, which is rendered useless by the fact that
    // sometimes new unread items are to be displayed above current entry,
    // so now we're just doing some kind of reset instead

    continuation = undefined;
    noMoreItems = false;

    getViewData(currentView);
  }
  
  // call continuation when subscriptions are loaded
  function ensureSubscriptions(continuation) {
    // if already loaded, call right away
    if (subscriptions) return continuation();
    
    // otherwise load data
    return APIRequest('subscription/list', {
      parameters: {output: 'json'},
      onSuccess: function(response) {
        subscriptions = response.responseJSON.subscriptions;
        continuation();
      }
    });
  }
  
  // load entries for a view
  function getViewData(view) {
    // if google reader reported there's no new entries, stop
    if (noMoreItems) return;
    
    // abort current request if any
    if (dataRequest) {
      dataRequest.onreadystatechange = undefined;
      dataRequest.abort();
      dataRequest = undefined;
    }
    
    // request data from special url for given view
    dataRequest = APIRequest('stream/contents/' + tags[view], {
      parameters: getViewParameters(view),
      onSuccess: function(response){
        var data = response.responseJSON;
        if (!data) return;
        
        // if continuation given, store it, otherwise there's no more entries
        if (data.continuation) {
          continuation = data.continuation;
        } else {
          noMoreItems = true;
        }
        
        // remove loading indicator
        if (displayedItems.length == 0 && (noMoreItems || data.items.length > 0)) {
            container.innerHTML = '';
        }

        // add each entry to container
        data.items.forEach(addEntry);
        
        // append spacer to the end so that even last entry could be shown at top
        if (spacer.previousSibling && spacer.nextSibling) {
          container.removeChild(spacer);
        }
        if (noMoreItems && container.lastChild) {
          var viewHeight = body.clientHeight - container.previousElementSibling.clientHeight;
          spacer.style.height = 
            viewHeight - (container.lastChild.clientHeight % viewHeight) - 20 + 'px';
          container.appendChild(spacer);
        }
        
        // Accessing friends comments view should be followed by setting last access time for that view.
        // This is ugly, GR team!
        // Can't think of a better place for that check… : (
        if (view == 'friends') {
          updateAllCommentsViewTime();
        }
        
        // clear current request
        dataRequest = undefined;
        checkNeedMoreEntries();
      },
      onComplete: function(request) {
        // clear current request
        if (dataRequest == this || dataRequest == request) {
            dataRequest = undefined;
        }
      },
      onFailure: updateToken.curry(getViewData.curry(view)) // ensure we have active token
    });
  }
  
  function getViewParameters(view) {
    var parameters = {n: 20};
    // add continuation if known
    if (continuation) parameters.c = continuation;
    
    // "unread" view needs special sorting and filter
    if (view == 'unread') {
      parameters.xt = tags.read; // exclude read items
      parameters.r = sort.oldestFirst;
    } else {
      if (view == 'friends') {
        parameters.co = true; // items with comments only
      }
      parameters.r = sort.newestFirst;
    }
    
    return parameters;
  }
  
  function addEntry(item, index){
    // if userId is not yet known, try to detect it by entry tags
    checkEmptyUserId(item, index);
    
    // skip entries which are already shown
    if (displayedItems.contains(item.id)) {
      return;
    }
    
    item = transformEntry(item);
    
    // check if entry needs alteration
    settings.entryHtmlAlterations.invoke('call', null, item);
    
    // if entry marked to ignore or matches filter, mark it as read and skip it
    if (item.ignore || matchesFilters(item.title, item.body)) {
      item.read = false;
      toggleEntryTag(item, 'read');
      if (unreadCount) {
        unreadCount--;
        updateTitle();
      }
      return;
    }
    
    // create entry and add it to shown entries and to container
    try {
      var entry = createEntry(item);
      var article = entry.querySelector('article');
      
      // check if entry needs alteration
      settings.entryDomAlterations.invoke('call', null, item, article, entry);
      
      container.appendChild(entry);
      displayedItems.push(item.id);
    } catch (e) {
      // fail of one entry shouldn't prevent other from displaying
      console.error(e);
      return;
    }

    // if image is not loaded in 10 seconds, replace it with link
    article.querySelectorAll('img').forEach(function(image){
      if (!image.complete) setTimeout(function(){
        if (image.complete) return;
        image.parentNode.replaceChild(
          DOM('a', {href: image.src, innerHTML: '[unavailable]'}),
          image
        );
      }, 10000);
    });
  }
  
  function transformEntry(item) {
    var body =
      item.content && item.content.content ||
        item.summary && item.summary.content || '';

    var feed = subscriptions.find(function(feed){
      return feed.id == item.origin.streamId;
    });
    feed = {
      title: feed && feed.title || item.origin.title || '',
      url: item.origin.htmlUrl,
      id: item.origin.streamId,
      categories: feed && feed.categories || [],
      category: feed && feed.categories && feed.categories[0] && feed.categories[0].label || ''
    };

    item = {
      id: item.id,
      original: item,

      title: item.title || trimToNWords(body.stripTags(), 8) || '»',
      body: body,
      url: item.alternate && item.alternate[0] && item.alternate[0].href || '',

      author: item.author,
      feed: feed,
      via: item.via,
      tags: item.categories,
      comments: [].concat(item.annotations).concat(item.comments),
      enclosure: item.related && item.related[0].href || item.enclosure && item.enclosure[0].href || '',

      hooks: {
        read: undefined,
        star: undefined,
        share: undefined
      },
      
      processing: {
        read: false,
        star: false,
        share: false
      }
    };

    ['read', 'star', 'share'].forEach(function(tag){
      item[tag] = item.tags.contains(tags[tag]);
    });
    
    item.comments.forEach(function(comment){
      comment.content = comment.content || comment.htmlContent;
    });

    return item;
  }

  function checkEmptyUserId(item, index) {
    // if userId is not yet known, try to detect it by entry tags
    if (userId == '-' && index == 0 && currentView == 'unread' && item.categories) {
      var match = item.categories.join('').match(/user\/(\d+)\/state\/com.google\/reading-list/);
      if (match) {
        // if found userId, store it and update global tags values
        userId = match[1];
        tags = initTags();
        if (window.localStorage) {
          localStorage.userId = userId;
        } else {
          alert('Looks like your user ID is ' + userId + '. Write this value to `userId` in settings.');
        }
      }
    }
  }
  
  // check entry's title and body against filters
  function matchesFilters(title, body) {
    title = title.toLowerCase();
    if (settings.titleFilters.find(function(term){ return title.contains(term) })) {
      return true;
    }
    return body && settings.bodyFilters.find(function(term) {
      return body.contains(term);
    });
  }

  function createEntry(data) {
    var headerLink = DOM('a', {href: data.url, innerHTML: data.title, target: '_blank'});
    data.domain = DOM('a', {href: data.feed.url}).hostname;

    var classes = [
      data.read ? 'read' : '',
      data.star ? 'star' : '',
      data.share ? 'share' : ''
    ];
    var container = DOM('section.entry ' + classes.join(' '), {}, [
      DOM('cite', {innerHTML: getAuthor(data)}),
      DOM('h2', undefined, [
        createButton('star', getButtonImage(data, 'star')),
        headerLink
      ]),
      createComments(data),
      DOM('article', {innerHTML: data.body}),
      createEntryFooter(data)
    ]);
    
    // store entry's original data for future reference
    storage[data.id] = data;
    container.id = data.id;

    return container;
  }
  
  function getButtonImage(data, button) {
    if (mobile) return '';
    
    switch (button) {
      case 'star':   return (data.star  ? '★' : '☆');
      case 'share':  return (data.share ? '⚑' : '⚐');
      case 'edit':   return '✍';
    }
    return '';
  }
  
  // show entry's origin, favicon, and users who shared it
  function getAuthor(data) {
    return (
      // favicon
      (mobile ? '' : '<img src="http://favicon.yandex.net/favicon/' + data.domain + '">') +
      // author
      (data.author ? data.author + ' @ ' : '') +
      // site
      data.feed.title +
      // via
      (data.via ? '<br>' + data.via.pluck('title').join('<br>') : '')
    );
  }
  
  // show comments from other users
  function createComments(data) {
    var comments = document.createDocumentFragment();
    
    if (data.comments.length) {
      comments = DOM('dl.comments');
      data.comments.forEach(function(comment){
        comments.appendChild(DOM('dt', { innerHTML: comment.author }));
        comments.appendChild(DOM('dd', { innerHTML: comment.content }));
      });
      comments.appendChild(DOM('dd.addcomment', {}, [
        DOM('button.comment', { innerHTML: (mobile ? '' : '✉ ') + 'Add comment' })
      ]));
    }
    
    return comments;
  }

  // entry footer contains buttons and tags
  function createEntryFooter(data) {
    var footer = DOM('footer', undefined, [DOM('span.buttons', {}, [
      createButton('star',  getButtonImage(data, 'star') + ' Star'),
      createButton('share', getButtonImage(data, 'share') + ' Share'),
      createButton('edit',  getButtonImage(data, 'edit') + ' Edit/Comment')
    ])]);

    // filter out custom user tags, only original tags remain
    var tags = data.tags.filter(function(tag){
      return !tag.match(/^user\//);
    }).join(', ');
    
    if (tags.length) {
      var tagsSpan = DOM('span.tags', {innerHTML: 'Tags: ' + tags});
      footer.insertBefore(tagsSpan, footer.firstChild);
    }
    
    return footer;
  }
  
  function clickHandler(event){ try{
    var target = event.findElement('section.entry a');
    if (target) {
      target.target = '_blank';
      target.blur();
    }
    
    target = event.findElement('section.entry');
    if (target && target != currentEntry) {
      makeEntryActive(target);
    }
    
    target = event.findElement('button');
    if (target && actions[target.className]) {
      actions[target.className](event);
      target.blur();
    }
  } catch(e) { console.error(e) }}

  function keyHandler(event){ try{
    var target = event.target;
    
    if (event.ctrlKey || event.altKey) return;
    if (target && (target.nodeName.match(/input|textarea|button/i))) return;
    if (!event.ctrlKey && event.keyCode == 32) event.preventDefault(); // space
    
    hideShadow();
    
    if (event.keyCode == 27) { // ESC
      actions.edit(undefined, true);
      return;
    }
    
    var matched = true;
    var key = String.fromCharCode(event.which).toUpperCase();
    switch (key) {
      case 'R': case 'К': actions[event.shiftKey ? 'fullReload' : 'reload'](); break;
      case 'W': case 'Ц': 
      case 'U': case 'Г': actions.unread(); break;
      case 'Q': case 'Й': actions.removeReadUnstarred(); break;
      case 'E': case 'У':
      case 'I': case 'Ш': actions.starred(); break;
      case 'O': case 'Щ': actions.shared(); break;
      case 'J': case 'О': actions.next(); break;
      case ' ':           actions.space(event);  break;
      default: matched = false;
    }
    if (matched) {
      event.preventDefault();
      return;
    }
    
    if (!currentEntry) return;
    
    matched = true;
    switch (key) {
      case 'K': case 'Л': actions.prev(); break;
      case 'V': case 'М': currentEntry && openTab(currentEntry.querySelector('a'), event); break;
      case 'C': case 'С': currentEntry && openTab(currentEntry.querySelectorAll('a')[1], event); break;
      case 'S': case 'Ы': actions[event.shiftKey ? 'share' : 'star'](); break;
      case 'Y': case 'Н': actions.edit(); break;
      default: matched = false;
    }
    if (matched) {
      event.preventDefault();
    }
  } catch(e) { console.error(e) }}

  function scrollHandler(){
    if (!currentEntry) {
      if (container.firstElementChild) {
        makeEntryActive(container.firstElementChild);
      }
      return;
    }
    var distance2border = Math.min(50, currentEntry.clientHeight * .5);
    if (currentEntry.offsetTop + currentEntry.clientHeight - distance2border < body.scrollTop) {
      if (currentEntry.nextElementSibling) {
        makeEntryActive(currentEntry.nextElementSibling);
      }
    }
    if (currentEntry.offsetTop + distance2border > body.scrollTop + body.clientHeight) {
      if (currentEntry.previousElementSibling) {
        makeEntryActive(currentEntry.previousElementSibling);
      }
    }
    
    checkNeedMoreEntries();
  }
  
  function checkNeedMoreEntries() {
    if (dataRequest || noMoreItems) return;
    
    if (body.scrollTop + 2 * body.clientHeight > body.scrollHeight) {
      getViewData(currentView);
    }
  }

  function updateAllCommentsViewTime(opt_time) {
    APIRequest('preference/set', { method: 'post', parameters: {
      T: token,
      k: 'last-allcomments-view',
      v: opt_time || ((new Date()).getTime() * 1000) // right - that's microseconds
    }});
  }

  function resizeHandler() {
    if (mobile) {
      document.querySelector('head>meta[name="viewport"]').setAttribute('content', getMetaViewPortContent());
      return;
    }
    
    if (!currentEntry) return;
    
    body.scrollTop = currentEntry.offsetTop;

    // fixate entry height to fight scroll caused by loading of skipped images
    var article = currentEntry.querySelector('article');
    if (article.style.height) {
      article.style.height = article.scrollHeight + 'px';
    }
  }

  function resetView() {
    continuation = undefined;
    displayedItems = [];
    noMoreItems = false;
  }
  
  function resetContainer() {
    currentEntry = undefined;
    body.scrollTop = 0;
    container.innerHTML = 'Loading...';
  }
  
  function hideShadow() {
    shadow.style.height = 0;
  }
  
  function switchToView(view) {
    if (currentView == view) return;
    
    resetView();
    resetContainer();

    container.previousElementSibling.classList.remove(currentView);
    container.previousElementSibling.classList.add(view);
    
    currentView = view;
    if (window.localStorage) localStorage.currentView = view;
    getViewData(currentView);
  }

  function makeEntryActive(entry) {
    if (currentEntry) {
      currentEntry.classList.remove('active');
      actions.edit(undefined, true);
    }
      
    currentEntry = entry;
    currentEntry.classList.add('active');
    
    markAsRead(currentEntry);
    currentEntry.previousSiblings().forEach(markAsRead); 
    
    if (currentEntry.nextSiblings().length <= 3 && !dataRequest) {
      getViewData(currentView);
    }
    
    // fixate entry height to fight scroll caused by loading of skipped images
    var article = entry.querySelector('article');

    // update entry height when skipped images load
    var images = article.querySelectorAll('img').filter(function(image) { return !image.height; });
    if (images.length > 0) {
      article.style.height = article.scrollHeight + 'px';

      var handler = imageHandler.curry(entry);
      images.forEach(function(image){
        if (image.onreadystatechange || image.style.height) return;
        image.onreadystatechange = handler;
      });
    }
  }
  
  function markAsRead(entry) {
    if (!entry.id) return;
    var data = storage[entry.id];
    if (!data.read && !data.processing.read) {
      toggleEntryTag(entry, 'read');
      if (unreadCount) {
        unreadCount--;
        updateTitle();
      }
    }
  }
  
  function checkIfAltered(entry, share) {
    if (!entry.id) return false;
    var data = storage[entry.id] || entry;
    var edited = data.inputs && data.inputs.shown;
    if (!data.altered && !edited) return false;

    var parameters = {
      T: token,
      url: entry.querySelector('a').href,
      title: edited ? data.inputs.title.value : data.title,
      snippet: edited ? data.inputs.body.value : data.body,
      annotation: edited ? data.inputs.comment.value : '',
      linkify: false,
      share: !!share,
      srcTitle: data.feed.title,
      srcUrl: data.feed.url
    };

    return APIRequest('item/edit', {
      method: 'post',
      parameters: parameters,
      onSuccess: function() {
        if (entry != currentEntry) return;
        actions.edit(undefined, true);
        
        container.insertBefore(DOM('section.entry', {}, [
          DOM('h2', undefined, [DOM('a', {href: parameters.url, innerHTML: parameters.title})]),
          DOM('article', {innerHTML: parameters.snippet})
        ]), entry.nextElementSibling);
      },
      onFailure: updateToken.curry(checkIfAltered.curry(entry, share))
    });
  }
  
  function toggleEntryTag(entry, tag) {
    if (!entry.id) return;
    var data = storage[entry.id] || entry;
    var state = data[tag];
    
    if (data.processing[tag]) return;
    data.processing[tag] = true;
    
    if (!state && data.hooks[tag]) data.hooks[tag].call();
    
    var parameters = {
      T: token,
      i: data.id,
      s: data.feed.id
    };
    parameters[state ? 'r' : 'a'] = tags[tag]; 
    
    APIRequest('edit-tag', {
      method: 'post',
      parameters: parameters,
      onSuccess: function() {
        data[tag] = !state;
        if (entry.classList) entry.classList[state ? 'remove' : 'add'](tag); // sometimes entry is just data object
        entry.querySelectorAll && entry.querySelectorAll('button.' + tag).forEach(function(button){
          button.innerHTML = button.innerHTML.replace(/^./, getButtonImage(data, tag));
        });
      },
      onFailure: updateToken.curry(toggleEntryTag.curry(entry, tag)),
      onComplete: function() { data.processing[tag] = false; }
    });
  }
  
  function updateToken(oncomplete) {
    APIRequest('token', {
      onSuccess: function(response) {
        token = response.responseText;
        oncomplete && oncomplete();
      }
    })
  }
  
  
  function imageHandler(entry) {
    // ignore not yet loaded images
    if (!this.complete) return;
    
    // handler must be successfully called only once
    this.onreadystatechange = undefined;
    this.style.height = this.height;
  
    // ignore images loaded in entries below current
    if (currentEntry.nextSiblings().contains(entry)) return;
      
    // adjust article height
    var article = entry.querySelector('article');
    var height = parseInt(article.style.height);
    var diff = article.scrollHeight - height;
    
    article.style.height = height + diff + 'px';
  
    // if this image is in one of previous entries, scroll container and exit
    if (currentEntry != entry) {
      body.scrollTop += diff;
      return;
    }
      
    // calculate image offset in article
    var imageOffset = this.offsetTop;
    var parent = this.offsetParent; 
    while (parent != container) {
      imageOffset += parent.offsetTop;
      parent = parent.offsetParent;
    }
    imageOffset -= entry.offsetTop;
      
    // if image is above .2 of viewport, scroll container
    var entryVisibleOffset = entry.offsetTop - body.scrollTop;
    if (entryVisibleOffset < 0 &&
        entryVisibleOffset + imageOffset < body.clientHeight * .2) {
      body.scrollTop += diff;
    }
  }
  
  function openTab(link, event) {
    if (!link) return;
    if (event.shiftKey) {
      link.click();
    } else {
      window.open(link.href).blur();
      window.focus();
    }
  }
  
  function trimToNWords(string, N) {
    var words = string.split(/\s+/);
    if (words.length <= N) return string;
    return words.slice(0, N).join(' ') + '…';
  }
  
  function scrollTo(offset){
    // interval handler
    var interval;
    // steps indexer
    var currentStep = 0;

    // get current window scrolling position
    var startOffset = body.scrollTop;

    // calculate scroll distance and maximum scroll speeds
    var deltaY = offset  - startOffset;
    var steps = Math.round(deltaY / 40);
    var maxSpeedY = deltaY * 2 / steps;
    
    // if both scroll distances are too small, use simple scroll 
    if (deltaY < steps) {
      body.scrollTop = offset;
      return;
    }
    
    // create new scrolling timer
    interval = setInterval(function(){
      // if reached last step
      if (currentStep == steps) {
        // stop scrolling
        clearInterval(interval);
        return;
      }
      
      // make next scrolling step
      currentStep++;
      // 'distance' from maximum speed point
      var centerDist = Math.abs(currentStep - steps/2);
      // offset from maximum speed point
      var factor = (currentStep < (steps / 2) ? -1 : 1) * centerDist / steps * (steps - centerDist);
      // new scroll coordinates
      var y = startOffset  + deltaY / 2 + factor * maxSpeedY;
      body.scrollTop = parseInt(y);
    }, 10);
  }
  
  
  // on button click get its className and call corresponding handler
  actions = {
    
    // view switchers
    unread: switchToView.curry('unread'), 
    starred: switchToView.curry('star'), 
    shared: switchToView.curry('share'), 
    friends: switchToView.curry('friends'),

    reload: function() {
      resetView();
      resetContainer();
      updateUnreadCount(true);
      getViewData(currentView);
    },
    
    fullReload: function() {
      reloadFeed(0);
      
      function reloadFeed(index) {
        if (!subscriptions[index]) return;
        APIRequest('stream/contents/' + encodeURIComponent(subscriptions[index].id), {
          parameters: {refresh: true, xt: tags.read},
          onComplete: function(response) {
            if (response.status != 200) {
              console.warn(response.statusText);
            }
            
            index++;
            try {
              if (response.responseJSON.items.length > 0) {
                updateUnreadCount();
              }
              reloadFeed(index);
            } catch (e) {
              setTimeout(function(){ reloadFeed(index) }, 10000);
            }
          }
        });
      }
    },

    removeReadUnstarred: function() {
      if (!currentView.match(/read|star/)) return;
      
      container.querySelectorAll('section').forEach(function(entry){
        var data = storage[entry.id];
        if (!data || (data.read && !data.star)) {
          container.removeChild(entry);
        }
      });
      if (!currentEntry || !currentEntry.parentNode) {
        var firstEntry = container.querySelector('section.entry');
        if (firstEntry) makeEntryActive(firstEntry);
      }
      if (currentEntry) body.scrollTop = currentEntry.offsetTop;
    },
    
    // star/share management
    star: function(){
      toggleEntryTag(currentEntry, 'star');
    },
    share: function(){
      if (checkIfAltered(currentEntry, true)) return;
      
      toggleEntryTag(currentEntry, 'share');
      toggleEntryTag(currentEntry, 'like');
    },

    // dumb "show next/previous entry" buttons
    next: function() {
      if (!currentEntry) {
        makeEntryActive(container.firstElementChild);
      } else {
        if (currentEntry.nextElementSibling && currentEntry.nextElementSibling.classList.contains('entry')) { 
          makeEntryActive(currentEntry.nextElementSibling);
          body.scrollTop = currentEntry.offsetTop - (mobile ? 20 : 0);

          // TODO: remove this hacky optimization
          if (mobile) setTimeout(scrollHandler, 10);
        }
      }
    },
    prev: function() {
      if (!currentEntry) return;
      if (currentEntry.previousElementSibling) {
        makeEntryActive(currentEntry.previousElementSibling);
      }
      body.scrollTop = currentEntry.offsetTop;
    },
    
    // smart paging: if current entry is short, show next, but otherwise
    // scroll current entry to show next page or next large image
    space: function(event) {
      
      // shift+space = previous entry
      if (event.shiftKey && currentEntry) {
        actions.prev();
        return;
      }
      // first use focuses first item
      if (!currentEntry) {
        actions.next();
        return;
      }
      
      // find all images in article
      var viewHeight = body.clientHeight - container.previousElementSibling.clientHeight;
      var images = currentEntry.querySelector('article').querySelectorAll('img');
      // find large images (height > half of a viewport height)
      var largeImages = images.filter(function(image){
        return image.height > viewHeight * .5;
      });
      
      if (largeImages.length > 0) {
        // try finding large image which *is* on screen, but still needs scrolling
        var foundIndex = undefined;
        var found = largeImages.find(function(image, index){ 
          var viewportImageTop = image.offsetTop - body.scrollTop;
          var viewportImageBottom = viewportImageTop + image.height;
          
          if (viewportImageTop < viewHeight * .5 && viewportImageBottom > viewHeight) {
            foundIndex = index;
          }
          return foundIndex != undefined;
        });
        
        if (found) {
          invisibleHeight = found.offsetTop + found.height - body.scrollTop - viewHeight;
          
          if (invisibleHeight > viewHeight) {
            // can scroll whole screen
            body.scrollTop += viewHeight;
          } else if (invisibleHeight > viewHeight * .4) {
            // instantly show remaining part
            body.scrollTop = found.offsetTop + found.height - viewHeight;
          } else { 
            // smooth scroll to show remaining part 
            scrollTo(found.offsetTop + found.height - viewHeight);
          }
          
          return;
        }
        
        // try finding large image which *will be* on screen
        var nextIndex = undefined;
        var next = largeImages.find(function(image, index){ 
          var viewportImageTop = image.offsetTop - body.scrollTop;
          var viewportImageBottom = viewportImageTop + image.height;
          
          if (image != found &&
              viewportImageTop > 0 && viewportImageTop < viewHeight &&
              viewportImageBottom > viewHeight) {
            nextIndex = index;
          }
          return nextIndex != undefined;
        });
        
        if (next) {
          if (next.height < viewHeight) {
            // can show whole image on a screen
            var diff = (next.offsetTop - Math.max(0, viewHeight - next.height) / 4) - body.scrollTop;
            if (diff < viewHeight * .5) {
              scrollTo(body.scrollTop + diff);
            } else {
              body.scrollTop += diff;
            }
          } else {
            var viewportImageTop = next.offsetTop - body.scrollTop;
            if (viewportImageTop < viewHeight * .5) {
              // large part already visible, smooth scroll needed
              scrollTo(next.offsetTop);
            } else {
              // can do instant scroll
              body.scrollTop = next.offsetTop;
            }
          }
          return;
        }
      }
      
      invisibleHeight = (currentEntry.offsetTop + currentEntry.clientHeight) -
        (body.scrollTop + viewHeight);
        
      // if only buttons line is invisible, go to next entry
      if (invisibleHeight < 30) {
        actions.next();
      
      // if there's no full page to show,
      // smooth scroll to show remainder
      // and use shadow to indicate unread part
      } else if (invisibleHeight < viewHeight) {
        scrollTo(body.scrollTop + invisibleHeight);
        shadow.style.height = body.scrollTop + body.clientHeight + 'px';
        setTimeout(hideShadow, 1000);
        
      // otherwise show next page
      // or smaller image that's partially shown
      } else {
        var targetScroll = body.scrollTop + viewHeight;
        
        // find image that's already partially shown and is less then viewHeight
        images.find(function(image){ 
          if (image.offsetTop <= targetScroll && image.offsetTop + image.height > targetScroll) {
            if (image.height > viewHeight && image.offsetTop < targetScroll) {
              return false;
            }
            targetScroll = image.offsetTop + 20; // +- magic neutralizes effect of scrolling not whole viewHeight
            return true;
          } else return false;
        });
        
        // show next page, leaving last line of current page on the screen
        body.scrollTop = targetScroll - 20;
      }
    },
    
    // add comment to an entry
    comment: function(event) {
      if (!currentEntry || !currentEntry.id) return;

      var button = event.target;
      var dd = button.parentNode;
      dd.classList.remove('hidden'); // show all inputs
      
      var textarea = button.previousElementSibling;

      if (!textarea) {
        textarea = DOM('textarea.input', { rows: 4 });
        dd.insertBefore(textarea, button);

        var cancel = DOM('button.cancel input', { innerHTML: 'Cancel' });
        cancel.addEventListener('click', function(){ dd.classList.add('hidden'); }, false);
        dd.appendChild(cancel);
      }

      // if user haven't yet entered comment, halt
      if (textarea.value.match(/^\s*$/)) {
        return;
      }

      var parameters = {
        T: token,
        action: 'addcomment',
        comment: textarea.value.replace(/\r/g, ''),
        i: currentEntry.id,
        s: tags.friends,
        output: 'json'
      };

      return APIRequest('comment/edit', {
        method: 'post',
        parameters: parameters,
        onSuccess: function(response) {
          textarea.value = '';
          dd.classList.add('hidden');

          dd.parentNode.insertBefore(DOM('dt', { innerHTML: 'you' }), dd);
          dd.parentNode.insertBefore(DOM('dd', { innerHTML: response.responseJSON.htmlContent }), dd);
          
          var id = response.responseJSON.commentId;
          var time = parseInt(id.split(/#/)[1]) + 1000;
          updateAllCommentsViewTime(time);
        },
        onFailure: updateToken.curry(actions.comment.curry(event))
      });
    },

    // create new shared entry with altered title/content
    // `forceHide` is used to hide inputs i.e. when moving to another entry
    edit: function(event, forceHide) {
      if (!currentEntry || !currentEntry.id) return;
      
      var data = storage[currentEntry.id];
      if (!data.inputs && forceHide) return;

      var title = currentEntry.querySelector('a');
      var body  = currentEntry.querySelector('article');
      
      if (!data.inputs) {
        // create inputs if needed and put them to corresponding places
        
        data.inputs = {
          shown: false,
          title:   DOM('input',    {value: data.title}),
          body:    DOM('textarea', {value: data.body, rows: 10, cols: 60}),
          comment: DOM('textarea', {value: '', rows: 3, cols: 60})
        };
        
        title.parentNode.appendChild(data.inputs.title);
        body.parentNode.insertBefore(data.inputs.comment, body.nextElementSibling);
        body.parentNode.insertBefore(data.inputs.body, body.nextElementSibling);
      }
      
      if (forceHide) {
        data.inputs.shown = true;
      }
      
      // toggle visibility of nodes and `shown` state
      
      var nodeDisplay = data.inputs.shown ? '' : 'none';
      var inputDisplay = data.inputs.shown ? 'none' : '';
      
      title.style.display = nodeDisplay;
      body.style.display  = nodeDisplay;
      data.inputs.title.style.display   = inputDisplay;
      data.inputs.body.style.display    = inputDisplay;
      data.inputs.comment.style.display = inputDisplay;

      data.inputs.shown = !data.inputs.shown;
      
      if (data.inputs.shown) {
        data.inputs.title.focus();
      }
    }
  };
}

