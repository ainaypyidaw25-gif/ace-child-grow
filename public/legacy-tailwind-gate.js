// Tailwind 4 needs color-mix() and @property. Older iOS WebViews and Android
// WebViews continue to use the pre-migration CSS snapshot until native minimum
// OS support can be raised after device QA.
(function () {
  // Some engines support color-mix before the Properties and Values API.
  // They still need the fallback (for example Safari 16.2/16.3).
  if (typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      typeof CSS.registerProperty === 'function' &&
      CSS.supports('color', 'color-mix(in srgb, red, blue)')) return;
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/legacy-tailwind-v3.css';
  link.setAttribute('data-legacy-tailwind', '');
  document.head.appendChild(link);
})();
