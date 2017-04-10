/**
 * NewsDog JS Bridge V1.0
 * Author : CoderJ
 **/
(function(win) {
    var NDB = function(selector) {
        if (this instanceof NDB) {
            this.init(selector);
        } else {
            return new NDB(selector);
        };
    };
    NDB.PROTOCOL = 'NDB';
    NDB.NO_CALLBACK = 'NO_CALLBACK';
    NDB.ALIAS = 'nd_bridge';
    NDB.VERSION = '0.0.1';
    NDB.DEBUG = false;
    NDB.callbacks = {};
    NDB.functionQueue = [];
    NDB.READY = false;
    /*init*/
    NDB.prototype.init = function(selector) {
        if (typeof(selector) == 'function') {
            if (NDB.READY) {
                return selector();
            } else {
                console.info("NDB is not ready, please wait.");
                NDB.functionQueue.push(selector);
            }
        } else if (typeof(selector) == "string") {
            if (selector.match('<')) {} else {
                var nodes = document.querySelectorAll(selector);
                for (var i = 0; i < nodes.length; i++) {
                    this[i] = nodes[i];
                }
                this.length = i;
                this.selector = selector;
            }
        } else if (typeof(selector) == "object") {
            if (selector.constructor.name == "HTMLDivElement") {
                this[0] = selector;
                this.length = 1;
                this.selector = selector;
            } else if (selector.constructor.name == "NDB") {
                NDB.extend(true, this, selector);
            }
        }
    };
    /*JS Bridge BASE*/
    NDB.run = function(method, params, callback) {
        if (!NDB.READY) {
            console.error("NewsDog Javascript Bridge is not ready now!");
            return false;
        }
        var port = NDB_GetPort();
        NDB.callbacks[port] = callback || NDB.NO_CALLBACK;
        if (NDB_GetUri(NDB.ALIAS, method, params, port)) {
            return window.prompt(NDB_GetUri(NDB.ALIAS, method, params, port), "");
        }
    };
    NDB.onFinish = function(port, res) {
        var callback = NDB.callbacks[port];
        if (callback != NDB.NO_CALLBACK) {
            callback && callback(res);
        }
        delete NDB.callbacks[port];
        return;
    };
    NDB.onPause = function() {
        return;
    };
    NDB.onResume = function(port, res) {
        return;
    };
    NDB.onReload = function(port, res) {
        return;
    };
    NDB.onReady = function(alias) {
        NDB.READY = true;
        NDB.ALIAS = alias;
        console.info("NewsDog Javascript Bridge is Ready now.");
        while (NDB.functionQueue.length > 0) {
            var fn = NDB.functionQueue.shift();
            fn();
        }
    }
    var NDB_GetPort = function() {
        for (;;) {
            var port = parseInt(Math.random() * 65536);
            if (!NDB.callbacks[port]) {
                return port;
            }
        }
    };
    var NDB_GetUri = function(alias, method, params, port) {
        if (NDB_GetParams(params)) {
            var uri = NDB.PROTOCOL + '://' + alias + ':' + port + '/' + method + '?' + NDB_GetParams(params);
            return uri;
        }
    };
    var NDB_GetParams = function(obj) {
        if (obj && typeof obj === 'object') {
            return JSON.stringify(obj);
        } else {
            console.error("NDB ERROR: params must be a Object");
            return false;
        }
    };
    /*BASE*/
    NDB.isFunction = function(obj) {
        return NDB.type(obj) === "function"
    };
    NDB.isArray = Array.isArray || function(obj) {
        return NDB.type(obj) === "array"
    };
    NDB.isWindow = function(obj) {
        return obj != null && obj == obj.window
    };
    NDB.isNumeric = function(obj) {
        return !isNaN(parseFloat(obj)) && isFinite(obj)
    };
    NDB.type = function(obj) {
        var toString = Object.prototype.toString;
        var class2type = {
            "[object Boolean]": "boolean",
            "[object Number]": "number",
            "[object String]": "string",
            "[object Function]": "function",
            "[object Array]": "array",
            "[object Date]": "date",
            "[object RegExp]": "regexp",
            "[object Object]": "object"
        };
        return obj == null ? String(obj) : class2type[toString.call(obj)] || "object"
    };
    NDB.isPlainObject = function(obj) {
        var hasOwn = Object.prototype.hasOwnProperty;
        if (!obj || NDB.type(obj) !== "object" || obj.nodeType) {
            return false
        }
        try {
            if (obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
                return false
            }
        } catch (e) {
            return false
        }
        var key;
        for (key in obj) {}
        return key === undefined || hasOwn.call(obj, key)
    }
    NDB.urlEncode = function(param, key, encode) {
        if (param == null) return '';
        var paramStr = '';
        var t = typeof(param);
        if (t == 'string' || t == 'number' || t == 'boolean') {
            paramStr += '&' + key + '=' + ((encode == null || encode) ? encodeURIComponent(param) : param);
        } else {
            for (var i in param) {
                var k = key == null ? i : key + (param instanceof Array ? '[' + i + ']' : '.' + i);
                paramStr += NDB.urlEncode(param[i], k, encode);
            }
        }
        return paramStr;
    };
    NDB.extend = function() {
        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;
        if (typeof target === "boolean") {
            deep = target;
            target = arguments[i] || {};
            i++;
        }
        if (typeof target !== "object" && !NDB.isFunction(target)) {
            target = {};
        }
        if (i === length) {
            target = this;
            i--;
        }
        for (; i < length; i++) {
            if ((options = arguments[i]) != null) {
                for (name in options) {
                    src = target[name];
                    copy = options[name];
                    if (target === copy) {
                        continue;
                    }
                    if (deep && copy && (NDB.isPlainObject(copy) || (copyIsArray = NDB.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && NDB.isArray(src) ? src : [];
                        } else {
                            clone = src && NDB.isPlainObject(src) ? src : {};
                        }
                        target[name] = NDB.extend(deep, clone, copy);
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }
        return target;
    };
    NDB.prototype.each = function(callback) {
        for (var i = 0; i < this.length; i++) {
            callback.call(NDB(this[i]), i, NDB(this[i]));
        }
    };
    /*DOM*/
    NDB.extend(NDB.prototype, {
        addClass: function(value) {
            for (var i = 0; i < this.length; i++) {
                var reg = new RegExp('(\\s|^)' + value + '(\\s|$)');
                this[i].className = (this[i].className.replace(reg, ' ') + " " + value).replace(/(^\s+|\s+$)/g, '').replace(/\s+/g, ' ');
            }
            return this;
        },
        removeClass: function(value) {
            for (var i = 0; i < this.length; i++) {
                var reg = new RegExp('(\\s|^)' + value + '(\\s|$)');
                this[i].className = this[i].className.replace(reg, ' ').replace(/(^\s+|\s+$)/g, '').replace(/\s+/g, ' ');
            }
            return this;
        },
        toggleClass: function(value) {
            if (this.hasClass(value)) {
                this.removeClass(value);
            } else {
                this.addClass(value);
            }
            return this;
        },
        hasClass: function(selector) {
            for (var i = 0; i < this.length; i++) {
                var reg = new RegExp('(\\s|^)' + value + '(\\s|$)');
                if (this[i].className.match(reg)) {
                    return true;
                }
            }
            return false;
        }
    });
    /*Event*/
    NDB.extend(NDB.prototype, {
        on: function(types, selector, data, fn, one) {
            var origFn, type;
            if (typeof types === "object") {
                if (typeof selector !== "string") {
                    data = data || selector;
                    selector = undefined;
                }
                for (type in types) {
                    this.on(type, selector, data, types[type], one);
                }
                return this;
            }
            if (data == null && fn == null) {
                fn = selector;
                data = selector = undefined;
            } else if (fn == null) {
                if (typeof selector === "string") {
                    fn = data;
                    data = undefined;
                } else {
                    fn = data;
                    data = selector;
                    selector = undefined;
                }
            }
            if (fn === false) {
                fn = function(){};
            } else if (!fn) {
                return this;
            }
            /*if (one === 1) {
                origFn = fn;
                fn = function(event) {
                    jQuery().off(event);
                    return origFn.apply(this, arguments);
                };
                fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);
            }*/
            for(var i = 0; i < this.length; i++){
                this[i].addEventListener(types, fn, false);
            }
            return this;
        }
    });
    /*AJAX*/
    NDB.extend(NDB, {
        get: function(url, params, callback) {
            if (typeof(params) == 'function') {
                callback = params;
                params = {};
            }
            return this.run("get", {
                url: url,
                params: params
            }, callback);
        },
        post: function(url, params, callback) {
            if (typeof(params) == 'function') {
                callback = params;
                params = {};
            }
            return this.run("post", {
                url: url,
                params: params
            }, callback);
        },
        put: function(url, params, callback) {
            if (typeof(params) == 'function') {
                callback = params;
                params = {};
            }
            return this.run("put", {
                url: url,
                params: params
            }, callback);
        },
        del: function(url, params, callback) {
            if (typeof(params) == 'function') {
                callback = params;
                params = {};
            }
            return this.run("delete", {
                url: url,
                params: params
            }, callback);
        }
    });
    /*UI*/
    NDB.extend(NDB, {
        toast: function(opt, callback) {
            var defOpt = {
                msg: "弹出Toast",
                long: true
            };
            opt = NDB.extend(true,{},defOpt,opt||{});
            return this.run("toast", opt, callback);
        },
        coinToast: function(opt, callback) {
            var defOpt = {
                msg: "签到成功",
                coin: 10
            };
            opt = NDB.extend(true,{},defOpt,opt||{});
            return this.run("coinToast", opt, callback);
        },
        share: function(opt, callback) {
            var defOpt = {
                platform: "fb",
                text: "",
                image: ""
            };
            opt = NDB.extend(true,{},defOpt,opt||{});
            return this.run("share", opt, callback);
        },
        openADeepLink: function(url, callback) {
            return this.run("openADeepLink", {
                url: url
            }, callback);
        },
        openAWebview: function(url, callback) {
            return this.run("openAWebView", {
                url: url
            }, callback);
        }
    });
    if (!win.NDB) {
        win.NDB = NDB;
    }
    //var $ = win.$ = NDB;
    try{
        AndroidJsConnector.connect();
    }catch(e){
        console.warn("AndroidJsConnector Warning:",e);
    }
    if(NDB.DEBUG == true){
        window[NDB.ALIAS] = {};
    }
})(window);