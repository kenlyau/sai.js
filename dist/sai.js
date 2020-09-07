/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	
	var win = window;
	var doc = win.document;
	var loc = win.location;
	var M = win.Sai;

	var detector = __webpack_require__(1);
	var Events = __webpack_require__(4);

	// 避免未引用先行脚本抛出异常。
	if(!M){M = {};}
	if(!M._DATAS){M._DATAS = [];}
	if(!M._EVENTS){M._EVENTS = [];}

	var _events = M._EVENTS;
	var _evt = new Events();
	M.on = function(evt, handler){
	  _evt.on(evt, handler);
	};
	for(var i=0,l=_events.length; i<l; i++){
	  M.on(_events[i][0], _events[i][1]);
	}

	// 数据通信规范的版本。
	var version = "2.0";

	var URLLength = detector.engine.trident ? 2083 : 8190;
	var url = path(loc.href);

	// UTILS -------------------------------------------------------

	function typeOf(obj){
	  return Object.prototype.toString.call(obj);
	}

	// 合并 oa, ob 两个对象的属性到新对象，不修改原有对象。
	// @param {Object} target, 目标对象。
	// @param {Object} object, 来源对象。
	// @return {Object} 返回目标对象，目标对象附带有来源对象的属性。
	function merge(oa, ob){
	  var result = {};

	  for(var i=0,o,l=arguments.length; i<l; i++){
	    o = arguments[i];
	    for(var k in o){
	      if(has(o, k)){
	        result[k] = o[k];
	      }
	    }
	  }
	  return result;
	}

	// simple random string.
	// @return {String}
	function rand(){
	  return (""+Math.random()).slice(-6);
	}

	// 获得资源的路径（不带参数和 hash 部分）
	// 另外新版 Arale 通过 nginx 提供的服务，支持类似：
	// > https://www.example.com/??a.js,b.js,c.js
	// 的方式请求资源，需要特殊处理。
	//
	// @param {String} uri, 仅处理绝对路径。
	// @return {String} 返回 uri 的文件路径，不包含参数和 jsessionid。
	function path(uri){
	  if(undefined === uri || typeof(uri) !== "string"){return "";}
	  var len = uri.length;

	  var idxSessionID = uri.indexOf(";jsessionid=");
	  if(idxSessionID < 0){idxSessionID = len;}

	  // 旧版的合并 HTTP 服务。
	  var idxMin = uri.indexOf("/min/?");
	  if(idxMin >= 0){
	    idxMin = uri.indexOf("?", idxMin);
	  }
	  if(idxMin < 0){idxMin = len;}

	  var idxHash = uri.indexOf("#");
	  if(idxHash < 0){idxHash = len;}

	  var idxQ = uri.indexOf("??");
	  idxQ = uri.indexOf("?", idxQ < 0 ? 0 : idxQ+2);
	  if(idxQ < 0){idxQ = len;}

	  var idx = Math.min(idxSessionID, idxMin, idxHash, idxQ);

	  return idx < 0 ? uri : uri.substr(0, idx);
	}

	// 必要的字符串转义，保证发送的数据是安全的。
	// @param {String} str.
	// @return {String}
	function escapeString(str){
	  return String(str).replace(/(?:\r\n|\r|\n)/g,"<CR>");
	}

	// 将对象转为键值对参数字符串。
	function param(obj){
	  if(Object.prototype.toString.call(obj) !== "[object Object]"){
	    return "";
	  }
	  var p = [];
	  for(var k in obj){
	    if(!has(obj,k)){continue;}
	    if(typeOf(obj[k]) === "[object Array]"){
	      for(var i=0,l=obj[k].length; i<l; i++){
	        p.push(k + "=" + encodeURIComponent(escapeString(obj[k][i])));
	      }
	    }else{
	      p.push(k + "=" + encodeURIComponent(escapeString(obj[k])));
	    }
	  }
	  return p.join("&");
	}

	function has(obj, key){
	  return Object.prototype.hasOwnProperty.call(obj, key);
	}

	function warn(info){
	  win.console && console.warn && console.warn(info);
	}

	// /UTILS -------------------------------------------------------

	var DEFAULT_DATA = {
	  url: url,
	  ref: path(doc.referrer) || "-",
	  clnt: detector.device.name+"/"+detector.device.fullVersion+"|"+
	    detector.os.name+"/"+detector.os.fullVersion+"|"+
	    detector.browser.name+"/"+detector.browser.fullVersion+"|"+
	    detector.engine.name+"/"+detector.engine.fullVersion+
	    (detector.browser.compatible?"|c":""),
	  v: version
	};


	// 创建 HTTP GET 请求发送数据。
	// @param {String} url, 日志服务器 URL 地址。
	// @param {Object} data, 附加的监控数据。
	// @param {Function} callback
	function send(host, data, callback){
	  if(!callback){callback = function(){};}
	  if(!host){warn('Sai: required logger server.'+ host); return callback();}
	  if(!data){return callback();}

	  var d = param(data);
	  var url = host + (host.indexOf("?") < 0 ? "?" : "&") + d;
	  // 忽略超长 url 请求，避免资源异常。
	  if(url.length > URLLength){return callback();}

	  // @see http://www.javascriptkit.com/jsref/image.shtml
	  var img = new Image(1,1);
	  img.onload = img.onerror = img.onabort = function(){
	    callback();
	    img.onload = img.onerror = img.onabort = null;
	    img = null;
	  };

	  img.src = url;
	}

	var sending = false;
	/**
	 * 分时发送队列中的数据，避免 IE(6) 的连接请求数限制。
	 */
	function timedSend(){
	  if(sending){return;}

	  var e = M._DATAS.shift();
	  if(!e){return;}
	  sending = true;

	  // 理论上应该在收集异常消息时修正 file，避免连接带有参数。
	  // 但是收集部分在 seer 中，不适合放置大量的脚本。
	  if(e.profile === "jserror"){
	    e.file = path(e.file);
	  }

	  var data = merge(DEFAULT_DATA, e);
	  data.rnd = rand(); // 避免缓存。

	  // 触发事件返回 false 时，取消后续执行。
	  // 要求特定 profile 的事件，和全局事件都被触发。
	  var eventResult = _evt.emit(e.profile, data);
	  eventResult = _evt.emit("*", data) && eventResult;
	  if(!eventResult){
	    sending = false;
	    return timedSend();
	  }

	  send(M.server, data, function(){
	    sending = false;
	    timedSend();
	  });
	}

	// timedSend 准备好后可以替换 push 方法，自动分时发送。
	var _push = M._DATAS.push;
	M._DATAS.push = function(){
	  _push.apply(M._DATAS, arguments);
	  timedSend();
	};

	// 主动发送已捕获的异常。
	timedSend();

	win.Sai = M;
	module.exports = M;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var Detector = __webpack_require__(2);
	var WebRules = __webpack_require__(3);

	var userAgent = navigator.userAgent || "";
	//const platform = navigator.platform || "";
	var appVersion = navigator.appVersion || "";
	var vendor = navigator.vendor || "";
	var ua = userAgent + " " + appVersion + " " + vendor;

	var detector = new Detector(WebRules);

	// 解析使用 Trident 内核的浏览器的 `浏览器模式` 和 `文档模式` 信息。
	// @param {String} ua, userAgent string.
	// @return {Object}
	function IEMode(ua) {
	  if (!WebRules.re_msie.test(ua)) {
	    return null;
	  }

	  var m = void 0;
	  var engineMode = void 0;
	  var engineVersion = void 0;
	  var browserMode = void 0;
	  var browserVersion = void 0;

	  // IE8 及其以上提供有 Trident 信息，
	  // 默认的兼容模式，UA 中 Trident 版本不发生变化。
	  if (ua.indexOf("trident/") !== -1) {
	    m = /\btrident\/([0-9.]+)/.exec(ua);
	    if (m && m.length >= 2) {
	      // 真实引擎版本。
	      engineVersion = m[1];
	      var v_version = m[1].split(".");
	      v_version[0] = parseInt(v_version[0], 10) + 4;
	      browserVersion = v_version.join(".");
	    }
	  }

	  m = WebRules.re_msie.exec(ua);
	  browserMode = m[1];
	  var v_mode = m[1].split(".");
	  if (typeof browserVersion === "undefined") {
	    browserVersion = browserMode;
	  }
	  v_mode[0] = parseInt(v_mode[0], 10) - 4;
	  engineMode = v_mode.join(".");
	  if (typeof engineVersion === "undefined") {
	    engineVersion = engineMode;
	  }

	  return {
	    browserVersion: browserVersion,
	    browserMode: browserMode,
	    engineVersion: engineVersion,
	    engineMode: engineMode,
	    compatible: engineVersion !== engineMode
	  };
	}

	function WebParse(ua) {
	  var d = detector.parse(ua);

	  var ieCore = IEMode(ua);

	  // IE 内核的浏览器，修复版本号及兼容模式。
	  if (ieCore) {
	    var engineName = d.engine.name;
	    var engineVersion = ieCore.engineVersion || ieCore.engineMode;
	    var ve = parseFloat(engineVersion);
	    var engineMode = ieCore.engineMode;

	    d.engine = {
	      name: engineName,
	      version: ve,
	      fullVersion: engineVersion,
	      mode: parseFloat(engineMode),
	      fullMode: engineMode,
	      compatible: ieCore ? ieCore.compatible : false
	    };
	    d.engine[d.engine.name] = ve;

	    var browserName = d.browser.name;
	    // IE 内核的浏览器，修复浏览器版本及兼容模式。
	    // 仅修改 IE 浏览器的版本，其他 IE 内核的版本不修改。
	    var browserVersion = d.browser.fullVersion;
	    if (browserName === "ie") {
	      browserVersion = ieCore.browserVersion;
	    }
	    var browserMode = ieCore.browserMode;
	    var vb = parseFloat(browserVersion);
	    d.browser = {
	      name: browserName,
	      version: vb,
	      fullVersion: browserVersion,
	      mode: parseFloat(browserMode),
	      fullMode: browserMode,
	      compatible: ieCore ? ieCore.compatible : false
	    };
	    d.browser[browserName] = vb;
	  }
	  return d;
	}

	var Tan = WebParse(ua);
	Tan.parse = WebParse;
	module.exports = Tan;

/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var NA_VERSION = "-1";
	var NA = {
	  name: "na",
	  version: NA_VERSION
	};

	function typeOf(type) {
	  return function (object) {
	    return Object.prototype.toString.call(object) === "[object " + type + "]";
	  };
	}
	var isString = typeOf("String");
	var isRegExp = typeOf("RegExp");
	var isObject = typeOf("Object");
	var isFunction = typeOf("Function");

	function each(object, factory) {
	  for (var i = 0, l = object.length; i < l; i++) {
	    if (factory.call(object, object[i], i) === false) {
	      break;
	    }
	  }
	}

	// UserAgent Detector.
	// @param {String} ua, userAgent.
	// @param {Object} expression
	// @return {Object}
	//    返回 null 表示当前表达式未匹配成功。
	function detect(name, expression, ua) {
	  var expr = isFunction(expression) ? expression.call(null, ua) : expression;
	  if (!expr) {
	    return null;
	  }
	  var info = {
	    name: name,
	    version: NA_VERSION,
	    codename: ""
	  };
	  if (expr === true) {
	    return info;
	  } else if (isString(expr)) {
	    if (ua.indexOf(expr) !== -1) {
	      return info;
	    }
	  } else if (isObject(expr)) {
	    if (expr.hasOwnProperty("version")) {
	      info.version = expr.version;
	    }
	    return info;
	  } else if (isRegExp(expr)) {
	    var m = expr.exec(ua);
	    if (m) {
	      if (m.length >= 2 && m[1]) {
	        info.version = m[1].replace(/_/g, ".");
	      } else {
	        info.version = NA_VERSION;
	      }
	      return info;
	    }
	  }
	}

	// 初始化识别。
	function init(ua, patterns, factory, detector) {
	  var detected = NA;
	  each(patterns, function (pattern) {
	    var d = detect(pattern[0], pattern[1], ua);
	    if (d) {
	      detected = d;
	      return false;
	    }
	  });
	  factory.call(detector, detected.name, detected.version);
	}

	var Detector = function () {
	  function Detector(rules) {
	    _classCallCheck(this, Detector);

	    this._rules = rules;
	  }

	  // 解析 UserAgent 字符串
	  // @param {String} ua, userAgent string.
	  // @return {Object}


	  _createClass(Detector, [{
	    key: "parse",
	    value: function parse(ua) {
	      ua = (ua || "").toLowerCase();
	      var d = {};

	      init(ua, this._rules.device, function (name, version) {
	        var v = parseFloat(version);
	        d.device = {
	          name: name,
	          version: v,
	          fullVersion: version
	        };
	        d.device[name] = v;
	      }, d);

	      init(ua, this._rules.os, function (name, version) {
	        var v = parseFloat(version);
	        d.os = {
	          name: name,
	          version: v,
	          fullVersion: version
	        };
	        d.os[name] = v;
	      }, d);

	      var ieCore = this.IEMode(ua);

	      init(ua, this._rules.engine, function (name, version) {
	        var mode = version;
	        // IE 内核的浏览器，修复版本号及兼容模式。
	        if (ieCore) {
	          version = ieCore.engineVersion || ieCore.engineMode;
	          mode = ieCore.engineMode;
	        }
	        var v = parseFloat(version);
	        d.engine = {
	          name: name,
	          version: v,
	          fullVersion: version,
	          mode: parseFloat(mode),
	          fullMode: mode,
	          compatible: ieCore ? ieCore.compatible : false
	        };
	        d.engine[name] = v;
	      }, d);

	      init(ua, this._rules.browser, function (name, version) {
	        var mode = version;
	        // IE 内核的浏览器，修复浏览器版本及兼容模式。
	        if (ieCore) {
	          // 仅修改 IE 浏览器的版本，其他 IE 内核的版本不修改。
	          if (name === "ie") {
	            version = ieCore.browserVersion;
	          }
	          mode = ieCore.browserMode;
	        }
	        var v = parseFloat(version);
	        d.browser = {
	          name: name,
	          version: v,
	          fullVersion: version,
	          mode: parseFloat(mode),
	          fullMode: mode,
	          compatible: ieCore ? ieCore.compatible : false
	        };
	        d.browser[name] = v;
	      }, d);
	      return d;
	    }

	    // 解析使用 Trident 内核的浏览器的 `浏览器模式` 和 `文档模式` 信息。
	    // @param {String} ua, userAgent string.
	    // @return {Object}

	  }, {
	    key: "IEMode",
	    value: function IEMode(ua) {
	      if (!this._rules.re_msie.test(ua)) {
	        return null;
	      }

	      var m = void 0;
	      var engineMode = void 0;
	      var engineVersion = void 0;
	      var browserMode = void 0;
	      var browserVersion = void 0;

	      // IE8 及其以上提供有 Trident 信息，
	      // 默认的兼容模式，UA 中 Trident 版本不发生变化。
	      if (ua.indexOf("trident/") !== -1) {
	        m = /\btrident\/([0-9.]+)/.exec(ua);
	        if (m && m.length >= 2) {
	          // 真实引擎版本。
	          engineVersion = m[1];
	          var v_version = m[1].split(".");
	          v_version[0] = parseInt(v_version[0], 10) + 4;
	          browserVersion = v_version.join(".");
	        }
	      }

	      m = this._rules.re_msie.exec(ua);
	      browserMode = m[1];
	      var v_mode = m[1].split(".");
	      if (typeof browserVersion === "undefined") {
	        browserVersion = browserMode;
	      }
	      v_mode[0] = parseInt(v_mode[0], 10) - 4;
	      engineMode = v_mode.join(".");
	      if (typeof engineVersion === "undefined") {
	        engineVersion = engineMode;
	      }

	      return {
	        browserVersion: browserVersion,
	        browserMode: browserMode,
	        engineVersion: engineVersion,
	        engineMode: engineMode,
	        compatible: engineVersion !== engineMode
	      };
	    }
	  }]);

	  return Detector;
	}();

	module.exports = Detector;

/***/ },
/* 3 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {"use strict";

	var win = typeof window === "undefined" ? global : window;
	var external = win.external;
	var re_msie = /\b(?:msie |ie |trident\/[0-9].*rv[ :])([0-9.]+)/;
	var re_blackberry_10 = /\bbb10\b.+?\bversion\/([\d.]+)/;
	var re_blackberry_6_7 = /\bblackberry\b.+\bversion\/([\d.]+)/;
	var re_blackberry_4_5 = /\bblackberry\d+\/([\d.]+)/;

	var NA_VERSION = "-1";

	// 硬件设备信息识别表达式。
	// 使用数组可以按优先级排序。
	var DEVICES = [["nokia", function (ua) {
	  // 不能将两个表达式合并，因为可能出现 "nokia; nokia 960"
	  // 这种情况下会优先识别出 nokia/-1
	  if (ua.indexOf("nokia ") !== -1) {
	    return (/\bnokia ([0-9]+)?/
	    );
	  } else {
	    return (/\bnokia([a-z0-9]+)?/
	    );
	  }
	}],
	// 三星有 Android 和 WP 设备。
	["samsung", function (ua) {
	  if (ua.indexOf("samsung") !== -1) {
	    return (/\bsamsung(?:[ \-](?:sgh|gt|sm))?-([a-z0-9]+)/
	    );
	  } else {
	    return (/\b(?:sgh|sch|gt|sm)-([a-z0-9]+)/
	    );
	  }
	}], ["wp", function (ua) {
	  return ua.indexOf("windows phone ") !== -1 || ua.indexOf("xblwp") !== -1 || ua.indexOf("zunewp") !== -1 || ua.indexOf("windows ce") !== -1;
	}], ["pc", "windows"], ["ipad", "ipad"],
	// ipod 规则应置于 iphone 之前。
	["ipod", "ipod"], ["iphone", /\biphone\b|\biph(\d)/], ["mac", "macintosh"],
	// 小米
	["mi", /\bmi[ \-]?([a-z0-9 ]+(?= build|\)))/],
	// 红米
	["hongmi", /\bhm[ \-]?([a-z0-9]+)/], ["aliyun", /\baliyunos\b(?:[\-](\d+))?/], ["meizu", function (ua) {
	  return ua.indexOf("meizu") >= 0 ? /\bmeizu[\/ ]([a-z0-9]+)\b/ : /\bm([0-9cx]{1,4})\b/;
	}], ["nexus", /\bnexus ([0-9s.]+)/], ["huawei", function (ua) {
	  var re_mediapad = /\bmediapad (.+?)(?= build\/huaweimediapad\b)/;
	  if (ua.indexOf("huawei-huawei") !== -1) {
	    return (/\bhuawei\-huawei\-([a-z0-9\-]+)/
	    );
	  } else if (re_mediapad.test(ua)) {
	    return re_mediapad;
	  } else {
	    return (/\bhuawei[ _\-]?([a-z0-9]+)/
	    );
	  }
	}], ["lenovo", function (ua) {
	  if (ua.indexOf("lenovo-lenovo") !== -1) {
	    return (/\blenovo\-lenovo[ \-]([a-z0-9]+)/
	    );
	  } else {
	    return (/\blenovo[ \-]?([a-z0-9]+)/
	    );
	  }
	}],
	// 中兴
	["zte", function (ua) {
	  if (/\bzte\-[tu]/.test(ua)) {
	    return (/\bzte-[tu][ _\-]?([a-su-z0-9\+]+)/
	    );
	  } else {
	    return (/\bzte[ _\-]?([a-su-z0-9\+]+)/
	    );
	  }
	}],
	// 步步高
	["vivo", /\bvivo(?: ([a-z0-9]+))?/], ["htc", function (ua) {
	  if (/\bhtc[a-z0-9 _\-]+(?= build\b)/.test(ua)) {
	    return (/\bhtc[ _\-]?([a-z0-9 ]+(?= build))/
	    );
	  } else {
	    return (/\bhtc[ _\-]?([a-z0-9 ]+)/
	    );
	  }
	}], ["oppo", /\boppo[_]([a-z0-9]+)/], ["konka", /\bkonka[_\-]([a-z0-9]+)/], ["sonyericsson", /\bmt([a-z0-9]+)/], ["coolpad", /\bcoolpad[_ ]?([a-z0-9]+)/], ["lg", /\blg[\-]([a-z0-9]+)/], ["android", /\bandroid\b|\badr\b/], ["blackberry", function (ua) {
	  if (ua.indexOf("blackberry") >= 0) {
	    return (/\bblackberry\s?(\d+)/
	    );
	  }
	  return "bb10";
	}]];

	// 操作系统信息识别表达式
	var OS = [["wp", function (ua) {
	  if (ua.indexOf("windows phone ") !== -1) {
	    return (/\bwindows phone (?:os )?([0-9.]+)/
	    );
	  } else if (ua.indexOf("xblwp") !== -1) {
	    return (/\bxblwp([0-9.]+)/
	    );
	  } else if (ua.indexOf("zunewp") !== -1) {
	    return (/\bzunewp([0-9.]+)/
	    );
	  }
	  return "windows phone";
	}], ["windows", /\bwindows nt ([0-9.]+)/], ["macosx", /\bmac os x ([0-9._]+)/], ["ios", function (ua) {
	  if (/\bcpu(?: iphone)? os /.test(ua)) {
	    return (/\bcpu(?: iphone)? os ([0-9._]+)/
	    );
	  } else if (ua.indexOf("iph os ") !== -1) {
	    return (/\biph os ([0-9_]+)/
	    );
	  } else {
	    return (/\bios\b/
	    );
	  }
	}], ["yunos", /\baliyunos ([0-9.]+)/], ["android", function (ua) {
	  if (ua.indexOf("android") >= 0) {
	    return (/\bandroid[ \/-]?([0-9.x]+)?/
	    );
	  } else if (ua.indexOf("adr") >= 0) {
	    if (ua.indexOf("mqqbrowser") >= 0) {
	      return (/\badr[ ]\(linux; u; ([0-9.]+)?/
	      );
	    } else {
	      return (/\badr(?:[ ]([0-9.]+))?/
	      );
	    }
	  }
	  return "android";
	  //return /\b(?:android|\badr)(?:[\/\- ](?:\(linux; u; )?)?([0-9.x]+)?/;
	}], ["chromeos", /\bcros i686 ([0-9.]+)/], ["linux", "linux"], ["windowsce", /\bwindows ce(?: ([0-9.]+))?/], ["symbian", /\bsymbian(?:os)?\/([0-9.]+)/], ["blackberry", function (ua) {
	  var m = ua.match(re_blackberry_10) || ua.match(re_blackberry_6_7) || ua.match(re_blackberry_4_5);
	  return m ? { version: m[1] } : "blackberry";
	}]];

	// 针对同源的 TheWorld 和 360 的 external 对象进行检测。
	// @param {String} key, 关键字，用于检测浏览器的安装路径中出现的关键字。
	// @return {Undefined,Boolean,Object} 返回 undefined 或 false 表示检测未命中。
	function checkTW360External(key) {
	  if (!external) {
	    return;
	  } // return undefined.
	  try {
	    //        360安装路径：
	    //        C:%5CPROGRA~1%5C360%5C360se3%5C360SE.exe
	    var runpath = external.twGetRunPath.toLowerCase();
	    // 360SE 3.x ~ 5.x support.
	    // 暴露的 external.twGetVersion 和 external.twGetSecurityID 均为 undefined。
	    // 因此只能用 try/catch 而无法使用特性判断。
	    var security = external.twGetSecurityID(win);
	    var version = external.twGetVersion(security);

	    if (runpath && runpath.indexOf(key) === -1) {
	      return false;
	    }
	    if (version) {
	      return { version: version };
	    }
	  } catch (ex) {/* */}
	}

	var ENGINE = [["edgehtml", /edge\/([0-9.]+)/], ["trident", re_msie], ["blink", function () {
	  return "chrome" in win && "CSS" in win && /\bapplewebkit[\/]?([0-9.+]+)/;
	}], ["webkit", /\bapplewebkit[\/]?([0-9.+]+)/], ["gecko", function (ua) {
	  var match = ua.match(/\brv:([\d\w.]+).*\bgecko\/(\d+)/);
	  if (match) {
	    return {
	      version: match[1] + "." + match[2]
	    };
	  }
	}], ["presto", /\bpresto\/([0-9.]+)/], ["androidwebkit", /\bandroidwebkit\/([0-9.]+)/], ["coolpadwebkit", /\bcoolpadwebkit\/([0-9.]+)/], ["u2", /\bu2\/([0-9.]+)/], ["u3", /\bu3\/([0-9.]+)/]];
	var BROWSER = [
	// Microsoft Edge Browser, Default browser in Windows 10.
	["edge", /edge\/([0-9.]+)/],
	// Sogou.
	["sogou", function (ua) {
	  if (ua.indexOf("sogoumobilebrowser") >= 0) {
	    return (/sogoumobilebrowser\/([0-9.]+)/
	    );
	  } else if (ua.indexOf("sogoumse") >= 0) {
	    return true;
	  }
	  return (/ se ([0-9.x]+)/
	  );
	}],
	// TheWorld (世界之窗)
	// 由于裙带关系，TheWorld API 与 360 高度重合。
	// 只能通过 UA 和程序安装路径中的应用程序名来区分。
	// TheWorld 的 UA 比 360 更靠谱，所有将 TheWorld 的规则放置到 360 之前。
	["theworld", function () {
	  var x = checkTW360External("theworld");
	  if (typeof x !== "undefined") {
	    return x;
	  }
	  return (/theworld(?: ([\d.])+)?/
	  );
	}],
	// 360SE, 360EE.
	["360", function (ua) {
	  var x = checkTW360External("360se");
	  if (typeof x !== "undefined") {
	    return x;
	  }
	  if (ua.indexOf("360 aphone browser") !== -1) {
	    return (/\b360 aphone browser \(([^\)]+)\)/
	    );
	  }
	  return (/\b360(?:se|ee|chrome|browser)\b/
	  );
	}],
	// Maxthon
	["maxthon", function () {
	  try {
	    if (external && (external.mxVersion || external.max_version)) {
	      return {
	        version: external.mxVersion || external.max_version
	      };
	    }
	  } catch (ex) {/* */}
	  return (/\b(?:maxthon|mxbrowser)(?:[ \/]([0-9.]+))?/
	  );
	}], ["micromessenger", /\bmicromessenger\/([\d.]+)/], ["qq", /\bm?qqbrowser\/([0-9.]+)/], ["green", "greenbrowser"], ["tt", /\btencenttraveler ([0-9.]+)/], ["liebao", function (ua) {
	  if (ua.indexOf("liebaofast") >= 0) {
	    return (/\bliebaofast\/([0-9.]+)/
	    );
	  }
	  if (ua.indexOf("lbbrowser") === -1) {
	    return false;
	  }
	  var version = void 0;
	  try {
	    if (external && external.LiebaoGetVersion) {
	      version = external.LiebaoGetVersion();
	    }
	  } catch (ex) {/* */}
	  return {
	    version: version || NA_VERSION
	  };
	}], ["tao", /\btaobrowser\/([0-9.]+)/], ["coolnovo", /\bcoolnovo\/([0-9.]+)/], ["saayaa", "saayaa"],
	// 有基于 Chromniun 的急速模式和基于 IE 的兼容模式。必须在 IE 的规则之前。
	["baidu", /\b(?:ba?idubrowser|baiduhd)[ \/]([0-9.x]+)/],
	// 后面会做修复版本号，这里只要能识别是 IE 即可。
	["ie", re_msie], ["mi", /\bmiuibrowser\/([0-9.]+)/],
	// Opera 15 之后开始使用 Chromniun 内核，需要放在 Chrome 的规则之前。
	["opera", function (ua) {
	  var re_opera_old = /\bopera.+version\/([0-9.ab]+)/;
	  var re_opera_new = /\bopr\/([0-9.]+)/;
	  return re_opera_old.test(ua) ? re_opera_old : re_opera_new;
	}], ["oupeng", /\boupeng\/([0-9.]+)/], ["yandex", /yabrowser\/([0-9.]+)/],
	// 支付宝手机客户端
	["ali-ap", function (ua) {
	  if (ua.indexOf("aliapp") > 0) {
	    return (/\baliapp\(ap\/([0-9.]+)\)/
	    );
	  } else {
	    return (/\balipayclient\/([0-9.]+)\b/
	    );
	  }
	}],
	// 支付宝平板客户端
	["ali-ap-pd", /\baliapp\(ap-pd\/([0-9.]+)\)/],
	// 支付宝商户客户端
	["ali-am", /\baliapp\(am\/([0-9.]+)\)/],
	// 淘宝手机客户端
	["ali-tb", /\baliapp\(tb\/([0-9.]+)\)/],
	// 淘宝平板客户端
	["ali-tb-pd", /\baliapp\(tb-pd\/([0-9.]+)\)/],
	// 天猫手机客户端
	["ali-tm", /\baliapp\(tm\/([0-9.]+)\)/],
	// 天猫平板客户端
	["ali-tm-pd", /\baliapp\(tm-pd\/([0-9.]+)\)/],
	// UC 浏览器，可能会被识别为 Android 浏览器，规则需要前置。
	// UC 桌面版浏览器携带 Chrome 信息，需要放在 Chrome 之前。
	["uc", function (ua) {
	  if (ua.indexOf("ucbrowser/") >= 0) {
	    return (/\bucbrowser\/([0-9.]+)/
	    );
	  } else if (ua.indexOf("ubrowser/") >= 0) {
	    return (/\bubrowser\/([0-9.]+)/
	    );
	  } else if (/\buc\/[0-9]/.test(ua)) {
	    return (/\buc\/([0-9.]+)/
	    );
	  } else if (ua.indexOf("ucweb") >= 0) {
	    // `ucweb/2.0` is compony info.
	    // `UCWEB8.7.2.214/145/800` is browser info.
	    return (/\bucweb([0-9.]+)?/
	    );
	  } else {
	    return (/\b(?:ucbrowser|uc)\b/
	    );
	  }
	}], ["chrome", / (?:chrome|crios|crmo)\/([0-9.]+)/],
	// Android 默认浏览器。该规则需要在 safari 之前。
	["android", function (ua) {
	  if (ua.indexOf("android") === -1) {
	    return;
	  }
	  return (/\bversion\/([0-9.]+(?: beta)?)/
	  );
	}], ["blackberry", function (ua) {
	  var m = ua.match(re_blackberry_10) || ua.match(re_blackberry_6_7) || ua.match(re_blackberry_4_5);
	  return m ? { version: m[1] } : "blackberry";
	}], ["safari", /\bversion\/([0-9.]+(?: beta)?)(?: mobile(?:\/[a-z0-9]+)?)? safari\//],
	// 如果不能被识别为 Safari，则猜测是 WebView。
	["webview", /\bcpu(?: iphone)? os (?:[0-9._]+).+\bapplewebkit\b/], ["firefox", /\bfirefox\/([0-9.ab]+)/], ["nokia", /\bnokiabrowser\/([0-9.]+)/]];

	module.exports = {
	  device: DEVICES,
	  os: OS,
	  browser: BROWSER,
	  engine: ENGINE,
	  re_msie: re_msie
	};
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 4 */
/***/ function(module, exports) {

	
	var slice = [].slice;

	function Event(context){
	  this._ = {};
	  this.$ = context || this;
	};

	Event.prototype = {

	  on: function(eventName, handler){
	    var me = this;
	    var list = me._[eventName] || (me._[eventName] = []);
	    list.push(handler);
	    return me;
	  },

	  off: function(eventName, handler) {
	    var me = this;

	    // Remove *all* events
	    if (!(eventName || handler)) {
	      me._ = {};
	    } else {

	      var list = me._[eventName];
	      if (list) {
	        if (handler) {
	          for (var i = list.length - 1; i >= 0; i--) {
	            if (list[i] === handler) {
	              list.splice(i, 1);
	              break;
	            }
	          }
	        }
	        else {
	          delete me._[eventName];
	        }
	      }

	    }

	    return me;
	  },

	  emit: function(name) {
	    var me = this;

	    var list = me._[name];
	    var args = slice.call(arguments); args.shift();

	    if (list) {
	      // Copy callback lists to prevent modification
	      // https://github.com/seajs/seajs/issues/1058
	      list = list.slice();

	      // Execute event callbacks, use index because it's the faster.
	      for(var i = 0, len = list.length; i < len; i++) {
	        list[i].apply(me.$, args);
	      }
	    }

	    return me;
	  }

	};

	module.exports = Event;


/***/ }
/******/ ]);