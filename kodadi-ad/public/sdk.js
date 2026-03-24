(function () {
  "use strict";

  var config = {
    apiKey: "",
    endpoint: "",
    sessionId: generateId(),
    visitorId: getOrCreateVisitorId(),
    flushInterval: 10000,
    queue: [],
  };

  function generateId() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getOrCreateVisitorId() {
    try {
      var id = localStorage.getItem("_kodadi_visitor");
      if (!id) {
        id = generateId();
        localStorage.setItem("_kodadi_visitor", id);
      }
      return id;
    } catch (e) {
      return generateId();
    }
  }

  function getDeviceInfo() {
    var ua = navigator.userAgent;
    var device = "desktop";
    if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
      device = /ipad|tablet/i.test(ua) ? "tablet" : "mobile";
    }
    var browser = "unknown";
    if (/chrome/i.test(ua)) browser = "chrome";
    else if (/firefox/i.test(ua)) browser = "firefox";
    else if (/safari/i.test(ua)) browser = "safari";
    else if (/edge/i.test(ua)) browser = "edge";
    return { device: device, browser: browser };
  }

  function addEvent(type, data) {
    var event = {
      type: type,
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
    };
    if (data) {
      if (data.element) event.element = data.element;
      if (data.metadata) event.metadata = data.metadata;
      if (data.page) event.page = data.page;
    }
    config.queue.push(event);
  }

  function flush() {
    if (config.queue.length === 0) return;

    var events = config.queue.slice();
    config.queue = [];

    var info = getDeviceInfo();

    var payload = {
      apiKey: config.apiKey,
      sessionId: config.sessionId,
      visitorId: config.visitorId,
      userAgent: navigator.userAgent,
      device: info.device,
      browser: info.browser,
      events: events,
    };

    fetch(config.endpoint + "/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(function () {
      config.queue = events.concat(config.queue);
    });
  }

  function trackPageView() {
    addEvent("PAGE_VIEW");
  }

  function trackClicks() {
    document.addEventListener("click", function (e) {
      var target = e.target;
      var selector = getElementSelector(target);
      addEvent("CLICK", { element: selector });
    });
  }

  function getElementSelector(el) {
    if (!el || el === document) return "";
    if (el.id) return "#" + el.id;
    if (el.className && typeof el.className === "string") {
      var classes = el.className.trim().split(/\s+/)[0];
      if (classes) return el.tagName.toLowerCase() + "." + classes;
    }
    return el.tagName.toLowerCase();
  }

  function trackScroll() {
    var maxScroll = 0;
    var scrollTimeout;

    window.addEventListener("scroll", function () {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function () {
        var scrollPercent = Math.round(
          ((window.scrollY + window.innerHeight) / document.body.scrollHeight) * 100
        );
        if (scrollPercent > maxScroll) {
          var milestone = Math.floor(scrollPercent / 25) * 25;
          var prevMilestone = Math.floor(maxScroll / 25) * 25;
          if (milestone > prevMilestone && milestone <= 100) {
            addEvent("SCROLL", { metadata: { depth: milestone } });
          }
          maxScroll = scrollPercent;
        }
      }, 200);
    });
  }

  function trackTimeOnPage() {
    var startTime = Date.now();
    window.addEventListener("beforeunload", function () {
      var duration = Math.round((Date.now() - startTime) / 1000);
      addEvent("TIME_ON_PAGE", { metadata: { duration: duration } });
      flush();
    });
  }

  var kodadi = {
    init: function (options) {
      config.apiKey = options.apiKey || "";
      config.endpoint = options.endpoint || "";

      if (!config.endpoint) {
        var script = document.querySelector("script[data-api-key]");
        if (script) {
          config.endpoint = new URL(script.src).origin;
        }
      }

      if (!config.apiKey) {
        var script = document.querySelector("script[data-api-key]");
        if (script) {
          config.apiKey = script.getAttribute("data-api-key") || "";
        }
      }

      if (!config.apiKey) {
        console.warn("[Kodadi] No API key provided.");
        return;
      }

      trackPageView();
      trackClicks();
      trackScroll();
      trackTimeOnPage();

      setInterval(flush, config.flushInterval);
      flush();
    },

    track: function (type, data) {
      addEvent(type, { metadata: data || {} });
    },

    pageView: function (page) {
      addEvent("PAGE_VIEW", { page: page });
    },

    flush: flush,
  };

  window.kodadi = kodadi;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      kodadi.init();
    });
  } else {
    kodadi.init();
  }
})();
