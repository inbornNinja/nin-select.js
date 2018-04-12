window.nin = (function () {
  function Nin (els) {
    for(var i = 0; i < els.length; i++ ) {
      this[i] = els[i];
    }
    this.length = els.length;

    init();
  }

  function init() {
    if(document.querySelectorAll('#nin-select-wrap').length > 0)
      return;

    var wrapEl = document.createElement('div');
    wrapEl.id = 'nin-select-wrap';

    var boxEl = document.createElement('div');
    boxEl.id = 'nin-select-box';

    wrapEl.appendChild(boxEl);
    document.body.appendChild(wrapEl);
  }

  var nin = {
    get: function (selector) {
      var els;
      if (typeof selector === "string") {
          els = document.querySelectorAll(selector);
      } else if (selector.length) {
          els = selector;
      } else {
          els = [selector];
      }
      return new Nin(els);
    },
    create: function (tagName, attrs) {
      var el = new Nin([document.createElement(tagName)]);
      if (attrs) {
        if (attrs.className) {
          el.addClass(attrs.className);
        delete attrs.className;
      }
      if (attrs.text) {
        el.text(attrs.text);
        delete attrs.text;
      }
      for (var key in attrs) {
        if (attrs.hasOwnProperty(key)) {
            el.attr(key, attrs[key]);
          }
        }
      }
      return el;
    }
  };

  Nin.prototype.map = function (callback) {
    var results = [], i = 0;
    for ( ; i < this.length; i++) {
        results.push(callback.call(this, this[i], i));
    }
    return results;
  };

  Nin.prototype.forEach = function(callback) {
    this.map(callback);
    return this;
  };

  Nin.prototype.mapOne = function (callback) {
    var m = this.map(callback);
    return m.length > 1 ? m : m[0];
  };

  Nin.prototype.text = function (text) {
    if (typeof text !== "undefined") {
      return this.forEach(function (el) {
          el.innerText = text;
      });
    } else {
      return this.mapOne(function (el) {
          return el.innerText;
      });
    }
  };

  Nin.prototype.html = function (html) {
    if (typeof html !== "undefined") {
      this.forEach(function (el) {
          el.innerHTML = html;
      });
      return this;
    } else {
      return this.mapOne(function (el) {
          return el.innerHTML;
      });
    }
  };

  Nin.prototype.addClass = function (classes) {
    var className = "";
    if (typeof classes !== "string") {
      for (var i = 0; i < classes.length; i++) {
          className += " " + classes[i];
      }
    } else {
      className = " " + classes;
    }
    return this.forEach(function (el) {
      el.className += className;
    });
  };

  Nin.prototype.removeClass = function (classes) {

    if (typeof Array.prototype.indexOf !== "function") {
      Array.prototype.indexOf = function (item) {
        for(var i = 0; i < this.length; i++) {
          if (this[i] === item) {
              return i;
          }
        }
        return -1;
      };
    }

    return this.forEach(function (el) {
      var cs = el.className.split(" "), i;

      while ( (i = cs.indexOf(classes)) > -1) {
          cs = cs.slice(0, i).concat(cs.slice(++i));
      }
      el.className = cs.join(" ");
    });
  };

  Nin.prototype.attr = function (attr, val) {
    if (typeof val !== "undefined") {
      return this.forEach(function(el) {
          el.setAttribute(attr, val);
      });
    } else {
      return this.mapOne(function (el) {
          return el.getAttribute(attr);
      });
    }
  };

  Nin.prototype.append = function (els) {
    return this.forEach(function (parEl, i) {
        els.forEach(function (childEl) {
            if (i > 0) {
                childEl = childEl.cloneNode(true);
            }
            parEl.appendChild(childEl);
        });
    });
  };

  var searchStr = "";

  Nin.prototype.ninify = function(){

    this.addClass('ninified');

    this.mapOne(function (el) {
      var id = el.id + '-input';
      el.value = "";

      var div = document.createElement('div');
      div.className = "nin-form-group"
      var input = document.createElement('input');
      input.setAttribute('type','text');
      input.value = "Select";
      input.id = id;
      input.className = "nin-form-control non-serialize"
      div.appendChild(input)
      el.parentElement.appendChild(div);

      input.onfocus = function () {
        document.querySelector('#nin-select-box').style.display = "block";
        searchStr = this.value;
        if(this.value.toLowerCase() == "select")
          this.value = "";
        createBox(this);
      };
      input.onblur = function () {
        var that = this;
        setTimeout(function(){
          destroyBox(that);
        },250);
      };
      input.onkeyup = function(e) {

        if(e.which == 8
            && (this.value.toLowerCase().indexOf('selec') > -1
            || this.value.toLowerCase().indexOf('select') > -1)
          ) {
          this.value = "";
          searchStr = "";
        } else {
          console.log(this.value);
          searchStr = this.value;
        }

        filterOptions(searchStr);
      }
    });
  }

  function createBox (input) {

    var id = "#" + input.id.split("-input")[0];
    var el = document.querySelector(id);

    var optionMap = {};

    for(var opt of el.children) {
      var key = opt.value;
      optionMap[key] = opt.innerText;
    }

    createOptions(input,optionMap);
  }

  function createOptions(input,opts) {
    var el = document.querySelector('#nin-select-box');
    var ul = document.createElement('ul');
    el.appendChild(ul);

    var li = document.createElement('li');
    li.setAttribute('value','');
    li.innerText = 'Select';
    ul.appendChild(li);
    li.onclick = function() {
      input.value = this.innerText;
      document.getElementById(input.id.split("-input")[0]).value = "";
    };

    for(var i in opts) {
      if(i.length>0) {
        var li = getListItem(i,opts[i]);
        ul.appendChild(li);
        li.onclick = function() {
          input.value = this.innerText;
          document.getElementById(input.id.split("-input")[0]).value = this.getAttribute('value');
        };
      }
    }

    var offsets = getOffsets(input);
    el.style.top = (offsets.top + 30) + "px";
    el.style.left = offsets.left + "px";
    el.style.width = input.offsetWidth + "px";

    searchStr = input.value;
    filterOptions();
  }

  function destroyBox(input) {
    var el = document.querySelector('#nin-select-box');
    var isValid = false;
    while (el.firstChild) {
      var ul = el.firstChild;
      while (ul.firstChild) {
        if(ul.firstChild.innerText.toLowerCase() == input.value.toLowerCase())
          isValid = true;
        ul.removeChild(ul.firstChild);
      }
      el.removeChild(el.firstChild);
    }

    if(!isValid || input.value.length == 0) {
      input.value = "Select";
      document.getElementById(input.id.split("-input")[0]).value = "";
    }
    el.style.display = "none";
    searchStr = "";
  }

  function getListItem(val, text)  {
    var li = document.createElement('li');
    li.setAttribute('value', val);
    li.innerText = text;

    return li;
  }

  function filterOptions(str)  {
    var list = document.querySelectorAll('#nin-select-box ul li');

    list.forEach(function(li){

      if(li.innerText.toLowerCase().indexOf(searchStr.toLowerCase()) > -1) {

        li.style.display = "block";
      } else {
        li.style.display = "none";
      }
    })

  }


  function getOffsets(el) {
    var offset = {top: 0, left: 0};

    do {
      if(!isNaN( el.offsetTop )) {
        offset.top = offset.top + el.offsetTop;
      }
      if(!isNaN( el.offsetLeft )) {
        offset.left = offset.left + el.offsetLeft;
      }
    } while(el = el.offsetParent);
    return offset;
  }

  return nin;
}());
