function getSettings() {

  var settings = {

    // only required to be loaded on 404 url, i.e. http://www.google.com/reader/view/1
    userId: '',

    // lowercase words to filter entries out by title
    titleFilters: [],

    // words to filter entries out by body (html included)
    bodyFilters: [],

    // your device screen's horizontal resolution
    mobileViewPort: '800x480',

    // filters to manipulate on entry content
    // NB: set data.altered = true if you want these changes to be shared when you click "share"
    entryHtmlAlterations: [],
    entryDomAlterations: [
      // if image is not loaded in 10 seconds, replace it with link
      function(item, article) {
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
    ],
    
    // add values as 'url substring': 'css selector' to directly load content from pages
    // to use that feature remove all @include lines from the beginning of file
    contentProxySelectors: {}

  };

  var parts = settings.mobileViewPort.split('x');
  settings.mobileViewPort = {
    max: Math.max(parts[0], parts[1]),
    min: Math.min(parts[0], parts[1])
  };
  
  settings.contentProxyDomains = [];
  for (var urlPart in settings.contentProxySelectors) settings.contentProxyDomains.push(urlPart);
  
  return settings;
}
