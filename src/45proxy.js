function proxyContent(settings) {
  var urlPart = settings.contentProxyDomains.filter(function(urlPart) {
    return (location.href.indexOf(urlPart) > -1);
  })[0];
  if (!urlPart) return;
  
  var selector = settings.contentProxySelectors[urlPart];

  function forEach(nodes, callback) {
    [].forEach.call(nodes, callback);
  }

  function getContent() {
    var match = document.querySelectorAll(selector);
    if (!match || !match.length) return;

    var html = '';
    forEach(match, function(node) {
      
      forEach(node.querySelectorAll('script'), function(script) {
        script.parentNode.removeChild(script);
      });

      node.src && node.setAttribute('src', node.src);
      forEach(node.querySelectorAll('*[src]'), function(node) {
        node.setAttribute('src', node.src);
      });

      node.href && node.setAttribute('href', node.href);
      forEach(node.querySelectorAll('*[href]'), function(node) {
        node.setAttribute('href', node.href);
      });

      forEach(node.querySelectorAll('*[style]'), function(node) {
        node.setAttribute('style', '');
      });

      // TODO: check for 'onload' etc attributes

      html += node.outerHTML;
    });

    window.name = html;
  }

  if (window.opera && opera.version) {
    opera.addEventListener('BeforeEvent.DOMContentLoaded', getContent, false);
    opera.addEventListener('BeforeScript', function(event) {
      event.preventDefault();
    }, false);
    
  } else {
    document.addEventListener('DOMContentLoaded', getContent, false);
  }
}
