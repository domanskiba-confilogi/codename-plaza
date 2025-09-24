import { escapeHtml } from "./helpers.js";
// Minimalny domyślny SVG (spinner)
var DEFAULT_ICON_SVG = "\n<svg viewBox=\"0 0 24 24\" width=\"112\" height=\"112\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\">\n<circle cx=\"12\" cy=\"12\" r=\"9\" stroke=\"currentColor\" stroke-opacity=\"0.2\" stroke-width=\"4\"/>\n<path d=\"M21 12a9 9 0 0 0-9-9\" stroke=\"currentColor\" stroke-width=\"4\" stroke-linecap=\"round\">\n<animateTransform attributeName=\"transform\" type=\"rotate\" from=\"0 12 12\" to=\"360 12 12\" dur=\"0.8s\" repeatCount=\"indefinite\"/>\n</path>\n</svg>\n";
function mountSuspenseScreen(selector, options) {
    var _a, _b, _c, _d, _e;
    if (options === void 0) { options = {}; }
    var root = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;
    if (!root) {
        throw new Error("mountSuspenseScreen: nie znaleziono elementu dla selektora \"".concat(selector, "\""));
    }
    var cfg = {
        message: (_a = options.message) !== null && _a !== void 0 ? _a : 'Ładowanie...',
        hint: (_b = options.hint) !== null && _b !== void 0 ? _b : null,
        iconSvg: (_d = (_c = options.iconSvg) !== null && _c !== void 0 ? _c : options.defaultIconSvg) !== null && _d !== void 0 ? _d : DEFAULT_ICON_SVG,
        fullScreen: options.fullScreen !== false,
        classes: (_e = options.classes) !== null && _e !== void 0 ? _e : '',
    };
    // Struktura i klasy odzwierciedlają Yew SuspenseScreen
    root.innerHTML = "\n<div class=\"w-full ".concat(cfg.fullScreen ? 'min-h-screen' : '', " flex flex-col gap-4 justify-center items-center z-10 ").concat(cfg.classes, "\">\n\t<div class=\"w-28 z-10\" data-role=\"icon\">").concat(cfg.iconSvg, "</div>\n\t<p class=\"animate-pulse select-none z-10\" role=\"status\" aria-live=\"polite\" data-role=\"message\">\n\t\t").concat(escapeHtml(String(cfg.message)), "\n\t</p>\n\t").concat(cfg.hint ? "<span class=\"text-sm text-neutral-600\" data-role=\"hint\">".concat(escapeHtml(String(cfg.hint)), "</span>") : '', "\n</div>\n");
    var container = root.firstElementChild;
    if (!container) {
        throw new Error('mountSuspenseScreen: nie udało się zbudować kontenera');
    }
    var iconEl = container.querySelector('[data-role="icon"]');
    var messageEl = container.querySelector('[data-role="message"]');
    var hintEl = container.querySelector('[data-role="hint"]') || null;
    if (!iconEl || !messageEl) {
        throw new Error('mountSuspenseScreen: brak wymaganych elementów (icon lub message)');
    }
    // Publiczne API
    return {
        setMessage: function (text) {
            messageEl.textContent = text != null ? String(text) : '';
        },
        setHint: function (text) {
            if (text == null || text === '') {
                if (hintEl) {
                    hintEl.remove();
                    hintEl = null;
                }
            }
            else {
                if (!hintEl) {
                    hintEl = document.createElement('span');
                    hintEl.className = 'text-sm text-neutral-600';
                    hintEl.setAttribute('data-role', 'hint');
                    container.appendChild(hintEl);
                }
                hintEl.textContent = String(text);
            }
        },
        setIconSvg: function (svg) {
            var _a;
            iconEl.innerHTML = (_a = svg !== null && svg !== void 0 ? svg : options.defaultIconSvg) !== null && _a !== void 0 ? _a : DEFAULT_ICON_SVG;
        },
        show: function () {
            container.classList.remove('hidden');
        },
        hide: function () {
            container.classList.add('hidden');
        },
        destroy: function () {
            root.innerHTML = '';
        },
        root: root,
        container: container,
    };
}
export { mountSuspenseScreen };
