defineSettings();

function defineSettings() {

  settings = {

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
    entryDomAlterations: []

  };

  var parts = settings.mobileViewPort.split('x');
  settings.mobileViewPort = {
    max: Math.max(parts[0], parts[1]),
    min: Math.min(parts[0], parts[1])
  };

}
