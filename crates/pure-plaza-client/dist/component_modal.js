import { escapeHtml, mustQuerySelector } from "./helpers.js";
import { mountButton } from "./component_button.js";
var isModalSize = function (v) {
    return v === 'sm' || v === 'md' || v === 'lg' || v === 'xl';
};
export function mountModal(selector, options) {
    var _a, _b, _c, _d;
    if (options === void 0) { options = {}; }
    var root = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;
    if (!root) {
        throw new Error("mountModal: no element found for selector \"".concat(String(selector), "\""));
    }
    var uid = Math.floor(Math.random() * 1e8);
    var dialogId = "modal-".concat(uid);
    var titleId = "".concat(dialogId, "-title");
    var cfg = {
        title: (_a = options.title) !== null && _a !== void 0 ? _a : 'Modal title',
        contentHtml: (_b = options.contentHtml) !== null && _b !== void 0 ? _b : '<p class="text-neutral-300">Your content goes here.</p>',
        size: isModalSize(options.size) ? options.size : 'md',
        initialOpen: !!options.initialOpen,
        closeOnEsc: options.closeOnEsc !== false,
        closeOnBackdrop: options.closeOnBackdrop !== false,
        showCloseButton: options.showCloseButton !== false,
        classes: options.classes || '',
        primaryAction: (_c = options.primaryAction) !== null && _c !== void 0 ? _c : null,
        secondaryAction: (_d = options.secondaryAction) !== null && _d !== void 0 ? _d : null,
        onOpen: typeof options.onOpen === 'function' ? options.onOpen : null,
        onClose: typeof options.onClose === 'function' ? options.onClose : null,
    };
    var sizeMap = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl',
    };
    root.innerHTML = "\n<div class=\"fixed inset-0 z-50 bg-neutral-950/80 ".concat(cfg.initialOpen ? '' : 'hidden', " overflow-auto\" data-role=\"overlay\" aria-hidden=\"").concat(cfg.initialOpen ? 'false' : 'true', "\">\n\t<div class=\"w-full p-4 flex items-center justify-center min-h-screen\" data-role=\"backdrop\">\n\t\t<div\n\t\t\tid=\"").concat(dialogId, "\"\n\t\t\tclass=\"w-full ").concat(sizeMap[cfg.size], " ").concat(cfg.classes, "\"\n\t\t\trole=\"dialog\"\n\t\t\taria-modal=\"true\"\n\t\t\taria-labelledby=\"").concat(titleId, "\"\n\t\t\tdata-role=\"dialog\"\n\t\t>\n\t\t\t<div class=\"bg-neutral-900/60 ring-1 ring-neutral-800 rounded-2xl shadow-lg overflow-hidden\">\n\t\t\t\t<div class=\"flex items-center justify-between px-6 py-4 border-b border-neutral-800\">\n\t\t\t\t\t<h2 id=\"").concat(titleId, "\" class=\"text-lg font-semibold text-neutral-100\">").concat(escapeHtml(cfg.title), "</h2>\n\t\t\t\t\t").concat(cfg.showCloseButton ? "\n\t\t\t\t\t<button type=\"button\" data-role=\"close\"\n\t\t\t\t\t\tclass=\"inline-flex items-center justify-center rounded-md p-2 text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400\"\n\t\t\t\t\t\taria-label=\"Close\">\n\t\t\t\t\t\t<svg class=\"w-6 h-6\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" aria-hidden=\"true\">\n\t\t\t\t\t\t\t<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M6 18 18 6M6 6l12 12\"></path>\n\t\t\t\t\t\t</svg>\n\t\t\t\t\t</button>\n\t\t\t\t\t" : '', "\n\t\t\t\t</div>\n\t\t\t\t<div class=\"px-6 py-4\" data-role=\"content\">").concat(cfg.contentHtml, "</div>\n\t\t\t\t<div class=\"px-6 py-4 border-t border-neutral-800 flex items-center justify-end gap-2\" data-role=\"footer\"></div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>\n");
    var overlayEl = mustQuerySelector(root, '[data-role="overlay"]');
    var dialogEl = mustQuerySelector(root, '[data-role="dialog"]');
    var contentEl = mustQuerySelector(root, '[data-role="content"]');
    var footerEl = mustQuerySelector(root, '[data-role="footer"]');
    var closeBtn = root.querySelector('[data-role="close"]'); // nie wymagamy już mustQuerySelector
    if (!overlayEl || !dialogEl || !contentEl || !footerEl) {
        throw new Error('mountModal: failed to initialize modal DOM structure.');
    }
    var isOpen = !!cfg.initialOpen;
    var lastFocusedEl = null;
    var primaryBtnApi = null;
    var secondaryBtnApi = null;
    var actionsLoading = false;
    var api;
    function destroyActionButtons() {
        var _a, _b;
        try {
            (_a = primaryBtnApi === null || primaryBtnApi === void 0 ? void 0 : primaryBtnApi.destroy) === null || _a === void 0 ? void 0 : _a.call(primaryBtnApi);
        }
        catch (_c) { }
        try {
            (_b = secondaryBtnApi === null || secondaryBtnApi === void 0 ? void 0 : secondaryBtnApi.destroy) === null || _b === void 0 ? void 0 : _b.call(secondaryBtnApi);
        }
        catch (_d) { }
        primaryBtnApi = null;
        secondaryBtnApi = null;
    }
    function renderActions() {
        destroyActionButtons();
        footerEl.innerHTML = '';
        if (cfg.secondaryAction && cfg.secondaryAction.label) {
            var secId = "".concat(dialogId, "-btn-secondary-").concat(Math.floor(Math.random() * 1e8));
            var secMount = document.createElement('span');
            secMount.id = secId;
            footerEl.appendChild(secMount);
            secondaryBtnApi = mountButton("#".concat(secId), {
                label: cfg.secondaryAction.label,
                variant: 'secondary',
                size: 'md',
                type: 'button',
                loading: actionsLoading,
                onClick: function (e) {
                    var _a;
                    if (typeof ((_a = cfg.secondaryAction) === null || _a === void 0 ? void 0 : _a.onClick) === 'function') {
                        cfg.secondaryAction.onClick(e, api);
                    }
                },
            });
        }
        if (cfg.primaryAction && cfg.primaryAction.label) {
            var priId = "".concat(dialogId, "-btn-primary-").concat(Math.floor(Math.random() * 1e8));
            var priMount = document.createElement('span');
            priMount.id = priId;
            footerEl.appendChild(priMount);
            primaryBtnApi = mountButton("#".concat(priId), {
                label: cfg.primaryAction.label,
                variant: 'primary',
                size: 'md',
                type: 'button',
                loading: actionsLoading,
                onClick: function (e) {
                    var _a;
                    if (typeof ((_a = cfg.primaryAction) === null || _a === void 0 ? void 0 : _a.onClick) === 'function') {
                        cfg.primaryAction.onClick(e, api);
                    }
                },
            });
        }
    }
    renderActions();
    function getFocusable() {
        var nodes = dialogEl.querySelectorAll('a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        return Array.from(nodes).filter(function (el) { return el instanceof HTMLElement; });
    }
    function trapTab(e) {
        if (e.key !== 'Tab')
            return;
        var focusable = getFocusable();
        if (!focusable.length)
            return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (first === null || last === null)
            return;
        var active = document.activeElement;
        if (e.shiftKey && active === first) {
            e.preventDefault();
            last.focus();
        }
        else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        }
    }
    function open() {
        if (isOpen)
            return;
        isOpen = true;
        lastFocusedEl = document.activeElement;
        overlayEl.classList.remove('hidden');
        overlayEl.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('overflow-hidden');
        var focusable = getFocusable();
        var preferred = focusable.find(function (el) { return el.getAttribute('data-role') === 'close'; }) ||
            closeBtn ||
            focusable[0];
        if (preferred)
            setTimeout(function () { return preferred.focus(); }, 0);
        if (cfg.onOpen) {
            try {
                cfg.onOpen(api);
            }
            catch (e) {
                console.error('mountModal onOpen callback failed:', e);
            }
        }
    }
    function close() {
        if (!isOpen)
            return;
        isOpen = false;
        overlayEl.classList.add('hidden');
        overlayEl.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('overflow-hidden');
        var lf = lastFocusedEl;
        if (lf && typeof lf.focus === 'function') {
            setTimeout(function () { return lf.focus(); }, 0);
        }
        if (cfg.onClose) {
            try {
                cfg.onClose(api);
            }
            catch (e) {
                console.error('mountModal onClose callback failed:', e);
            }
        }
    }
    function onBackdropClick(e) {
        if (!cfg.closeOnBackdrop)
            return;
        var backdrop = overlayEl.querySelector('[data-role="backdrop"]');
        if (backdrop && e.target === backdrop) {
            close();
        }
    }
    function onEsc(e) {
        if (!cfg.closeOnEsc)
            return;
        if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
    }
    overlayEl.addEventListener('click', onBackdropClick);
    document.addEventListener('keydown', onEsc);
    dialogEl.addEventListener('keydown', trapTab);
    if (closeBtn)
        closeBtn.addEventListener('click', close);
    api = {
        open: open,
        close: close,
        isOpen: function () { return isOpen; },
        setTitle: function (text) {
            var t = root.querySelector("#".concat(CSS.escape(titleId)));
            if (t)
                t.textContent = text != null ? String(text) : '';
        },
        setContent: function (htmlOrNode) {
            if (htmlOrNode instanceof Node) {
                contentEl.innerHTML = '';
                contentEl.appendChild(htmlOrNode);
            }
            else {
                contentEl.innerHTML = htmlOrNode != null ? String(htmlOrNode) : '';
            }
        },
        setSize: function (size) {
            var _a;
            if (!isModalSize(size))
                return;
            (_a = dialogEl.classList).remove.apply(_a, Object.values(sizeMap));
            dialogEl.classList.add(sizeMap[size]);
        },
        setPrimaryAction: function (cfgAction) {
            cfg.primaryAction = cfgAction !== null && cfgAction !== void 0 ? cfgAction : null;
            renderActions();
        },
        setSecondaryAction: function (cfgAction) {
            cfg.secondaryAction = cfgAction !== null && cfgAction !== void 0 ? cfgAction : null;
            renderActions();
        },
        setCloseOnEsc: function (val) {
            cfg.closeOnEsc = !!val;
        },
        setCloseOnBackdrop: function (val) {
            cfg.closeOnBackdrop = !!val;
        },
        setActionsLoading: function (loading) {
            actionsLoading = !!loading;
            if (secondaryBtnApi)
                secondaryBtnApi.setLoading(actionsLoading);
            if (primaryBtnApi)
                primaryBtnApi.setLoading(actionsLoading);
        },
        root: root,
        overlayEl: overlayEl,
        dialogEl: dialogEl,
        contentEl: contentEl,
        destroy: function () {
            overlayEl.removeEventListener('click', onBackdropClick);
            document.removeEventListener('keydown', onEsc);
            dialogEl.removeEventListener('keydown', trapTab);
            if (closeBtn)
                closeBtn.removeEventListener('click', close);
            document.documentElement.classList.remove('overflow-hidden');
            destroyActionButtons(); // posprzątaj Button API
            root.innerHTML = '';
        },
    };
    if (cfg.initialOpen)
        open();
    return api;
}
