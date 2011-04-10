defineSettings();

function defineSettings() {

settings = {

  // only required to be loaded on 404 url, i.e. http://www.google.com/reader/view/1
  userId: '',
  
  // lowercase words to filter entries out by title
  titleFilters: [],
  
  // words to filter entries out by body (html included)
  bodyFilters: [],
  
  // filters to manipulate on entry content
  // NB: set data.altered = true if you want these changes to be shared when you click "share"
  entryHtmlAlterations: [],
  entryDomAlterations: []
  
};

}
