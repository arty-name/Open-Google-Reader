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
// @include      https://www.google.com/reader/view/
// @include      https://www.google.com/reader/view/1
// @run-at       document-start
// ==/UserScript==

(function(){

// OVERVIEW
// To get general idea of how that script works,
// see OVERVIEW below or in file 30ui

if (!document.location.href.match(/^https?:..www.google.com.reader.view.1?$/)) return;

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
settings.css =
"html, body {" +
"  margin: 0;" +
"  padding: 0;" +
"}" +
"" +
"body {" +
"  padding-top: 25px;" +
"  font-family: Georgia, serif;" +
"}" +
"" +
"body > header {" +
"  display: block;" +
"  position: fixed;" +
"  top: 0;" +
"  left: 0;" +
"  right: 0;" +
"  height: 25px;" +
"  z-index: 100;" +
"  background-color: #c2cff1;" +
"}" +
"" +
"body > header > button.unread, " +
"body > header > button.starred, " +
"body > header > button.shared, " +
"body > header > button.friends {" +
"  margin: 0;" +
"  border-radius: 5px 5px 0 0;" +
"  -moz-border-radius: 5px 5px 0 0;" +
"  border: 1px solid #c2cff1;" +
"  height: 26px;" +
"  background-color: #ebeff9;" +
"}" +
"" +
"body > header > button.friends {" +
"  margin-left: .5em;" +
"}" +
"" +
"body > header > button.shared {" +
"  margin-right: .5em;" +
"}" +
"" +
"body>header.unread button.unread, body>header.star button.starred, body>header.share button.shared, body>header.friends button.friends {" +
"  font-weight: bold;" +
"  background-color: white;" +
"  border-bottom-color: white;" +
"}" +
"" +
"body > header > a.resetView {" +
"  font-family: sans-serif;" +
"  position: absolute;" +
"  right: 0;" +
"  color: white;" +
"}" +
"" +
"body.mobile > header > a.resetView {" +
"  display: none;" +
"}" +
"" +
"body.mobile > header > button {" +
"  padding: 2px 1px;" +
"  font-size: .95em;" +
"}" +
"" +
"body.mobile article img {" +
"  max-width: 100%;" +
"}" +
"" +
"body > div.container {" +
"  position: relative;" +
"  padding: 0 .5em;" +
"}" +
"" +
"div.shadow {" +
"  position: absolute;" +
"  top: 0;" +
"  width: 100%;" +
"  background: black;" +
"  opacity: .5;" +
"}" +
"" +
"section.entry {" +
"  padding-left: 1.4em;" +
"  padding-right: .5em;" +
"  display: block;" +
"  border: 0 solid #c2cff1;" +
"  border-bottom-width: 2px;" +
"  margin-bottom: .2em;" +
"  width: 95%;" +
"}" +
"" +
"body.mobile section.entry {" +
"  padding: 0;" +
"  width: auto;" +
"}" +
"" +
"section.entry.active {" +
"  border-color: #70778c;" +
"}" +
"" +
"body.mobile section.entry > h2 {" +
"  font-size: 1.2em;" +
"}" +
"" +
"section.entry > h2 {" +
"  font-family: sans-serif;" +
"  margin-top: .1em;" +
"  margin-bottom: .3em;" +
"  margin-left: .3em;" +
"  text-indent: -1.4em;" +
"}" +
"" +
"section.entry > h2 * {" +
"  display: inline;" +
"}" +
"" +
"section.entry > h2 > a {" +
"  text-decoration: none;" +
"  line-height: 1em;" +
"}" +
"" +
"section.entry > h2 > button {" +
"  font-size: inherit;" +
"  width: 1em;" +
"  padding-right: 1.1em;" +
"}" +
"" +
"body.mobile section.entry > h2 > button {" +
"  visibility: hidden;" +
"}" +
"" +
"section.entry > h2 > input {" +
"  width: 95%;" +
"  font-size: inherit;" +
"}" +
"" +
"section.entry > article {" +
"  display: block;" +
"  overflow-x: auto;" +
"  clear: both;" +
"}" +
"" +
"section.entry > article > p {" +
"  line-height: 1.15em;" +
"}" +
"" +
"section.entry > cite, section.entry > article, section.entry > footer {" +
"  margin-left: .5em;" +
"}" +
"" +
"section.entry > cite {" +
"  float: right;" +
"  text-align: right;" +
"}" +
"" +
"section.entry > cite > img {" +
"  margin: 6px;" +
"  vertical-align: middle;" +
"}" +
"" +
"section.entry > dl.comments {" +
"  display: block;" +
"  margin: .5em;" +
"  border: 2px dotted #70778c;" +
"  border-radius: 10px;" +
"  -moz-border-radius: 10px;" +
"  padding: .5em .5em 0 .5em;" +
"}" +
"" +
"section.entry > dl.comments > dt {" +
"  font-weight: bold;" +
"}" +
"" +
"section.entry > dl.comments > dt:after {" +
"  content: ':';" +
"}" +
"" +
"section.entry > dl.comments > dd {" +
"  margin-bottom: .5em;" +
"}" +
"" +
"section.entry > dl.comments > dd.addcomment.hidden .input {" +
"  display: none;" +
"}" +
"" +
"section.entry > footer {" +
"  clear: both;" +
"  display: block;" +
"  margin-left: 0;" +
"}" +
"" +
"section.entry > footer > span.buttons {" +
"  white-space: nowrap;" +
"}" +
"" +
"section.entry > footer > span.tags {" +
"  float: right;" +
"  opacity: .5;" +
"}" +
"" +
"section.entry div.spacer {" +
"  width: 90%;" +
"}" +
"" +
"body.mobile section.star button.star, body.mobile section.share button.share {" +
"  font-weight: bold;" +
"}" +
"" +
"button.star {" +
"  color: #8c8211;" +
"}" +
"" +
"button.share {" +
"  color: #8c6041;" +
"}" +
"" +
"button.edit, button.comment {" +
"  color: #4c8c4c;" +
"}" +
"" +
"button.star, button.share, button.edit, button.comment, button.cancel {" +
"  background: none;" +
"  border: none;" +
"}" +
"" +
"button {" +
"  cursor: pointer;" +
"}" +
"" +
"textarea {" +
"  width: 95%;" +
"}" +
"";
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

  // words to filter entries out by body (html included)
  var bodyFilters = settings.bodyFilters || [];

  // regular expression to detect links which do not get target=_blank
  var torrentRE = settings.torrentRE || /b41b964aeda4a6d58bb22fcbc345248a/;
  
  // filters to manipulate on entry content
  // NB: set data.altered = true if you want these changes to be shared when you click "share"
  var entryAlterations = settings.entryAlterations || [];
  

  // static user id 
  userId = userId || window._USER_ID || (window.localStorage && localStorage.userId) || '-';
  
  // session token (can be updated)
  var token = window._COMMAND_TOKEN;
  
  var mobile = !!/mobi/i.test(window.navigator.userAgent);

  // sort orders
  var sort = {
    oldestFirst: 'o',
    newestFirst: 'd'
  }; 
  
  // various "tags": some to filter entries, some to assign
  var tags = initTags();  
  
  
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
  
  // subscriptions data
  var subscriptions = window._STREAM_LIST_SUBSCRIPTIONS && _STREAM_LIST_SUBSCRIPTIONS.subscriptions;
  
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

  // attach listeners for window scroll, resize, blur and focus
  window.addEventListener('scroll', scrollHandler, false);
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
      friends: tagPrefix + 'broadcast-friends-comments'
    }
  }

  function createLayout() {
    clearDocument(); // remove existing body children
    addStyles(); // add own css styles

    container = DOM('div', {className: 'container', innerHTML: 'Loading...'});

    var body = document.body;
    body.appendChild(createHeader()); // header contains buttons
    body.appendChild(container);

    // this one will shadow read portion of entry
    shadow = DOM('div', {className: 'shadow'});
    body.appendChild(shadow);

    // this will let body scroll a little more
    spacer = DOM('div', {className: 'spacer'});
  }

  // remove existing body children
  function clearDocument() {
    var body = document.body;
    body.innerHTML = '';
    body.removeAttribute('text');
    body.removeAttribute('bgcolor');
    body.className = mobile ? 'mobile' : '';

    var head = body.previousElementSibling;
    while (head.firstChild) head.removeChild(head.firstChild);
    head.appendChild(DOM('title'));
    head.appendChild(DOM('link', {href: '/reader/ui/favicon.ico', rel: 'SHORTCUT ICON'}));
    
    if (mobile) {
      head.appendChild(DOM('meta', {name: 'viewport', content: 'width=400, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'}));
    }

    Array.prototype.slice.call(document.styleSheets, 0).forEach(function(ss){ ss.disabled = true; });
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
      createButton('friends', titles.friends),
      createButton('unread',  titles.unread),
      createButton('starred', titles.starred),
      createButton('shared',  titles.shared),
      createButton('next',    titles.next),
      createButton('prev',    titles.prev),
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
        var html = mobile ? 'Comments ' : '✉ ';
        if (friends) html += friends;
        container.
          previousElementSibling.
          firstElementChild.
          nextElementSibling.
          innerHTML = html;

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
    container.
      previousElementSibling.
      firstElementChild.
      nextElementSibling.
      nextElementSibling.
      innerHTML = 'Unread ' + string;
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
      container.appendChild(createEntry(item));
      displayedItems.push(item.id);
    } catch (e) {
      // fail of one entry shouldn't prevent other from displaying
      LOG(e);
    }

    // if image is not loaded in 10 seconds, replace it with link
    var images = container.lastChild.
      querySelector('article').
      querySelectorAll('img');
    images.forEach(function(image){
      if (!image.complete) setTimeout(function(){
        if (image.complete) return;
        image.parentNode.replaceChild(
          DOM('a', {href: image.src, innerHTML: '[unavailable]'}),
          image
        );
      }, 10000);
    });
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
    if (titleFilters.find(function(term){ return title.include(term) })) {
      return true;
    }
    return body && bodyFilters.find(function(term) {
      return body.include(term)
    });
  }

  function createEntry(data) {
    var classes = [];
    
    // simplify tag detection on entry
    ['read', 'star', 'share'].forEach(function(tag){
      data[tag] = data.categories.include(tags[tag]);
      if (data[tag]) classes.push(tag);
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

    var container = DOM('section', {className: 'entry ' + classes.join(' ')}, [
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
    var author = data.author ? data.author + ' @ ' : '';
    var site = data.origin.title;
    
    var favicon = 'http://favicon.yandex.net/favicon/' + data.domain;
    favicon = '<img src="' + favicon + '">';
    if (mobile) favicon = '';
    
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
    
    return favicon + author + site + via;
  }
  
  // show comments from other users
  function createAnnotations(data) {
    var annotations = document.createDocumentFragment();
    
    if (data.annotations.length || data.comments.length) {
      annotations = DOM('dl', { className: 'comments' });
      data.annotations.concat(data.comments).forEach(function(data){
        annotations.appendChild(DOM('dt', { innerHTML: data.author }));
        annotations.appendChild(DOM('dd', { innerHTML: data.content || data.htmlContent }));
      });
      annotations.appendChild(DOM('dd', { className: 'addcomment'}, [
        DOM('button', { className: 'comment', innerHTML: (mobile ? '' : '✉ ') + 'Add comment' })
      ]));
    }
    
    return annotations;
  }

  // entry footer contains buttons and tags
  function createEntryFooter(data) {
    var footer = DOM('footer', undefined, [DOM('span', {className: 'buttons'}, [
      createButton('star',  getButtonImage(data, 'star') + ' Star'),
      createButton('share', getButtonImage(data, 'share') + ' Share'),
      createButton('edit',  getButtonImage(data, 'edit') + ' Edit/Comment')
    ])]);

    // filter out custom user tags, only original tags remain
    var tags = data.categories.filter(function(tag){
      return !tag.match(/^user\//);
    }).join(', ');
    
    if (tags.length) {
      var tagsSpan = DOM('span', {className: 'tags', innerHTML: 'Tags: ' + tags});
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
    if (target && target != currentEntry) {
      makeEntryActive(target);
    }
    
    target = event.findElement('button');
    if (target && actions[target.className]) {
      actions[target.className](event);
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
  } catch(e) { LOG(e) }}

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

  function updateAllCommentsViewTime() {
    APIRequest('preference/set', { method: 'post', parameters: {
      T: token,
      k: 'last-allcomments-view',
      v: (new Date()).getTime() * 1000 // right - that's microseconds
    }});
  }

  function resizeHandler() {
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

    container.previousElementSibling.removeClassName(currentView);
    container.previousElementSibling.addClassName(view);
    
    currentView = view;
    if (window.localStorage) localStorage.currentView = view;
    getViewData(currentView);
  }

  function makeEntryActive(entry) {
    if (currentEntry) {
      currentEntry.removeClassName('active');
      actions.edit(undefined, true);
    }
      
    currentEntry = entry;
    currentEntry.addClassName('active');
    
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

    return APIRequest('item/edit', {
      method: 'post',
      parameters: parameters,
      onSuccess: function() {
        if (entry != currentEntry) return;
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
    
    APIRequest('edit-tag', {
      method: 'post',
      parameters: parameters,
      onSuccess: function() {
        data[tag] = !state;
        entry[state ? 'removeClassName' : 'addClassName'](tag);
        entry.querySelectorAll && entry.querySelectorAll('button.' + tag).forEach(function(button){
          button.innerHTML = button.innerHTML.replace(/^./, getButtonImage(data, tag));
        });
      },
      onFailure: updateToken.curry(toggleEntryTag.curry(entry, tag))
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
    if (currentEntry.nextSiblings().include(entry)) return;
      
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
              LOG(response.statusText);
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
        if (currentEntry.nextElementSibling && /\bentry\b/i.test(currentEntry.nextElementSibling.className)) { 
          makeEntryActive(currentEntry.nextElementSibling);
          body.scrollTop = currentEntry.offsetTop;
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
      dd.className = 'addcomment'; // removes possible 'hidden' class to show all inputs
      
      var textarea = button.previousElementSibling;

      if (!textarea) {
        textarea = DOM('textarea', { className: 'input', rows: 4 });
        dd.insertBefore(textarea, button);

        var cancel = DOM('button', { className: 'cancel input', innerHTML: 'Cancel' });
        cancel.addEventListener('click', function(){ dd.className += ' hidden'; }, false);
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
          dd.className += ' hidden';

          dd.parentNode.insertBefore(DOM('dt', { innerHTML: 'you' }), dd);
          dd.parentNode.insertBefore(DOM('dd', { innerHTML: response.responseJSON.htmlContent }), dd);
          updateAllCommentsViewTime();
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
  
  function cloneArray(array) {
    return Array.prototype.slice.call(array, 0);
  };

  Array.prototype.invoke = function(method) {
    var args = cloneArray(arguments); // without this .shift() changes value of `method`
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
      return Array.prototype[method].call(this, what);
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
    var args = cloneArray(arguments); // only Opera supports .concat for arguments
    return function() {
      return fun.apply(null, args.concat(cloneArray(arguments)));
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
        return Array.prototype.slice.call(qsa.apply(this, arguments), 0);
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
    var siblings = cloneArray(this.parentNode.childNodes);// NB: <section> doesn't go to .children :(
    return siblings.slice(0, siblings.indexOf(this));
  };
  
  HTMLElement.prototype.nextSiblings = function(class_) {
    var siblings = cloneArray(this.parentNode.childNodes); // NB: <section> doesn't go to .children :(
    return this.nextElementSibling ? siblings.slice(siblings.indexOf(this) + 1) : [];
  };
  
  window.APIRequest = function (url, options) {
    return window.AjaxRequest('/reader/api/0/' + url, options);
  };
  
  window.AjaxRequest = function (url, options) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
      if (request.readyState < 4) return;
      
      try {
        if (request.status == 403) {
          if (confirm('Re-authorization needed. Go to login page?')) {
            window.location = 
              'https://www.google.com/accounts/ServiceLogin?service=reader&btmpl=mobile&ltmpl=mobilex&' + 
              'continue=' + encodeURIComponent(window.location.href);
          }
        } else if (request.status != 200) {
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
  };

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

function onload() {
  lib();
  ui();
}

if (typeof GM_xmlhttpRequest != "undefined" && !navigator.userAgent.match(/Chrome/)) {
  // GreaseMonkey, fuck you very much! I don't need your overprotection.
  var script = document.createElement('script');
  script.innerHTML =
    defineSettings.toString() + lib.toString() + ui.toString() +
    'defineSettings(); lib(); ui();';
  document.body.appendChild(script);
  setTimeout(function(){
    var style = document.createElement('style');
    style.innerHTML = settings.css;
    document.body.previousElementSibling.appendChild(style);
  }, 100);
  
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