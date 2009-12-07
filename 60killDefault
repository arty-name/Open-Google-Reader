window.opera && window.opera.addEventListener(
  'BeforeExternalScript',
  function(event){
    var re = new RegExp('http://www.google.com/reader/ui/');
    if (re.test(event.element.src)) event.preventDefault();
    window._FR_scrollMain = function(){};
  },
  false);

