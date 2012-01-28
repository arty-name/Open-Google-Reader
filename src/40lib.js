function lib() {
  // Following code is Prototype.js replacement for stupid Firefox's GreaseMonkey 

  window.DOM = function(name, attributes, children) {
    attributes = attributes || {};
    
    var parts = name.split('.');
    name = parts[0];
    
    if (parts.length > 1) {
      attributes.className = parts[1];
    }
    
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
  }

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
  
  Array.prototype.contains = function(what) {
    for (var index = 0; index < this.length; ++index) {
      if (this[index] === what) {
        return true;
      }
    }
    return false;
  };

  // gecko doesn't allow patching of querySelectorAll,
  // but allows to bring Array methods to NodeList
  'invoke pluck find contains filter forEach map'.split(' ').forEach(function(method){
    NodeList.prototype[method] = function(what) {
      return Array.prototype[method].call(this, what);
    }
  });
  
  String.prototype.contains = function(what) {
    return this.indexOf(what) > -1;
  };
  
  String.prototype.stripTags = function() {
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
    while (target && !matches.contains(target)) {
      target = target.parentNode;
    }
    return target;
  };

  // in Opera querySelectorAll returns StaticNodeList, which is unavailable for
  // monkey-patching, thus we patch querySelectorAll itself
  var qsa = HTMLElement.prototype.querySelectorAll;
  if (qsa && qsa.toString().match(/native|source/)) { // ignore maemo
    HTMLElement.prototype.querySelectorAll = function() {
      return cloneArray(qsa.apply(this, arguments));
    };
  }
  
  if (!document.body.classList) HTMLElement.prototype.__defineGetter__('classList', function() {
    var element = this;
    var classList = {
      contains: function(name) { return element.className.contains(name); },
      add:      function(name) { element.className += ' ' + name; },
      remove:   function(name) { element.className = element.className.replace(new RegExp('\\b' + name + '\\b', 'g'), ''); },
      toggle:   function(name) { if (classList.contains(name)) classList.remove(name); else classList.add(name); }
    };
    return classList;
  });
  
  HTMLElement.prototype.previousSiblings = function() {
    var siblings = cloneArray(this.parentNode.childNodes);// NB: <section> doesn't go to .children :(
    return siblings.slice(0, siblings.indexOf(this));
  };
  
  HTMLElement.prototype.nextSiblings = function() {
    var siblings = cloneArray(this.parentNode.childNodes); // NB: <section> doesn't go to .children :(
    return this.nextElementSibling ? siblings.slice(siblings.indexOf(this) + 1) : [];
  };
  
  window.APIRequest = function (url, options) {
    return AjaxRequest('/reader/api/0/' + url, options);
  };
  
  function AjaxRequest(url, options) {
    var request = new XMLHttpRequest();
      request.onreadystatechange = function () {
        if (request.status == 401) {
          if (!AjaxRequest.redirected && confirm('Re-authorization needed. Go to login page?')) {
            AjaxRequest.redirected = true;
            window.location = 
              'https://www.google.com/accounts/ServiceLogin?service=reader&btmpl=mobile&ltmpl=mobilex&' + 
              'continue=' + encodeURIComponent(window.location.href);
          }
          return;
        }
        
        if (request.readyState < 4) return;
        
        try {
          if (request.status != 200) {
            options.onFailure && options.onFailure();
          } else {
            if (request.responseText[0] == '{') request.responseJSON = JSON.parse(request.responseText);
            options.onSuccess && options.onSuccess(request);
          }
          options.onComplete && options.onComplete(request);
  
      } catch (e) {
        console.error(e);
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

}
