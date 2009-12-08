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
  
  Array.toArray = function(list) {
    var array = [];
    for (var index = 0; index < list.length; ++index) {
      array.push(list[index]);
    }
    return array;
  };
  
  Array.NodeListToArray = function(list) {
    var array = [];
    for (var index = 0; index < list.length; ++index) {
      array.push(list.item(index));
    }
    return array;
  }

  Array.prototype.invoke = function(method) {
    var args = Array.toArray(arguments); // without this .shift() changes value of `method`
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
      return Array.NodeListToArray(this)[method](what);
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
    var args = Array.toArray(arguments); // only Opera supports .concat for arguments
    return function() {
      return fun.apply(null, args.concat(Array.toArray(arguments)));
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
    
    if (qsa) {
      HTMLElement.prototype.querySelectorAll = function() {
        return Array.NodeListToArray(qsa.apply(this, arguments));
      };
      
    } else {
      // patch older geckos with quite dumb but small and sufficient selector implementation
      // todo: class detection for proper buttons highlighting
      function findParent(element, node){
        while (node && node.parentNode != element) {
          node = node.parentNode;
        }
        return node;
      }
      function selectAll(selector) {
        selector = selector.replace(/.* /, '');
        var tag = selector.replace(/\W.*$/, '');
        var class_ = (tag != selector) ? selector.replace(/^\w+\./, '') : undefined;
        
        var nodes = Array.NodeListToArray(document.getElementsByTagName(tag));
        if (!class_) return nodes;
        
        class_ = new RegExp('\\b' + class_ + '\\b', 'i');
        return nodes.filter(function(node){ return class_.test(node.className); });
      }
      HTMLElement.prototype.querySelector = function(selector) {
        return selectAll(selector).find(findParent.curry(this));
      }
      HTMLElement.prototype.querySelectorAll = function(selector) {
        return selectAll(selector).filter(findParent.curry(this));
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
    var siblings = Array.toArray(this.parentNode.childNodes);// NB: <section> doesn't go to .children :(
    return siblings.slice(0, siblings.indexOf(this));
  };
  
  HTMLElement.prototype.nextSiblings = function(class_) {
    var siblings = Array.toArray(this.parentNode.childNodes); // NB: <section> doesn't go to .children :(
    return this.nextElementSibling ? siblings.slice(siblings.indexOf(this) + 1) : [];
  };
  
  // patch older geckos
  if (!document.body.previousElementSibling) {
    HTMLElement.prototype.__defineGetter__('nextElementSibling', function() {
      var node = this.nextSibling;
      while (node && node.nodeType != 1) node = node.nextSibling;
      return node;
    });
    HTMLElement.prototype.__defineGetter__('previousElementSibling', function() {
      var node = this.previousSibling;
      while (node && node.nodeType != 1) node = node.previousSibling;
      return node;
    });
  }
  
  window.AjaxRequest = function (url, options) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
      if (request.readyState < 4) return;
      
      try {
        if (request.status != 200) {
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
