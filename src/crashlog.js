window.Crashlog = (function (window, document, navigator) {
  "use strict";

  var Public = {
    report: function (error) {
      send({
        event: {
          message: error.toString(),
          timestamp: getTimestamp()
        },
        backtrace: errorStack(error),
        environment: {}
      });
    },

    log: function (message) {
      send({
        event: {
          message: message,
          timestamp: getTimestamp()
        }
      });
    },

    simulateErrorReport: function () {
      try {
        throw new Error("Simulated Error");
      } catch (error) {
        this.report(error);
      }
    }
  };

  var API_KEY_REGEX = /^[0-9a-f]{32}$/i;
  var DEFAULT_ENDPOINT = "//stdin.crashlog.io/events";

  // if (!data) {
  //   error("Error loading CrashLog: window._crashlog not set");
  //   return;
  // }

  // if (!data.key) {
  //   error("Error loading CrashLog: window._crashlog.key not set");
  //   return;
  // }

  // if (apiKey == null || !apiKey.match(API_KEY_REGEX)) {
  //   log("Error loading CrashLog: Invalid API key '" + apiKey + "'");
  //   return;
  // }

  var scripts = document.getElementsByTagName("script");
  var thisScript = scripts[scripts.length - 1];

  function send(event, attributes) {
    var apiKey = getSetting("apiKey");

    if (apiKey == null || !apiKey.match(API_KEY_REGEX)) {
      log("Invalid API key '" + apiKey + "'");
      return;
    }

    return apiKey;
  }

  function post(params) {
    var iframe = createIframe(),
        form = createForm(params);

    document.body.appendChild(iframe);

    form.target = iframe.name;
    document.body.appendChild(form);
    form.submit();

    iframe.onload = function () {
      form.parentNode.removeChild(form);
      iframe.parentNode.removeChild(iframe);
    };
  }

  function createIframe() {
    var iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = "javascript:false;";
    iframe.name = "crash-report-" + new Date().getTime().toString();
    return iframe;
  }

  function createForm(params) {
    var form = document.createElement("form");
    form.style.display = "none";
    form.method = "post";
    form.action = DEFAULT_ENDPOINT;
    // if (cm.debug) form.action = form.action + "?debug=1";
    // addFormParams(form, globalFormParams());
    addFormParams(form, params);
    return form;
  }

  function addFormParams(form, params) {
    for (var name in params) {
      if (params.hasOwnProperty(name))
        addFormParam(form, name, params[name]);
    }
  }

  function addFormParam(form, name, value) {
    if (!value) {
      // Skip it
    } else if (value instanceof Object) {
      // Recursively add it's keys
      for (var prop in value) {
        if (value.hasOwnProperty(prop))
          addFormParam(form, name + "[" + prop + "]", value[prop]);
      }
    } else {
      value = trim(String(value));
      if (value.length !== 0) {
        // Add it as a hidden input
        var input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
    }
  }

  function shouldIgnore(message) {
    message = trim(message);
    if (message == "Error loading script") return true;
    if (message == "Permission denied") return true;
    if (message == "Script error.") return true;
    return false;
  };

  function errorStack(error) {
    return (error.stack || error.stackTrace || error.backtrace || error.stacktrace);
  };

  function trim(val) {
    if (val && val.replace) {
      return val.replace(/^\s+|\s+$/g, '');
    } else {
      return val;
    }
  };

  function shouldIgnore(message) {
    message = trim(message);
    if (message == "Error loading script") return true;
    if (message == "Permission denied") return true;
    if (message == "Script error.") return true;
    return false;
  };

  // Get configuration settings from either `self` (the `cl` object)
  // or `data` (the `data-*` attributes).
  var data;
  function getSetting(name) {
    data = data || getData(thisScript);
    return self[name] || data[name.toLowerCase()];
  }

  // Extrat all `data-*` attributes from a DOM element and return them as an
  // object. This is used to allow Bugsnag settings to be set via attributes
  // on the `script` tag, eg. `<script data-apikey="xyz">`.
  // Similar to jQuery's `$(el).data()` method.
  function getData(node) {
    var dataAttrs = {};
    var dataRegex = /^data\-([\w\-]+)$/;
    var attrs = node.attributes;
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      if (dataRegex.test(attr.nodeName)) {
        var key = attr.nodeName.match(dataRegex)[1];
        dataAttrs[key] = attr.nodeValue;
      }
    }

    return dataAttrs;
  }

  function log(msg) {
    var console = window.console;
    if (console !== undefined && console.log !== undefined) {
      console.log("[CrashLog] " + msg);
    }
  }

  function error() {
    if (window.console && console.error) console.error(arguments[0]);
  }

  function getTimestamp() {
    var d = new Date();
    return ((d.getTime() + d.getTimezoneOffset()*60*1000) / 1000).toFixed();
  };

  return Public;
}(window, document, navigator));
// window._crashlog || window.crashlog || window._crashmat
