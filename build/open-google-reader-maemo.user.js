// ==UserScript==
// @name         Open Google Reader
// @version      1.0
// @date         2009-12-07
// @author       Artemy Tregubenko <me@arty.name>
// @description  Replaces native Google Reader's interface with fully customizable one.
// @homepage     http://github.com/arty-name/Open-Google-Reader
// @license      Simplified BSD License; http://en.wikipedia.org/wiki/Bsd_license#2-clause_license_.28.22Simplified_BSD_License.22_or_.22FreeBSD_License.22.29
// @include      http://www.google.com/reader/view/
// @include      http://www.google.com/reader/view/1
// @run-at       document-start
// ==/UserScript==

(function(){

// OVERVIEW
// To get general idea of how that script works,
// see OVERVIEW below or in file 30ui

if (!document.location.href.match(/^http:..www.google.com.reader.view.1?$/)) return;

defineSettings();

function defineSettings() {

settings = {

  // only required to be loaded on 404 url, i.e. http://www.google.com/reader/view/1
  userId: '',
  
  // lowercase words to filter entries out by title
  titleFilters: [],
  
  // words to filter entries out by body (hmtl included)
  bodyFilters: [],
  
  // regular expression to detect links which do not get target=_blank
  torrentRE: /\.torrent$/,
  
  // filters to manipulate on entry content
  entryAlterations: []
  
};

}
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

  // only required to be loaded on 404 url, i.e. http://www.google.com/reader/view/1
  var userId = settings.userId || '';
  
  // lowercase words to filter entries out by title
  var titleFilters = settings.titleFilters || [];

  // words to filter entries out by body (hmtl included)
  var bodyFilters = settings.bodyFilters || [];

  // regular expression to detect links which do not get target=_blank
  var torrentRE = settings.torrentRE || /b41b964aeda4a6d58bb22fcbc345248a/;
  
  // filters to manipulate on entry content
  // NB: set data.altered = true if you want these changes to be shared when you click "share"
  var entryAlterations = settings.entryAlterations || [];
  

  // static user id 
  userId = userId || window._USER_ID || '-'
  
  // session token (can be updated)
  var token = window._COMMAND_TOKEN;

  // prefix of url to get entries from
  var entriesUrl = 'http://www.google.com/reader/api/0/stream/contents/';
  
  // url to manipulate tags on
  var editTagUrl = 'http://www.google.com/reader/api/0/edit-tag';
  
  // url to post edited entries to
  var editEntryUrl = 'http://www.google.com/reader/api/0/item/edit';
  
  // sort orders
  var sort = {
    oldestFirst: 'o',
    newestFirst: 'd'
  }; 
  
  // various "tags": some to filter entries, some to assign
  var tags = initTags();  
  
  
  // container of entries
  var container;
  
  // div to cover read part of entry
  var shadow;
  
  
  // hash of available actions, defined at the bottom of file
  var actions;
  
  // handle of currently selected item
  var currentItem;
  
  // name of current view
  var currentView;
  
  // number of unread items to display in title
  var unreadCount = 0;
  
  // sibscriptions data
  var subscriptions = window._STREAM_LIST_SUBSCRIPTIONS && _STREAM_LIST_SUBSCRIPTIONS.subscriptions;
  
  // that's where we keep entries original data
  var storage = {};

  
  // handle to ajax request, used to fetch entries (only one used, previous is aborted)
  var dataRequest;
  
  // 
  var continuation;
  var limit;
  var displayedItems;
  var noMoreItems;
  var inBackground = false;


  // replace google's dom with own layout
  createLayout();
  // start regular updating of unread items count 
  initUnreadCount();
  // get entries for current view when we have subscriptions data
  ensureSubscriptions(switchToView.curry('unread'));
  
  // attach listeners for clicks, keyupes and mousewheel
  document.addEventListener('click', clickHandler, false);
  document.addEventListener('keyup', keyHandler, false);
  document.addEventListener('mousewheel', scrollHandler, false);
  
  // attach listeners for window resize, blur and focus
  window.addEventListener('resize', resizeHandler, false);
  window.addEventListener('focus', function(){ inBackground = false; }, false);
  window.addEventListener('blur',  function(){ inBackground = true;  }, false);
  
  
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
      tagW: 'user/' + userId + '/label/w', // my specific tag "W"
      friends: tagPrefix + 'broadcast-friends-comments'
    }
  }
  
  function createLayout() {
    clearDocument(); // remove existing body children
    addStyles(); // add own css styles
    
    container = DOM('div', {className: 'container', innerHTML: 'Loading...'});
    
    document.body.appendChild(createHeader()); // header contains buttons
    document.body.appendChild(container);
    //document.body.appendChild(createFooter()); // footer contains up/down buttons
    
    // fix container height to prevent stretching down
    document.heightDiff = window.innerHeight - container.clientHeight;
    container.style.height = window.innerHeight - document.heightDiff + 'px';
    
    // this one will shadow read portion of entry
    shadow = DOM('div', {className: 'shadow'});
    document.body.appendChild(shadow);
  }

  // remove existing body children
  function clearDocument() {
    var body = document.body;
    body.innerHTML = '';
    body.removeAttribute('text');
    body.removeAttribute('bgcolor');

    var head = body.previousElementSibling;
    while (head.firstChild) head.removeChild(head.firstChild);
    head.appendChild(DOM('title'));
    head.appendChild(DOM('link', {href: '/reader/ui/favicon.ico', rel: 'SHORTCUT ICON'}));

    Array.toArray(document.styleSheets).forEach(function(ss){ ss.disabled = true; });
  }
  
  // add own css styles
  function addStyles() {
    var css =
      'html, body { position: absolute; height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden; } ' + 
      'body > header { position: fixed; top: 0; left: 0; right: 0; height: 2em; z-index: 100; background-color: window; } ' + 
      'body>header.unread button.unread, body>header.star button.starred, body>header.share button.shared, body>header.tagW button.taggedW { font-weight: bold; } ' + 
      //'body > footer { position: fixed; bottom: 0; left: 0; right: 0; height: 2em; z-index: 100; background-color: window; } ' + 
      'body > header > a.resetView { position: absolute; right: 0; } ' + 
      'body > div.container { position: absolute; top: 2em; bottom: 0; left: 0; right: 0; overflow-y: scroll; padding: 0 .5em; } ' + 
      'div.shadow { position: absolute; top: 2em; left: 0; right: 0; background: black; opacity: .5; } ' + 
      'section.entry { padding-left: 1.4em; padding-right: .5em; clear: both; display: block; border: 0 solid #bbb; border-bottom-width: 2px; margin-bottom: .2em; float: left; width: 95%; } ' + 
      'section.entry.active { border-color: #333; } ' + 
      'section.entry > h2 { font-family: sans-serif; margin-top: .1em; margin-bottom: .3em; margin-left: .3em; text-indent: -1.4em; } ' + 
      'section.entry > h2 * { display: inline; } ' + 
      'section.entry > h2 > a { text-decoration: none; line-height: 1em; } ' + 
      'section.entry > h2 > button { font-size: inherit; width: 1em; padding-right: 1.1em; } ' + 
      'section.entry > h2 > input { width: 95%; font-size: inherit; } ' + 
      'section.entry > article { display: block; overflow-x: auto; clear: both; } ' + 
      'section.entry > article > p { line-height: 1.15em; } ' + 
      'section.entry > cite, section.entry > article, section.entry > footer { margin-left: .5em; } ' +
      'section.entry > cite { float: right; text-align: right; }' +
      'section.entry > cite > img { margin: 6px; vertical-align: middle; }' +
      'section.entry > q { display: block; font-style: italic; margin: .5em; border: 2px dotted grey; padding: 0 .2em; }' +
      'section.entry > q:before { content: attr(cite) ": «" }  section.entry > q:after { content: "»" }' +
      'section.entry > footer { clear: both; display: block; margin-left: 0; } ' +
      'section.entry > footer > span { float: right; } ' +
      'section.entry + div.spacer { float: left; width: 50%; } ' +
      'button.star { color: #bfb016; } button.share, button.tagW { color: #dc9765; } button.edit { color: #74d774; } '+
      'button.star, button.share, button.tagW, button.edit { background: none; border: none; } '+
      'button { cursor: pointer; } ' +
      'textarea { width: 95%; } ' +
      '';
    document.body.previousElementSibling.appendChild(
      DOM('style', undefined, [document.createTextNode(css)])
    );
  }

  // create container with buttons
  function createHeader() {
    return DOM('header', undefined, [
      createButton('reload',  '⟳ Reload'),
      createButton('unread',  'Unread'),
      createButton('starred', '☆ Starred'),
      createButton('shared',  '⚐ Shared'),
      createButton('taggedW', '⚐ TaggedW'),
      createButton('next',    '▽ Next'),
      createButton('prev',    '△ Previous'),
      DOM('a', {
        className: 'resetView',
        href: 'http://google.com/reader/view#',
        innerHTML: 'Normal View'
      })
    ]);
  }

  function createButton(class_, text) {
    return DOM('button', {className: class_, innerHTML: text});
  }
  
  /*function createFooter() {
    return DOM('footer', undefined, [
      createButton('next', '▽ Next'),
      createButton('prev', '△ Previous')
    ]);
  }*/

  // update unread count now, every minute and on every window focus
  function initUnreadCount() {
    updateUnreadCount();
    setInterval(updateUnreadCount, 60000);
    window.addEventListener('focus', updateUnreadCount, false);
  }

  // that's how unread count is updated
  function updateUnreadCount(force) {
    
    // do not update too often, unless forced
    var time = (new Date()).getTime();
    if (force !== true && time - (updateUnreadCount.time || 0) < 60000) {
      return;
    }
    updateUnreadCount.time = time;
    
    // request data
    AjaxRequest('http://www.google.com/reader/api/0/unread-count', {
      parameters: {
        allcomments: 'true',
        output: 'json'
      },
      onSuccess: function(response) {
        var data = response.responseJSON;
        count = 0;
        
        // summarize all values for feeds (not tags/folders)
        data.unreadcounts.forEach(function(feed){
          if (feed.id.match(/^feed/)) count += feed.count;
        });
        
        // if user is not reading now, show new entries
        // NB: even if already shown 20, because existing continuation won't contain new entries
        if (currentView == 'unread' && inBackground && !currentItem && count > unreadCount) {
          actions.reload();
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
    container.previousElementSibling.firstElementChild.nextElementSibling.innerHTML = 'Unread ' + string;
  }
  
  // call continuation when subscriptions are loaded
  function ensureSubscriptions(continuation) {
    // if already loaded, call right away
    if (subscriptions) return continuation();
    
    // otherwise load data
    return AjaxRequest('http://www.google.com/reader/api/0/subscription/list', {
      parameters: {output: 'json'},
      onSuccess: function(response) {
        subscriptions = response.responseJSON.subscriptions;
        continuation();
      }
    });
  }
  
  // load entries for a view
  function getViewData(view) {
    // if greader reported there's no new entries, stop
    if (noMoreItems) return;
    
    // abort current request if any
    if (dataRequest) {
      dataRequest.onreadystatechange = undefined;
      dataRequest.abort();
      dataRequest = undefined;
    }
    
    // request data from special url for given view
    dataRequest = AjaxRequest(entriesUrl + tags[view], {
      parameters: getViewParameters(view),
      onSuccess: function(response){
        var data = response.responseJSON;
        if (!data) return;
        
        limit += 20;
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
        if (noMoreItems && container.lastChild) {
          var spacer = DOM('div', {className: 'spacer'});
          spacer.style.height = 
            container.clientHeight - (container.lastChild.clientHeight % container.clientHeight) - 20 + 'px';
          container.appendChild(spacer);
        }
        
        // clear current request
        dataRequest = undefined;
        checkNeedMoreEntries(data);
      },
      onComplete: function(request) {
        // clear current request
        if (dataRequest == this || dataRequest == request) {
            dataRequest = undefined;
        }
      },
      onFailure: updateToken.curry(getViewData.curry(view)) // ensure we have active token
    });
  };
  
  function getViewParameters(view) {
    var parameters = {n: limit};
    // add continuation if known
    if (continuation) parameters.c = continuation;
    
    // "unread" view needs special sorting and filter
    if (view == 'unread') {
      parameters.xt = tags.read; // exclude read items
      parameters.r = sort.oldestFirst;
    } else {
      parameters.r = sort.newestFirst;
    }
    
    return parameters;
  }
  
  function addEntry(item, index){
    // if userId is not yet known, try to detect it by entry tags
    checkEmptyUserId(item, index);
    
    // skip entries which are already shown
    if (displayedItems.include(item.id)) {
      return;
    }
    
    // make useful shortcuts for title and content
    item.body =
      item.content && item.content.content ||
      item.summary && item.summary.content || '';
      
    item.originalTitle = item.title;
    item.title = item.title || trimToNWords(item.body.stripTags(), 8) || '»';
    
    // check if entry needs alteration
    entryAlterations.invoke('call', null, item);
    
    // if entry matches filter, mark it as read and skip it
    if (matchesFilters(item.title, item.body)) {
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
      container.appendChild(createEntry(item));
      displayedItems.push(item.id);
    } catch (e) {
      // fail of one entry shouldn't prevent other from displaying
      LOG(e);
    }
  }
  
  function checkEmptyUserId(item, index) {
    // if userId is not yet known, try to detect it by entry tags
    if (userId == '-' && index == 0 && currentView == 'unread' && item.categories) {
      var match = item.categories.join('').match(/user\/(\d+)\/state\/com.google\/reading-list/);
      if (match) {
        // if found userId, store it and update global tags values
        userId = match[1];
        tags = initTags();
        alert('Looks like your user ID is ' + userId + '. Write this value to `userId` in settings.');
      }
    }
  }
  
  // check entry's title and body against filters
  function matchesFilters(title, body) {
    title = title.toLowerCase();
    if (titleFilters.find(function(term){ return title.include(term) })) {
      return true;
    }
    if (body && bodyFilters.find(function(term){ return body.include(term) })) {
      return true;
    }
    return false;
  }

  function createEntry(data) {
    // simplify tag detection on entry
    ['read', 'star', 'share', 'tagW'].forEach(function(tag){
      data[tag] = data.categories.include(tags[tag]);
    });
    
    // create entry's main link
    var linkProps = {innerHTML: data.title};
    if (data.alternate) {
      linkProps.href = data.alternate[0].href;
      if (!linkProps.href.match(torrentRE)) {
        linkProps.target = '_blank';
      }
    }
    var headerLink = DOM('a', linkProps);
    data.domain = headerLink.hostname;

    var container = DOM('section', {className: 'entry'}, [
      DOM('cite', {innerHTML: getAuthor(data)}),
      DOM('h2', undefined, [
        createButton('star', getButtonImage(data, 'star')),
        headerLink
      ]),
      createAnnotations(data),
      DOM('article', {innerHTML: data.body}),
      createEntryFooter(data)
    ]);
    
    // store entry's original data for future reference
    storage[data.id] = data;
    container.id = data.id;

    return container;
  }
  
  function getButtonImage(data, button) {
    switch (button) {
      case 'star':   return (data.star  ? '★' : '☆'); 
      case 'share':  return (data.share ? '⚑' : '⚐')
      case 'tagW':   return (data.tagW  ? '⚑' : '⚐'); 
      case 'edit':   return '✍'; 
    }
    return '';
  }
  
  // show entry's origin, favicon, and users who shared it
  function getAuthor(data) {
    var author = data.author ? data.author + ' @ ' : '';
    var site = data.origin.title;
    
    var favicon = 'http://www.google.com/s2/favicons?domain=' + data.domain;
    favicon = '<img src="' + favicon + '">';
    
    // replace feed name with custom feed name, if user renamed it
    var feed = subscriptions.find(function(feed){
      return feed.id == data.origin.streamId;
    });
    if (feed) {
      data.feed = feed;
      site = feed.title;
    }
    
    // users who shared entry
    var via = '';
    if (data.via) {
      via = '<br>' + data.via.pluck('title').join('<br>');
    }
    
    return author + site + favicon + via;
  }
  
  // show comments from other users
  function createAnnotations(data) {
    var annotations = document.createDocumentFragment();
    
    if (data.annotations.length || data.comments.length) {
      data.annotations.concat(data.comments).forEach(function(data){
        var text = DOM('q', {
          cite: data.author,
          innerHTML: data.content || data.htmlContent
        })
        annotations.appendChild(text);
      });
    }
    
    return annotations;
  }

  // entry footer contains buttons and tags
  function createEntryFooter(data) {
    var footer = DOM('footer', undefined, [
      createButton('star',  getButtonImage(data, 'star') + ' Star'),
      createButton('share', getButtonImage(data, 'share') + ' Share'),
      createButton('tagW',  getButtonImage(data, 'tagW') + ' TagW'),
      createButton('edit',  getButtonImage(data, 'edit') + ' Edit/Comment')
    ]);

    // filter out custom user tags, only original tags remain
    var tags = data.categories.filter(function(tag){
      return !tag.match(/^user\//);
    }).join(', ');
    
    if (tags.length) {
      var tagsSpan = DOM('span', {innerHTML: 'Tags: ' + tags});
      footer.insertBefore(tagsSpan, footer.firstChild);
    }
    
    return footer;
  }
  
  function clickHandler(event){ try{
    var target;
    target = event.findElement('section.entry a');
    if (target && !torrentRE.test(target.href)) {
      target.target = '_blank';
      target.blur();
    }
    
    target = event.findElement('section.entry');
    if (target && target != currentItem) {
      makeEntryActive(target);
    }
    
    target = event.findElement('button');
    if (target && actions[target.className]) {
      actions[target.className]();
    }
  } catch(e) { LOG(e) }}

  function keyHandler(event){ try{
    var target = event.target;
    
    if (event.ctrlKey || event.altKey) return;
    if (target && (target.nodeName.match(/input|textarea/i))) return;
    if (!event.ctrlKey && event.keyCode == 32) event.preventDefault(); // space
    
    hideShadow();
    
    if (event.keyCode == 27) { // ESC
      actions.edit(undefined, true);
      return;
    }
    
    var matched = true;
    var key = String.fromCharCode(event.keyCode).toUpperCase();
    switch (key) {
      case 'R': case 'К': actions.reload(); break;
      case 'W': case 'Ц': 
      case 'U': case 'Г': actions.unread(); break;
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
    
    if (!currentItem) return;
    
    matched = true;
    switch (key) {
      case 'K': case 'Л': actions.prev(); break;
      case 'V': case 'М': currentItem && openTab(currentItem.querySelector('a'), event); break;
      case 'C': case 'С': currentItem && openTab(currentItem.querySelectorAll('a')[1], event); break;
      //case 'W': case 'Ц': actions.tagW(); break;
      case 'S': case 'Ы': actions[event.shiftKey ? 'share' : 'star'](); break;
      case 'Y': case 'Н': actions.edit(); break;
      default: matched = false;
    }
    if (matched) {
      event.preventDefault();
    }
  } catch(e) { LOG(e) }}

  function scrollHandler(event){
    if (!currentItem) {
      makeEntryActive(container.firstElementChild);
      return;
    }
    var distance2border = Math.min(50, currentItem.clientHeight * .5);
    if (currentItem.offsetTop + currentItem.clientHeight - distance2border < container.scrollTop) {
      if (currentItem.nextElementSibling) {
        makeEntryActive(currentItem.nextElementSibling);
      }
    }
    if (currentItem.offsetTop + distance2border > container.scrollTop + container.clientHeight) {
      if (currentItem.previousElementSibling) {
        makeEntryActive(currentItem.previousElementSibling);
      }
    }
    
    checkNeedMoreEntries();
  }
  
  function checkNeedMoreEntries() {
    if (dataRequest || noMoreItems) return;
    
    if (container.scrollTop + 2 * container.clientHeight > container.scrollHeight) {
      getViewData(currentView);
    }
  }

  function resizeHandler() {
    container.style.height = window.innerHeight - document.heightDiff + 'px';

    if (!currentItem) return;
    
    container.scrollTop = currentItem.offsetTop;

    // fixate entry height to fight scroll caused by loading of skipped images
    var article = currentItem.querySelector('article');
    if (article.style.height) {
      article.style.height = article.scrollHeight + 'px';
    }
  }

  function resetView() {
    continuation = undefined;
    limit = 20;
    displayedItems = [];
    noMoreItems = false;
  }
  
  function resetContainer() {
    currentItem = undefined;
    container.innerHTML = 'Loading...';
  }
  
  function hideShadow() {
    shadow.style.height = 0;
  }
  
  function switchToView(view) {
    if (currentView == view) return;
    
    resetView();
    resetContainer();

    container.previousElementSibling.removeClassName(currentView);
    container.previousElementSibling.addClassName(view);
    
    currentView = view;
    getViewData(currentView);
  }

  function makeEntryActive(entry) {
    if (currentItem) {
      currentItem.removeClassName('active');
      actions.edit(undefined, true);
    }
      
    currentItem = entry;
    currentItem.addClassName('active');
    
    markAsRead(currentItem);
    currentItem.previousSiblings().forEach(markAsRead); 
    
    if (currentItem.nextSiblings().length <= 3 && !dataRequest) {
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
    if (!data.read) {
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
      srcTitle: (data.feed || data.origin).title,
      srcUrl: data.origin.htmlUrl
    };
    if (!share) {
      parameters.tags = tags.tagW;
    }

    return AjaxRequest(editEntryUrl, {
      method: 'post',
      parameters: parameters,
      onSuccess: function() {
        if (entry != currentItem) return;
        actions.edit(undefined, true);
        
        container.insertBefore(DOM('section', {className: 'entry'}, [
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
    
    var parameters = {
      T: token,
      i: data.id,
      s: data.origin.streamId
    };
    parameters[state ? 'r' : 'a'] = tags[tag]; 
    
    AjaxRequest(editTagUrl, {
      method: 'post',
      parameters: parameters,
      onSuccess: function() {
        data[tag] = !state;
        entry.querySelectorAll && entry.querySelectorAll('button.' + tag).forEach(function(button){
          button.innerHTML = button.innerHTML.replace(/^./, getButtonImage(data, tag));
        });
      },
      onFailure: updateToken.curry(toggleEntryTag.curry(entry, tag))
    });
  }
  
  function updateToken(oncomplete) {
    AjaxRequest('http://www.google.com/reader/api/0/token', {
      onSuccess: function(response) {
        token = response.responseText;
        oncomplete();
      }
    })
  }
  
  
  function imageHandler(entry, event) {
    // ignore not yet loaded images
    if (!this.height) return;
    
    // handler must be successfully called only once
    this.onreadystatechange = undefined;
    this.style.height = this.height;
  
    // ignore images loaded in entries below current
    if (currentItem.nextSiblings().include(entry)) return;
      
    // adjust article height
    var article = entry.querySelector('article');
    var height = parseInt(article.style.height);
    var diff = article.scrollHeight - height;
    
    article.style.height = height + diff + 'px';
  
    // if this image is in one of previous entries, scroll container and exit
    if (currentItem != entry) {
      container.scrollTop += diff;
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
    var entryVisibleOffset = entry.offsetTop - container.scrollTop;
    if (entryVisibleOffset < 0 &&
        entryVisibleOffset + imageOffset < container.clientHeight * .2) {
      container.scrollTop += diff;
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
  
  function logException(request, exception) {
    LOG(exception);
  }
  
  function scrollTo(offset){ container.scrollTop = offset; return; 
    var steps = 15;
    
    // interval handler
    var interval;
    // steps indexer
    var currentStep = 0;

    // get current window scrolling position
    var startOffset = container.scrollTop;

    // calculate scroll distance and maximum scroll speeds
    var deltaY = offset  - startOffset;
    var maxSpeedY = deltaY * 2 / steps;   
    
    // if both scroll distances are too small, use simple scroll 
    if (deltaY < steps) {
      container.scrollTop = offset;
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
      // new scroll coords 
      var y = startOffset  + deltaY / 2 + factor * maxSpeedY;
      container.scrollTop = parseInt(y);
    }, 10);
  }
  
  
  // on button click get its className and call corresponding handler
  actions = {
    
    // view switchers
    unread: switchToView.curry('unread'), 
    starred: switchToView.curry('star'), 
    shared: switchToView.curry('share'), 
    taggedW: switchToView.curry('tagW'),
    
    reload: function() {
      resetView();
      resetContainer();
      updateUnreadCount(true);
      getViewData(currentView);
    },
    
    // star/share management
    star: function(){
      toggleEntryTag(currentItem, 'star');
    },
    share: function(){
      if (checkIfAltered(currentItem, true)) return;
      
      toggleEntryTag(currentItem, 'share');
      toggleEntryTag(currentItem, 'like');
    },
    tagW: function(){ // this one adds specific tag
      if (checkIfAltered(currentItem)) return;

      toggleEntryTag(currentItem, 'tagW');
      toggleEntryTag(currentItem, 'like');
    },

    // dumb "show next/previous entry" buttons
    next: function() {
      if (!currentItem) {
        makeEntryActive(container.firstElementChild);
      } else {
        if (currentItem.nextElementSibling && /\bentry\b/i.test(currentItem.nextElementSibling.className)) { 
          makeEntryActive(currentItem.nextElementSibling);
          container.scrollTop = currentItem.offsetTop;
        }
      }
    },
    prev: function() {
      if (!currentItem) return;
      if (currentItem.previousElementSibling) {
        makeEntryActive(currentItem.previousElementSibling);
      }
      container.scrollTop = currentItem.offsetTop;
    },
    
    // smart paging: if current entry is short, show next, but otherwise
    // scroll current entry to show next page or next large image
    space: function(event) {
      
      // shift+space = previous entry
      if (event.shiftKey && currentItem) {
        actions.prev();
        return;
      }
      // first use focuses first item
      if (!currentItem) {
        actions.next();
        return;
      }
      
      // find all images in article
      var viewHeight = container.clientHeight;
      var images = currentItem.querySelectorAll('article img');
      // find large images (height > half of a viewport height)
      var largeImages = images.map(function(image){
        return image.height > viewHeight * .5;
      });
      
      if (largeImages.length > 0) {
        // try finding large image which *is* on screen, but still needs scrolling
        var foundIndex = undefined;
        var found = largeImages.find(function(image, index){ 
          var viewportImageTop = image.offsetTop - container.scrollTop;
          var viewportImageBottom = viewportImageTop + image.height;
          
          if (viewportImageTop < viewHeight * .5 && viewportImageBottom > viewHeight) {
            foundIndex = index;
          }
          return foundIndex != undefined;
        });
        
        if (found) {
          var invisibleHeight = found.offsetTop + found.height - container.scrollTop - viewHeight;
          
          if (invisibleHeight > viewHeight) {
            // can scroll whole screen
            container.scrollTop += viewHeight;
          } else if (invisibleHeight > viewHeight * .4) {
            // instantly show remaining part
            container.scrollTop = found.offsetTop + found.height - viewHeight;
          } else { 
            // smooth scroll to show remaining part 
            scrollTo(found.offsetTop + found.height - viewHeight);
          }
          
          return;
        }
        
        // try finding large image which *will be* on screen
        var nextIndex = undefined;
        var next = largeImages.find(function(image, index){ 
          var viewportImageTop = image.offsetTop - container.scrollTop;
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
            var diff = (next.offsetTop - Math.max(0, viewHeight - next.height) / 4) - container.scrollTop;
            if (diff < viewHeight * .5) {
              scrollTo(container.scrollTop + diff);
            } else {
              container.scrollTop += diff;
            }
          } else {
            var viewportImageTop = next.offsetTop - container.scrollTop;
            if (viewportImageTop < viewHeight * .5) {
              // large part already visible, smooth scroll needed
              scrollTo(next.offsetTop);
            } else {
              // can do instant scroll
              container.scrollTop = next.offsetTop;
            }
          }
          return;
        }
      }
      
      var invisibleHeight = (currentItem.offsetTop + currentItem.clientHeight) -
        (container.scrollTop + container.clientHeight);
        
      // if only buttons line is invisible, go to next entry
      if (invisibleHeight < 30) {
        actions.next();
      
      // if there's no full page to show,
      // smooth scroll to show remainder
      // and use shadow to indicate unread part
      } else if (invisibleHeight < container.clientHeight) {
        scrollTo(container.scrollTop + invisibleHeight);
        shadow.style.height = container.clientHeight - invisibleHeight - 40 + 'px';
        setTimeout(hideShadow, 1000);
        
      // otherwise show next page
      // or smaller image that's partially shown
      } else {
        var targetScroll = container.scrollTop + viewHeight;
        
        // find image that's already partially shown and is less then viewHeight
        images.find(function(image){ 
          if (image.offsetTop <= targetScroll && image.offsetTop + image.height > targetScroll) {
            if (image.height > viewHeight && image.offsetTop < targetScroll) {
              return false;
            }
            targetScroll = image.offsetTop - 20; // +- magic neutralizes effect of scrolling not whole viewHeight
            return true;
          } else return false;
        });
        
        // show next page, leaving last line of current page on the screen
        container.scrollTop = targetScroll + 20;
      }
    },
    
    // create new shared entry with altered title/content
    // adding comment is creating new entry too
    // `forceHide` is used to hide inputs i.e. when moving to another entry
    edit: function(event, forceHide) {
      if (!currentItem || !currentItem.id) return;
      
      var data = storage[currentItem.id];
      if (!data.inputs && forceHide) return;

      var title = currentItem.querySelector('a');
      var body  = currentItem.querySelector('article');
      
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
    }
  };
}

function lib() {
  // Following code is Prototype.js replacement for stupid Firefox's GreaseMonkey 

  window.DOM = function(name, attributes, children) {
    var node = document.createElement(name);
    if (attributes) {
      for (name in attributes) {
        node[name] = attributes[name];
      }
    }
    if (children) {
      children.forEach(function(child){
        node.appendChild(child);
      });
    }
    return node;
  };
  
  Array.toArray = function(list) {
    var array = [];
    for (var index = 0; index < list.length; ++index) {
      array.push(list[index]);
    }
    return array;
  };
  
  Array.NodeListToArray = function(list) {
    var array = [];
    for (var index = 0; index < list.length; ++index) {
      array.push(list.item(index));
    }
    return array;
  }

  Array.prototype.invoke = function(method) {
    var args = Array.toArray(arguments); // without this .shift() changes value of `method`
    args.shift();
    
    return this.map(function(element){
      element[method].apply(element, args);
    });
  };
  
  Array.prototype.pluck = function(name) {
    return this.map(function(element){
      return element[name];
    });
  };
  
  Array.prototype.find = function(condition) {
    for (var index = 0; index < this.length; ++index) {
      if (condition(this[index])) {
        return this[index];
      }
    }
    return undefined;
  };
  
  Array.prototype.include = function(what) {
    for (var index = 0; index < this.length; ++index) {
      if (this[index] === what) {
        return true;
      }
    }
    return false;
  };

  // gecko doesn't allow patching of querySelectorAll,
  // but allows to bring Array methods to NodeList
  'invoke pluck find include filter forEach map'.split(' ').forEach(function(method){
    NodeList.prototype[method] = function(what) {
      return Array.NodeListToArray(this)[method](what);
    }
  });
  
  String.prototype.include = function(what) {
    return this.indexOf(what) > -1;
  };
  
  String.prototype.stripTags = function(what) {
    return this.replace(/<\/?[^>]+>/gi, '');
  };
  
  Function.prototype.curry = function() {
    var fun = this;
    var args = Array.toArray(arguments); // only Opera supports .concat for arguments
    return function() {
      return fun.apply(null, args.concat(Array.toArray(arguments)));
    }
  };
  
  Event.prototype.findElement = function(selector) {
    var matches = document.body.querySelectorAll(selector);
    var target = this.target;
    while (target && !matches.include(target)) {
      target = target.parentNode;
    }
    return target;
  };
  
  (function(){
    // in Opera querySelectorAll returns StaticNodeList, which is unavailable for
    // monkey-patching, thus we patch querySelectorAll itself
    var qsa = HTMLElement.prototype.querySelectorAll;
    if (qsa && qsa.toString().match(/native|source/)) { // ignore maemo
      HTMLElement.prototype.querySelectorAll = function() {
        return Array.NodeListToArray(qsa.apply(this, arguments));
      };
    }
  })();
  
  HTMLElement.prototype.addClassName = function(class_) {
    this.className += ' ' + class_;
  };
  
  HTMLElement.prototype.removeClassName = function(class_) {
    this.className = this.className.replace(new RegExp('\\b' + class_ + '\\b', 'g'), '');
  };
  
  HTMLElement.prototype.previousSiblings = function(class_) {
    var siblings = Array.toArray(this.parentNode.childNodes);// NB: <section> doesn't go to .children :(
    return siblings.slice(0, siblings.indexOf(this));
  };
  
  HTMLElement.prototype.nextSiblings = function(class_) {
    var siblings = Array.toArray(this.parentNode.childNodes); // NB: <section> doesn't go to .children :(
    return this.nextElementSibling ? siblings.slice(siblings.indexOf(this) + 1) : [];
  };
  
  window.AjaxRequest = function (url, options) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
      if (request.readyState < 4) return;
      
      try {
        if (request.status != 200) {
          options.onFailure && options.onFailure();
        } else {
          try {
            request.responseJSON = eval('(' + request.responseText + ')');
          } catch (e) {}
          options.onSuccess && options.onSuccess(request);
        }
        options.onComplete && options.onComplete(request);
  
      } catch (e) {
        LOG(e);
      }
    };
    
    var method = (options.method || 'get').toUpperCase();
    
    options.parameters = options.parameters || {};
    options.parameters.client = options.parameters.client || 'userscript';
    options.parameters.ck = options.parameters.ck || (new Date()).getTime();
    
    var params = [];
    for (var param in options.parameters) {
      params.push(param + '=' + encodeURIComponent(options.parameters[param]));
    }
    params = params.join('&');
    if (method == 'GET' && params) {
      url += '?' + params;
    }
    
    request.open(method, url, true);
    if (method == 'POST') {
      request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset=UTF-8');
    }
    request.send(method == 'POST' ? params : null);
    
    return request;
  }

  window.LOG = function(message) {
    if (window.opera) {
      opera.postError(message);
    } else if (window.console) {
      console.log(message);
    } else {
      alert(message);
    }
  }

}
function maemo() {
  // patch older geckos

  if (!document.body.previousElementSibling) {
    HTMLElement.prototype.__defineGetter__('nextElementSibling', function() {
      var node = this.nextSibling;
      while (node && node.nodeType != 1) node = node.nextSibling;
      return node;
    });
    HTMLElement.prototype.__defineGetter__('previousElementSibling', function() {
      var node = this.previousSibling;
      while (node && node.nodeType != 1) node = node.previousSibling;
      return node;
    });
    HTMLElement.prototype.__defineGetter__('firstElementChild', function() {
      var node = this.firstChild;
      while (node && node.nodeType != 1) node = node.nextSibling;
      return node;
    });
  }

  (function(){
    if (!HTMLElement.prototype.querySelector) {
      // quite dumb but small and sufficient selector implementation
      function findParent(element, node){
        while (node && node.parentNode != element) {
          node = node.parentNode;
        }
        return node;
      }
      function selectAll(selector) {
        selector = selector.replace(/.* /, '');
        var tag = selector.replace(/\W.*$/, '');
        var class_ = (tag != selector) ? selector.replace(/^\w+\./, '') : undefined;
        
        var nodes = Array.NodeListToArray(document.getElementsByTagName(tag));
        if (!class_) return nodes;
        
        class_ = new RegExp('\\b' + class_ + '\\b', 'i');
        return nodes.filter(function(node){ return class_.test(node.className); });
      }
      HTMLElement.prototype.querySelector = function(selector) {
        return selectAll(selector).find(findParent.curry(this));
      }
      HTMLElement.prototype.querySelectorAll = function(selector) {
        return selectAll(selector).filter(findParent.curry(this));
      };
    }
  })();
}

var script = document.createElement('script');
script.innerHTML = maemo.toString() + 'maemo();';
document.body.appendChild(script);

function onload() {
  lib();
  ui();
}

if (!('readyState' in document)) {
  // GreaseMonkey, fuck you very much! I don't need your overprotection.
  var script = document.createElement('script');
  script.innerHTML =
    defineSettings.toString() + lib.toString() + ui.toString() +
    'defineSettings(); lib(); ui();';
  document.body.appendChild(script);
  
} else if (document.readyState.match(/complete|loaded/)) {
  onload();
  
} else {
  window.addEventListener('DOMContentLoaded', onload, false);
}

window.opera && window.opera.addEventListener(
  'BeforeExternalScript',
  function(event){
    var re = new RegExp('http://www.google.com/reader/ui/');
    if (re.test(event.element.src)) event.preventDefault();
    window._FR_scrollMain = function(){};
  },
  false);

})();