
function onload() {
  lib();
  ui(getSettings(), getStyles());
}

if (document.location.href.match(/^https?:..www.google.com.reader.view.1?$/)) {

  if (typeof GM_xmlhttpRequest != "undefined" && !navigator.userAgent.match(/Chrome/)) {
    // GreaseMonkey, fuck you very much! I don't need your overprotection.
    var script = document.createElement('script');
    script.innerHTML =
      getSettings.toString() + getStyles.toString() + lib.toString() + ui.toString() +
      'lib(); ui(getSettings(), getStyles());';
    var interval = setInterval(function(){
      if (!document.body) return;
   		clearInterval(interval);
      document.body.appendChild(script);
    }, 1);
    
  } else if (document.readyState.match(/complete|loaded/)) {
    onload();
    
  } else {
    window.addEventListener('DOMContentLoaded', onload, false);
  }

}

if (window.top != window) {
  proxyContent(getSettings());
}
