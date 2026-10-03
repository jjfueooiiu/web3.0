(function () {
  function syncBrowserTitle() {
    var title = document.title;
    if (!title || window.parent === window) return;

    try {
      window.parent.document.title = title;
    } catch (error) {
      // The hosted 404 game is same-origin. Ignore access errors elsewhere.
    }
  }

  syncBrowserTitle();
  window.addEventListener("DOMContentLoaded", syncBrowserTitle);
  window.addEventListener("pageshow", syncBrowserTitle);

  var titleElement = document.querySelector("title");
  if (titleElement && typeof MutationObserver !== "undefined") {
    new MutationObserver(syncBrowserTitle).observe(titleElement, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }
})();
