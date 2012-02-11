
function onload() {
  lib();
  ui(getSettings(), getStyles());
}

if (typeof GM_xmlhttpRequest != "undefined" && !navigator.userAgent.match(/Chrome/)) {
  // GreaseMonkey, fuck you very much! I don't need your overprotection.
  var script = document.createElement('script');
  script.innerHTML =
    getSettings.toString() + getStyles.toString() + lib.toString() + ui.toString() +
    'lib(); ui(getSettings(), getStyles());';
  document.body.appendChild(script);
  
} else if (document.readyState.match(/complete|loaded/)) {
  onload();
  
} else {
  window.addEventListener('DOMContentLoaded', onload, false);
}

