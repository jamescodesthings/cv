(function () {
  var root = document.documentElement;

  // Loaded in <head>, so the theme and the js class are set before the first paint. The js class
  // lets the CSS hide sections for their entrance only when this script is running to show them.
  root.classList.add('js');

  // The browser bars take the page background. The two media-query tags in the templates cover the
  // first paint; once the theme is chosen here they become one tag for the theme actually showing.
  function setThemeColor(dark) {
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) {
      meta.remove();
    });
    var meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = dark ? '#090b12' : '#faf8f4';
    document.head.appendChild(meta);
  }

  function setTheme(dark) {
    root.classList.toggle('dark', dark);
    setThemeColor(dark);
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch (e) {}
  }

  // Default to dark; respect saved preference or system preference. ?dark=true forces dark.
  var saved = null;
  try {
    saved = localStorage.getItem('theme');
  } catch (e) {}
  var forced = new URLSearchParams(window.location.search).get('dark') === 'true';
  setTheme(forced || saved === 'dark' || (!saved && !window.matchMedia('(prefers-color-scheme: light)').matches));

  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('darkModeToggle');

    function label() {
      toggle.setAttribute(
        'aria-label',
        root.classList.contains('dark') ? 'Switch to light mode' : 'Switch to dark mode',
      );
    }

    if (toggle) {
      label();
      toggle.addEventListener('click', function () {
        // The orbit and the page colours only animate once the visitor has asked for a change.
        root.classList.add('theme-motion');
        setTheme(!root.classList.contains('dark'));
        label();
      });
    }

    // Sections fade in, and each section label draws its rule, the first time they scroll into view.
    var els = document.querySelectorAll('[data-animate], .section-label');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -40px 0px' },
    );
    els.forEach(function (el) {
      observer.observe(el);
    });
  });
})();
