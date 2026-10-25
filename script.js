// Emmanuel Fulfilled: small bits of behaviour for the site
(function () {
  "use strict";

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  // Local time in Dublin, shown in the "Right now" panel
  var clockEls = document.querySelectorAll("[data-clock]");
  var timeFormat = null;
  try {
    timeFormat = new Intl.DateTimeFormat("en-IE", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "Europe/Dublin"
    });
  } catch (e) {}

  function updateClock() {
    if (!timeFormat) return;
    var time = timeFormat.format(new Date());
    clockEls.forEach(function (el) {
      el.textContent = " · " + time + " local time";
    });
  }
  updateClock();
  setInterval(updateClock, 20000);

  // Smooth scrolling for in-page links, keeping the address bar in sync
  document.addEventListener("click", function (event) {
    var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;

    var id = link.getAttribute("href").slice(1);
    var behavior = reduceMotion ? "auto" : "smooth";

    if (id === "top") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: behavior });
      try { history.pushState(null, "", location.pathname + location.search); } catch (e) {}
      return;
    }

    var target = id ? document.getElementById(id) : null;
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: behavior, block: "start" });

    if (link.classList.contains("skip")) {
      target.setAttribute("tabindex", "-1");
      try { target.focus({ preventScroll: true }); } catch (e) {}
    } else {
      try { history.pushState(null, "", "#" + id); } catch (e) {}
    }
  });

  // Highlight the section you're reading in the top bar
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
  if ("IntersectionObserver" in window && navLinks.length) {
    var linkFor = {};
    navLinks.forEach(function (a) {
      linkFor[a.getAttribute("href").slice(1)] = a;
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
        var active = linkFor[entry.target.id];
        if (active) active.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    ["top", "about", "projects", "cv", "contact"].forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  // Copy email address button
  var copyBtn = document.getElementById("copy-email");
  var emailEl = document.getElementById("email");
  var statusEl = document.getElementById("copy-status");
  var resetTimer = null;

  function flash(label, message) {
    copyBtn.textContent = label;
    statusEl.textContent = message;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(function () {
      copyBtn.textContent = "Copy";
      statusEl.textContent = "";
    }, 2200);
  }

  function selectEmail() {
    try {
      var range = document.createRange();
      range.selectNodeContents(emailEl);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (e) {}
    flash("Selected", "Email address selected, ready to copy");
  }

  if (copyBtn && emailEl && statusEl) {
    copyBtn.addEventListener("click", function () {
      var address = emailEl.textContent.trim();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(address).then(function () {
            flash("Copied", "Email address copied");
          }, selectEmail);
        } else {
          selectEmail();
        }
      } catch (e) {
        selectEmail();
      }
    });
  }
})();
