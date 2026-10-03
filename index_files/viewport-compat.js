/* Preserve mobile browsers' default desktop viewport inside same-origin hosting frames.
 * Responsive pages retain device-width; desktop pages use a 980px or declared wider canvas.
 * No game styles, font sizes, window positions, or puzzle logic are changed.
 */
(function () {
    'use strict';
    function installViewport() {
        if (window.parent === window) return;
        var frame, host;
        try {
            frame = window.frameElement;
            host = window.parent;
            if (!frame || !host.document) return;
        } catch (_) { return; }

        // Release the previous document's sizing when navigating within the frame.
        if (typeof frame.__fishViewportRestore === 'function') frame.__fishViewportRestore();
        var viewport = document.querySelector('meta[name="viewport" i]');
        if (viewport && /width\s*=\s*device-width/i.test(viewport.content)) return;
        var declaredWidth = viewport && viewport.content.match(/width\s*=\s*(\d+)/i);
        var desktopWidth = declaredWidth ? Number(declaredWidth[1]) : 980;
        var sizingScript = document.querySelector('script[data-min-height]');
        var minimumHeight = sizingScript ? Number(sizingScript.dataset.minHeight) : 0;

        var container = frame.parentElement;
        if (!container) return;
        var properties = ['width', 'height', 'max-width', 'transform', 'transform-origin'];
        var saved = properties.map(function (name) {
            return [name, frame.style.getPropertyValue(name), frame.style.getPropertyPriority(name)];
        });
        var observer = null;
        var active = false;
        var disposed = false;
        function restoreStyles() {
            saved.forEach(function (item) {
                if (item[1]) frame.style.setProperty(item[0], item[1], item[2]);
                else frame.style.removeProperty(item[0]);
            });
            active = false;
        }
        function fit() {
            if (disposed) return;
            var width = container.clientWidth;
            var height = container.clientHeight;
            var mobile = host.matchMedia('(pointer: coarse)').matches || /iPhone|iPad|iPod|Android/i.test(host.navigator.userAgent);
            if (!mobile || (width >= desktopWidth && height >= minimumHeight) || width <= 0 || height <= 0) {
                if (active) restoreStyles();
                return;
            }
            // Short landscape screens must also fit fixed-height windows and controls.
            var scale = Math.min(1, width / desktopWidth, minimumHeight > 0 ? height / minimumHeight : Infinity);
            var offset = (width - desktopWidth * scale) / 2;
            frame.style.setProperty('width', desktopWidth + 'px', 'important');
            frame.style.setProperty('height', (height / scale) + 'px', 'important');
            frame.style.setProperty('max-width', 'none', 'important');
            frame.style.setProperty('transform-origin', '0 0', 'important');
            frame.style.setProperty('transform', 'translateX(' + offset + 'px) scale(' + scale + ')', 'important');
            active = true;
        }
        function dispose() {
            if (disposed) return;
            disposed = true;
            if (observer) observer.disconnect();
            host.removeEventListener('resize', fit);
            window.removeEventListener('pagehide', dispose);
            window.removeEventListener('pageshow', fit);
            restoreStyles();
            if (frame.__fishViewportRestore === dispose) delete frame.__fishViewportRestore;
        }
        frame.__fishViewportRestore = dispose;
        host.addEventListener('resize', fit);
        window.addEventListener('pagehide', dispose);
        window.addEventListener('pageshow', fit);
        if (host.ResizeObserver) {
            observer = new host.ResizeObserver(fit);
            observer.observe(container);
        }
        fit();
    }
    installViewport();
    window.addEventListener('pageshow', function (event) {
        if (event.persisted) installViewport();
    });
})();
