var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
export function mountButton(selector, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (options === void 0) { options = {}; }
    var root = document.querySelector(selector);
    if (!root) {
        throw new Error("mountButton: no element found for selector \"".concat(selector, "\""));
    }
    var cfg = {
        id: (_a = options.id) !== null && _a !== void 0 ? _a : "btn-".concat(Math.floor(Math.random() * 1e12)),
        label: (_b = options.label) !== null && _b !== void 0 ? _b : 'Button',
        variant: (_c = options.variant) !== null && _c !== void 0 ? _c : 'primary',
        size: (_d = options.size) !== null && _d !== void 0 ? _d : 'md',
        href: typeof options.href === 'string' ? options.href : null,
        target: options.target,
        rel: options.rel,
        block: !!options.block,
        rounded: (_e = options.rounded) !== null && _e !== void 0 ? _e : 'md',
        leadingIconSvg: (_f = options.leadingIconSvg) !== null && _f !== void 0 ? _f : '',
        trailingIconSvg: (_g = options.trailingIconSvg) !== null && _g !== void 0 ? _g : '',
        disabled: !!options.disabled,
        loading: !!options.loading,
        type: (_h = options.type) !== null && _h !== void 0 ? _h : 'button',
        ariaLabel: options.ariaLabel,
        onClick: typeof options.onClick === 'function' ? options.onClick : undefined,
    };
    var sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-3 text-base',
    };
    var roundedClasses = {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-full',
    };
    var variantClasses = {
        primary: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/25 focus:ring-blue-400/60',
        secondary: 'text-neutral-200 hover:bg-neutral-900 focus:ring-neutral-400/60',
        success: 'bg-green-500/20 text-green-400 hover:bg-green-500/25 focus:ring-green-400/60',
        danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/25 focus:ring-red-400/60',
        warning: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/25 focus:ring-amber-400/60',
        ghost: 'bg-transparent text-neutral-200 hover:bg-neutral-900/60 focus:ring-neutral-400/60',
        outline: 'bg-transparent text-neutral-200 hover:bg-neutral-900 focus:ring-neutral-400/60',
    };
    var BASE = 'inline-flex items-center gap-2 font-semibold ring-1 ring-inset ring-neutral-800 transition-colors ' +
        'focus:outline-none focus:ring-2 select-none disabled:opacity-50 disabled:cursor-not-allowed';
    var SPINNER_SVG = "\n<svg class=\"animate-spin h-4 w-4 text-current\" viewBox=\"0 0 24 24\" aria-hidden=\"true\">\n<circle class=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" stroke-width=\"4\" fill=\"none\"></circle>\n<path class=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z\"></path>\n</svg>".trim();
    // Initial element
    var el = cfg.href ? document.createElement('a') : document.createElement('button');
    el.id = cfg.id;
    var state = {
        variant: cfg.variant,
        size: cfg.size,
        rounded: cfg.rounded,
        block: cfg.block,
        disabled: cfg.disabled,
        loading: cfg.loading,
        href: cfg.href,
        label: cfg.label,
        leadingIconSvg: cfg.leadingIconSvg,
        trailingIconSvg: cfg.trailingIconSvg,
    };
    var leading = document.createElement('span');
    leading.className = 'inline-flex items-center justify-center';
    var label = document.createElement('span');
    label.className = 'inline-block';
    var trailing = document.createElement('span');
    trailing.className = 'inline-flex items-center justify-center';
    label.textContent = state.label;
    function isAnchor(node) {
        return node.tagName === 'A';
    }
    function composeClassName() {
        var _a, _b, _c;
        var v = (_a = variantClasses[state.variant]) !== null && _a !== void 0 ? _a : variantClasses.primary;
        var s = (_b = sizeClasses[state.size]) !== null && _b !== void 0 ? _b : sizeClasses.md;
        var r = (_c = roundedClasses[state.rounded]) !== null && _c !== void 0 ? _c : roundedClasses.md;
        var w = state.block ? 'w-full justify-center' : '';
        return [BASE, v, s, r, w].join(' ').trim();
    }
    function applyAriaAndDisabled() {
        if (isAnchor(el)) {
            if (state.disabled || state.loading) {
                el.setAttribute('aria-disabled', 'true');
                el.classList.add('pointer-events-none');
            }
            else {
                el.removeAttribute('aria-disabled');
                el.classList.remove('pointer-events-none');
            }
        }
        else {
            el.disabled = !!(state.disabled || state.loading);
        }
    }
    function refreshClasses() {
        el.className = composeClassName();
        applyAriaAndDisabled();
    }
    function renderIcons() {
        // Clear containers
        leading.innerHTML = '';
        trailing.innerHTML = '';
        if (state.loading) {
            leading.innerHTML = SPINNER_SVG;
        }
        else if (state.leadingIconSvg) {
            leading.innerHTML = state.leadingIconSvg;
        }
        if (state.trailingIconSvg) {
            trailing.innerHTML = state.trailingIconSvg;
        }
        // Rebuild children
        el.innerHTML = '';
        if (leading.innerHTML.trim().length)
            el.appendChild(leading);
        el.appendChild(label);
        if (trailing.innerHTML.trim().length)
            el.appendChild(trailing);
    }
    function onClick(e) {
        if (state.disabled || state.loading) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (typeof cfg.onClick === 'function') {
            cfg.onClick(e);
        }
    }
    // Initialize attributes
    if (cfg.ariaLabel)
        el.setAttribute('aria-label', cfg.ariaLabel);
    if (isAnchor(el)) {
        if (cfg.href)
            el.setAttribute('href', cfg.href);
        if (cfg.target)
            el.setAttribute('target', cfg.target);
        if (cfg.rel)
            el.setAttribute('rel', cfg.rel);
    }
    else {
        el.setAttribute('type', cfg.type);
        el.disabled = !!cfg.disabled;
    }
    // Initial content
    if (cfg.loading) {
        leading.innerHTML = SPINNER_SVG;
    }
    else if (cfg.leadingIconSvg) {
        leading.innerHTML = cfg.leadingIconSvg;
    }
    if (cfg.trailingIconSvg) {
        trailing.innerHTML = cfg.trailingIconSvg;
    }
    if (leading.innerHTML.trim().length)
        el.appendChild(leading);
    el.appendChild(label);
    if (trailing.innerHTML.trim().length)
        el.appendChild(trailing);
    el.className = composeClassName();
    applyAriaAndDisabled();
    el.addEventListener('click', onClick);
    // Optional keyboard handling for anchor without href (role=button style)
    if (isAnchor(el) && !cfg.href) {
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                el.click();
            }
        });
    }
    // Mount
    root.innerHTML = '';
    root.appendChild(el);
    function copyAttributes(from, to) {
        for (var _i = 0, _a = Array.from(from.attributes); _i < _a.length; _i++) {
            var _b = _a[_i], name_1 = _b.name, value = _b.value;
            if (name_1 === 'type' || name_1 === 'disabled')
                continue; // not applicable to <a>
            to.setAttribute(name_1, value);
        }
    }
    var api = {
        root: root,
        el: el,
        focus: function () { return el.focus(); },
        click: function () { return el.click(); },
        setLabel: function (next) {
            state.label = String(next !== null && next !== void 0 ? next : '');
            label.textContent = state.label;
        },
        setVariant: function (variant) {
            if (!variantClasses[variant])
                return;
            state.variant = variant;
            refreshClasses();
        },
        setSize: function (size) {
            if (!sizeClasses[size])
                return;
            state.size = size;
            refreshClasses();
        },
        setRounded: function (rounded) {
            if (!roundedClasses[rounded])
                return;
            state.rounded = rounded;
            refreshClasses();
        },
        setBlock: function (block) {
            state.block = !!block;
            refreshClasses();
        },
        setDisabled: function (disabled) {
            state.disabled = !!disabled;
            applyAriaAndDisabled();
            refreshClasses();
        },
        setLoading: function (loading) {
            state.loading = !!loading;
            applyAriaAndDisabled();
            renderIcons();
            refreshClasses();
        },
        setHref: function (href, target, rel) {
            state.href = typeof href === 'string' ? href : null;
            if (!isAnchor(el)) {
                // Rebuild as anchor only if href is provided
                if (state.href) {
                    var parent_1 = el.parentElement;
                    var newNode = document.createElement('a');
                    copyAttributes(el, newNode);
                    newNode.id = el.id;
                    newNode.className = el.className;
                    // move children
                    while (el.firstChild) {
                        newNode.appendChild(el.firstChild);
                    }
                    newNode.addEventListener('click', onClick);
                    newNode.setAttribute('href', state.href);
                    if (target)
                        newNode.setAttribute('target', target);
                    if (rel)
                        newNode.setAttribute('rel', rel);
                    el.removeEventListener('click', onClick);
                    if (parent_1) {
                        parent_1.replaceChild(newNode, el);
                    }
                    el = newNode;
                    api.el = el;
                }
                else {
                    // keep as button when href is null/undefined
                    // just refresh disabled state and classes
                }
            }
            else {
                // Same anchor element; add/remove href + target/rel
                if (state.href) {
                    el.setAttribute('href', state.href);
                }
                else {
                    el.removeAttribute('href');
                }
                if (target)
                    el.setAttribute('target', target);
                if (rel)
                    el.setAttribute('rel', rel);
            }
            refreshClasses();
        },
        setIcons: function (_a) {
            var leadSvg = _a.leading, trailSvg = _a.trailing;
            state.leadingIconSvg = leadSvg || '';
            state.trailingIconSvg = trailSvg || '';
            renderIcons();
        },
        on: function (eventName, handler) {
            if (typeof handler !== 'function')
                return function () { };
            el.addEventListener(eventName, handler);
            return function () { return el.removeEventListener(eventName, handler); };
        },
        destroy: function () {
            el.removeEventListener('click', onClick);
            root.innerHTML = '';
        },
        getState: function () { return (__assign({}, state)); },
    };
    return api;
}
