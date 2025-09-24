import { escapeHtml, mustQuerySelector } from "./helpers.js";
// Minimal, neutral default logo (zastąp własnym jeśli chcesz)
var DEFAULT_LOGO_SVG = "\n<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"h-7 w-7 text-yellow-400\" viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\">\n<path d=\"M12 2l3.09 6.26L22 9.27l-5 4.88L18.18 22 12 18.77 5.82 22 7 14.15l-5-4.88 6.91-1.01L12 2z\"/>\n</svg>\n";
// CSS.escape fallback (zachowawczy)
var cssEscape = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape
    : function (s) { return s.replace(/[^a-zA-Z0-9_\-]/g, function (ch) { return '\\' + ch; }); };
var defaultItems = [
    {
        type: 'dropdown',
        id: 'solutions',
        label: 'Solutions',
        menuWidth: 'w-64',
        items: [
            {
                label: 'Analytics',
                desc: 'Dashboards, insights, reporting',
                href: '#',
                icon: 'A',
                iconClass: 'bg-blue-500/20 text-blue-400',
            },
            {
                label: 'Automation',
                desc: 'Workflows and scheduling',
                href: '#',
                icon: '⚙',
                iconClass: 'bg-yellow-400/20 text-yellow-400',
            },
            {
                label: 'Integrations',
                desc: 'APIs and connectors',
                href: '#',
                icon: '⇄',
                iconClass: 'bg-neutral-800 text-neutral-300',
            },
        ],
    },
    {
        type: 'dropdown',
        id: 'resources',
        label: 'Resources',
        menuWidth: 'w-56',
        items: [
            { label: 'Blog', href: '#' },
            { label: 'Docs', href: '#' },
            { label: 'Tutorials', href: '#' },
            { separator: true },
            { label: 'Changelog', href: '#', accentClass: 'text-blue-400' },
        ],
    },
    { type: 'link', label: 'Pricing', href: '#' },
    { type: 'link', label: 'About', href: '#' },
];
export function mountNavbar(selector, options) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (options === void 0) { options = {}; }
    var root = document.querySelector(selector);
    if (!root)
        throw new Error("mountNavbar: no element found for selector \"".concat(selector, "\""));
    var uid = "nav-".concat(Math.random().toString(36).slice(2, 9));
    var cfg = {
        brandHref: (_a = options.brandHref) !== null && _a !== void 0 ? _a : '#',
        brandName: (_b = options.brandName) !== null && _b !== void 0 ? _b : 'Blackline',
        brandAccent: (_c = options.brandAccent) !== null && _c !== void 0 ? _c : 'Labs',
        ctaText: (_d = options.ctaText) !== null && _d !== void 0 ? _d : 'Contact',
        ctaHref: (_e = options.ctaHref) !== null && _e !== void 0 ? _e : '#',
        className: (_f = options.className) !== null && _f !== void 0 ? _f : '',
        items: Array.isArray(options.items) ? options.items : defaultItems,
        logoSvg: (_g = options.logoSvg) !== null && _g !== void 0 ? _g : DEFAULT_LOGO_SVG,
    };
    function renderLogo() {
        return "\n<a href=\"".concat(escapeHtml(cfg.brandHref), "\" class=\"flex items-center gap-3 group\">\n").concat(cfg.logoSvg, "\n<span class=\"text-lg font-semibold tracking-tight text-neutral-100\">\n").concat(escapeHtml(cfg.brandName), " <span class=\"text-blue-400\">").concat(escapeHtml(cfg.brandAccent), "</span>\n</span>\n</a>\n");
    }
    function renderDesktopDropdownContent(item) {
        if (!Array.isArray(item.items))
            return '';
        if (item.id === 'solutions') {
            // Karty z opisami i ikonami
            return "\n<div class=\"p-2\">\n".concat(item.items
                .map(function (entry) {
                var _a, _b, _c;
                return 'separator' in entry && entry.separator
                    ? '<div class="my-2 border-t border-neutral-800"></div>'
                    : "\n<a href=\"".concat(escapeHtml((_a = entry.href) !== null && _a !== void 0 ? _a : '#'), "\" class=\"flex items-start gap-3 rounded-md px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 focus:bg-neutral-800 focus:outline-none\">\n<span class=\"mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded ").concat(escapeHtml((_b = entry.iconClass) !== null && _b !== void 0 ? _b : 'bg-neutral-800 text-neutral-300'), "\">").concat(escapeHtml((_c = entry.icon) !== null && _c !== void 0 ? _c : ''), "</span>\n<span>\n<span class=\"block font-medium\">").concat(escapeHtml(entry.label), "</span>\n").concat(entry.desc !== undefined
                        ? "<span class=\"block text-xs text-neutral-400\">".concat(escapeHtml(entry.desc), "</span>")
                        : '', "\n</span>\n</a>");
            })
                .join(''), "\n</div>\n");
        }
        // Prosta lista (np. Resources)
        return "\n<div class=\"py-2\">\n".concat(item.items
            .map(function (entry) {
            var _a, _b;
            return 'separator' in entry && entry.separator
                ? '<div class="my-2 border-t border-neutral-800"></div>'
                : "\n<a href=\"".concat(escapeHtml((_a = entry.href) !== null && _a !== void 0 ? _a : '#'), "\" class=\"block px-4 py-2 text-sm ").concat(escapeHtml((_b = entry.accentClass) !== null && _b !== void 0 ? _b : 'text-neutral-200'), " hover:bg-neutral-800\">").concat(escapeHtml(entry.label), "</a>");
        })
            .join(''), "\n</div>\n");
    }
    function renderDesktopItem(item) {
        var _a, _b;
        if (item.type === 'link') {
            return "\n<a href=\"".concat(escapeHtml((_a = item.href) !== null && _a !== void 0 ? _a : '#'), "\" class=\"rounded-md px-3 py-2 text-sm font-medium text-neutral-300 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400\">\n").concat(escapeHtml(item.label), "\n</a>\n");
        }
        if (item.type === 'dropdown') {
            var ddId = "dd-".concat(item.id, "-").concat(uid);
            return "\n<div class=\"relative\" data-dropdown>\n<button type=\"button\"\nclass=\"inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-300 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400\"\naria-expanded=\"false\"\ndata-dropdown-toggle=\"".concat(escapeHtml(ddId), "\">\n").concat(escapeHtml(item.label), "\n<svg class=\"h-4 w-4 text-neutral-400\" viewBox=\"0 0 20 20\" fill=\"currentColor\" aria-hidden=\"true\">\n<path fill-rule=\"evenodd\" d=\"M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z\" clip-rule=\"evenodd\"/>\n</svg>\n</button>\n<div id=\"").concat(escapeHtml(ddId), "\"\nclass=\"absolute right-0 mt-2 ").concat(escapeHtml((_b = item.menuWidth) !== null && _b !== void 0 ? _b : 'w-64'), " origin-top-right rounded-lg border border-neutral-800 bg-neutral-900/95 shadow-lg ring-1 ring-black/0 backdrop-blur hidden\"\nrole=\"menu\"\naria-label=\"").concat(escapeHtml(item.label), " submenu\">\n").concat(renderDesktopDropdownContent(item), "\n</div>\n</div>\n");
        }
        return '';
    }
    function renderMobileDropdownContent(item) {
        if (!Array.isArray(item.items))
            return '';
        if (item.id === 'solutions') {
            return item.items
                .map(function (entry) {
                var _a;
                return 'separator' in entry && entry.separator
                    ? '<div class="my-2 border-t border-neutral-800"></div>'
                    : "\n<a href=\"".concat(escapeHtml((_a = entry.href) !== null && _a !== void 0 ? _a : '#'), "\" class=\"block rounded-md px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900\">").concat(escapeHtml(entry.label), "</a>");
            })
                .join('');
        }
        return item.items
            .map(function (entry) {
            var _a, _b;
            return 'separator' in entry && entry.separator
                ? '<div class="my-2 border-t border-neutral-800"></div>'
                : "\n<a href=\"".concat(escapeHtml((_a = entry.href) !== null && _a !== void 0 ? _a : '#'), "\" class=\"block rounded-md px-3 py-2 text-sm ").concat(escapeHtml((_b = entry.accentClass) !== null && _b !== void 0 ? _b : 'text-neutral-200'), " hover:bg-neutral-900\">").concat(escapeHtml(entry.label), "</a>");
        })
            .join('');
    }
    function renderMobileItem(item) {
        var _a;
        if (item.type === 'link') {
            return "\n<a href=\"".concat(escapeHtml((_a = item.href) !== null && _a !== void 0 ? _a : '#'), "\" class=\"block rounded-md px-4 py-3 text-sm font-medium text-neutral-200 hover:bg-neutral-900\">\n").concat(escapeHtml(item.label), "\n</a>\n");
        }
        if (item.type === 'dropdown') {
            var mddId = "mdd-".concat(item.id, "-").concat(uid);
            return "\n<div class=\"rounded-lg border border-neutral-800\">\n<button type=\"button\"\nclass=\"flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-medium text-neutral-200 hover:bg-neutral-900 focus:outline-none\"\naria-expanded=\"false\"\ndata-dropdown-toggle=\"".concat(escapeHtml(mddId), "\">\n<span>").concat(escapeHtml(item.label), "</span>\n<svg class=\"h-4 w-4 text-neutral-400\" viewBox=\"0 0 20 20\" fill=\"currentColor\" aria-hidden=\"true\">\n<path fill-rule=\"evenodd\" d=\"M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z\" clip-rule=\"evenodd\"/>\n</svg>\n</button>\n<div id=\"").concat(escapeHtml(mddId), "\" class=\"hidden px-2 pb-2\">\n").concat(renderMobileDropdownContent(item), "\n</div>\n</div>\n");
        }
        return '';
    }
    // Render
    root.innerHTML = "\n<header id=\"".concat(escapeHtml(uid), "\" class=\"sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur ").concat(escapeHtml(cfg.className), "\">\n\t<div class=\"mx-auto max-w-7xl px-4 sm:px-6 lg:px-8\">\n\t\t<div class=\"flex h-16 items-center justify-between\">\n\t\t\t").concat(renderLogo(), "\n\t\t\t<nav class=\"hidden lg:flex items-center gap-2\">\n\t\t\t\t").concat(cfg.items.map(function (it) { return renderDesktopItem(it); }).join(''), "\n\t\t\t\t<a href=\"").concat(escapeHtml(cfg.ctaHref), "\"\n\t\t\t\t\tclass=\"ml-2 inline-flex items-center justify-center rounded-md bg-yellow-400 px-3 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400\">\n\t\t\t\t\t").concat(escapeHtml(cfg.ctaText), "\n\t\t\t\t</a>\n\t\t\t</nav>\n\t\t\t<div class=\"lg:hidden\">\n\t\t\t\t<button\n\t\t\t\t\ttype=\"button\"\n\t\t\t\t\tid=\"").concat(escapeHtml(uid), "-mobileBtn\"\n\t\t\t\t\tclass=\"inline-flex items-center justify-center rounded-md p-2 text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400\"\n\t\t\t\t\taria-controls=\"").concat(escapeHtml(uid), "-mobileMenu\"\n\t\t\t\t\taria-expanded=\"false\">\n\t\t\t\t\t<span class=\"sr-only\">Open main menu</span>\n\t\t\t\t\t<svg id=\"").concat(escapeHtml(uid), "-icon-menu\" class=\"h-6 w-6\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" aria-hidden=\"true\">\n\t\t\t\t\t\t<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5\"/>\n\t\t\t\t\t</svg>\n\t\t\t\t\t<svg id=\"").concat(escapeHtml(uid), "-icon-close\" class=\"hidden h-6 w-6\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" aria-hidden=\"true\">\n\t\t\t\t\t\t<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M6 18 18 6M6 6l12 12\"/>\n\t\t\t\t\t</svg>\n\t\t\t\t</button>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\t<div id=\"").concat(escapeHtml(uid), "-mobileMenu\" class=\"lg:hidden hidden border-t border-neutral-800 bg-neutral-950/95 backdrop-blur\">\n\t\t<div class=\"space-y-1 px-4 py-4\">\n\t\t\t").concat(cfg.items.map(function (it) { return renderMobileItem(it); }).join(''), "\n\t\t\t<a href=\"").concat(escapeHtml(cfg.ctaHref), "\" class=\"block rounded-md bg-yellow-400 px-4 py-3 text-center text-sm font-semibold text-black hover:bg-yellow-300\">").concat(escapeHtml(cfg.ctaText), "</a>\n\t\t</div>\n\t</div>\n</header>\n");
    // Elementy instancji
    var headerEl = mustQuerySelector(root, "#".concat(cssEscape(uid)));
    if (!headerEl)
        throw new Error('mountNavbar: failed to render header');
    var mobileBtn = mustQuerySelector(root, "#".concat(cssEscape(uid), "-mobileBtn"));
    var mobileMenu = mustQuerySelector(root, "#".concat(cssEscape(uid), "-mobileMenu"));
    var iconMenu = mustQuerySelector(root, "#".concat(cssEscape(uid), "-icon-menu"));
    var iconClose = mustQuerySelector(root, "#".concat(cssEscape(uid), "-icon-close"));
    // Helpers
    function closeAllDropdowns(exceptId) {
        var menus = headerEl.querySelectorAll('[id^="dd-"], [id^="mdd-"]');
        menus.forEach(function (menu) {
            if (exceptId && menu.id === exceptId)
                return;
            if (!menu.classList.contains('hidden')) {
                menu.classList.add('hidden');
            }
            var btn = headerEl.querySelector("[data-dropdown-toggle=\"".concat(menu.id, "\"]"));
            if (btn)
                btn.setAttribute('aria-expanded', 'false');
        });
    }
    function isMobileMenuOpen() {
        return !!mobileMenu && !mobileMenu.classList.contains('hidden');
    }
    function openMobileMenu() {
        if (!mobileMenu)
            return;
        mobileMenu.classList.remove('hidden');
        mobileBtn === null || mobileBtn === void 0 ? void 0 : mobileBtn.setAttribute('aria-expanded', 'true');
        iconMenu === null || iconMenu === void 0 ? void 0 : iconMenu.classList.add('hidden');
        iconClose === null || iconClose === void 0 ? void 0 : iconClose.classList.remove('hidden');
    }
    function closeMobileMenu() {
        if (!mobileMenu)
            return;
        mobileMenu.classList.add('hidden');
        mobileBtn === null || mobileBtn === void 0 ? void 0 : mobileBtn.setAttribute('aria-expanded', 'false');
        iconMenu === null || iconMenu === void 0 ? void 0 : iconMenu.classList.remove('hidden');
        iconClose === null || iconClose === void 0 ? void 0 : iconClose.classList.add('hidden');
        closeAllDropdowns(); // zamyka też mobilne akordeony
    }
    // Event handlers
    var onDocumentClick = function (e) {
        var _a;
        var target = e.target;
        if (!target)
            return;
        var withinThisHeader = headerEl.contains(target);
        var toggleBtn = withinThisHeader && target instanceof Element ? target.closest('[data-dropdown-toggle]') : null;
        var menuId = (_a = toggleBtn === null || toggleBtn === void 0 ? void 0 : toggleBtn.getAttribute('data-dropdown-toggle')) !== null && _a !== void 0 ? _a : null;
        if (toggleBtn && menuId) {
            var menu = headerEl.querySelector('#' + cssEscape(menuId));
            if (!menu)
                return;
            var isHidden = menu.classList.contains('hidden');
            closeAllDropdowns(isHidden ? menuId : undefined);
            menu.classList.toggle('hidden', !isHidden);
            toggleBtn.setAttribute('aria-expanded', String(isHidden));
            return;
        }
        // Klik poza headerem zamyka dropdowny i mobilne menu (tylko dla tej instancji)
        if (!withinThisHeader) {
            closeAllDropdowns();
            if (isMobileMenuOpen())
                closeMobileMenu();
        }
    };
    var onKeydown = function (e) {
        if (e.key === 'Escape') {
            closeAllDropdowns();
            if (isMobileMenuOpen())
                closeMobileMenu();
        }
    };
    var onMobileBtnClick = function () {
        if (isMobileMenuOpen()) {
            closeMobileMenu();
        }
        else {
            openMobileMenu();
        }
    };
    // Attach
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onKeydown);
    mobileBtn === null || mobileBtn === void 0 ? void 0 : mobileBtn.addEventListener('click', onMobileBtnClick);
    // Public API
    return {
        root: root,
        headerEl: headerEl,
        openMobile: openMobileMenu,
        closeMobile: closeMobileMenu,
        closeDropdowns: closeAllDropdowns,
        destroy: function () {
            document.removeEventListener('click', onDocumentClick);
            document.removeEventListener('keydown', onKeydown);
            mobileBtn === null || mobileBtn === void 0 ? void 0 : mobileBtn.removeEventListener('click', onMobileBtnClick);
            root.innerHTML = '';
        },
    };
}
