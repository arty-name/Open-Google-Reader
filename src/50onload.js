
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
