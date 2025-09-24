import { escapeHtml, mustQuerySelector } from "./helpers.js";
export function mountCheckbox(selector, options) {
    var _a;
    if (options === void 0) { options = {}; }
    var root = document.querySelector(selector);
    if (!root)
        throw new Error("mountCheckbox: no element found for selector \"".concat(selector, "\""));
    var id = "chk-".concat(Math.floor(Math.random() * 1e8));
    var errorId = "".concat(id, "-error");
    var topLabelId = "".concat(id, "-toplabel");
    var stateLabelId = "".concat(id, "-statelabel");
    var cfg = {
        label: options.label !== undefined ? String(options.label) : "",
        description: (_a = options.description) !== null && _a !== void 0 ? _a : '',
        checked: !!options.checked,
        disabled: !!options.disabled,
        trueLabel: options.trueLabel != null ? String(options.trueLabel) : 'Yes',
        falseLabel: options.falseLabel != null ? String(options.falseLabel) : 'No',
        onChange: typeof options.onChange === 'function' ? options.onChange : null,
        clearErrorOnChange: !!options.clearErrorOnChange,
    };
    root.innerHTML = "\n<div class=\"flex flex-col gap-2 group\">\n<span id=\"".concat(topLabelId, "\" class=\"text-sm font-medium\">").concat(cfg.label != null ? escapeHtml(cfg.label) : '', "</span>\n<label for=\"").concat(id, "\" class=\"inline-flex items-center cursor-pointer select-none \">\n<input\nid=\"").concat(id, "\"\ntype=\"checkbox\"\nclass=\"sr-only peer focus-visible:outline-none\"\n").concat(cfg.checked ? 'checked' : '', "\n").concat(cfg.disabled ? 'disabled' : '', "\nrole=\"switch\"\naria-labelledby=\"").concat(topLabelId, "\"\naria-describedby=\"").concat(errorId, "\"\n/>\n<span class=\"w-11 h-6 bg-neutral-800 rounded-full ring-1 ring-neutral-700 transition-colors relative\npeer-checked:bg-blue-500/20\npeer-focus:ring-2 peer-focus:ring-blue-400/60\">\n<span class=\"absolute top-0.5 left-0.5 w-5 h-5 bg-neutral-300 rounded-full transition-transform\ngroup-has-[:checked]:translate-x-5\"></span>\n</span>\n<span id=\"").concat(stateLabelId, "\" class=\"ml-3 text-sm text-neutral-300\">").concat(cfg.checked ? escapeHtml(cfg.trueLabel) : escapeHtml(cfg.falseLabel), "</span>\n</label>\n").concat(cfg.description ? "<p class=\"text-xs text-neutral-500\">".concat(escapeHtml(cfg.description), "</p>") : '', "\n<p id=\"").concat(errorId, "\" class=\"hidden text-sm text-red-400\" role=\"alert\" aria-live=\"polite\"></p>\n</div>").trim();
    var input = mustQuerySelector(root, "#".concat(CSS.escape(id)));
    if (!input)
        throw new Error('mountCheckbox: failed to create input element');
    var track = mustQuerySelector(root, 'label > span');
    var stateLabel = mustQuerySelector(root, "#".concat(CSS.escape(stateLabelId)));
    var errorEl = mustQuerySelector(root, "#".concat(CSS.escape(errorId)));
    var state = {
        checked: cfg.checked,
        disabled: cfg.disabled,
        error: null,
        trueLabel: cfg.trueLabel,
        falseLabel: cfg.falseLabel,
    };
    var normalRingClasses = ['ring-neutral-700', 'peer-focus:ring-blue-400/60'];
    var errorRingClasses = ['ring-red-500/70', 'peer-focus:ring-red-500/70'];
    function applyErrorStyles(hasError) {
        var _a, _b, _c;
        if (!track)
            return;
        if (hasError) {
            (_a = track.classList).remove.apply(_a, normalRingClasses);
            (_b = track.classList).add.apply(_b, errorRingClasses);
            input.setAttribute('aria-invalid', 'true');
        }
        else {
            (_c = track.classList).remove.apply(_c, errorRingClasses);
            normalRingClasses.forEach(function (c) { return track.classList.add(c); });
            input.removeAttribute('aria-invalid');
        }
    }
    function emitChange(checked) {
        if (cfg.onChange) {
            try {
                cfg.onChange({ checked: checked });
            }
            catch (e) {
                console.error('mountCheckbox onChange callback failed:', e);
            }
        }
    }
    function syncUi() {
        if (stateLabel) {
            stateLabel.textContent = state.checked ? state.trueLabel : state.falseLabel;
        }
        input.checked = state.checked;
        input.setAttribute('aria-checked', String(state.checked));
    }
    function onChange() {
        state.checked = input.checked;
        syncUi();
        if (cfg.clearErrorOnChange && state.error != null) {
            clearError();
        }
        emitChange(state.checked);
    }
    input.addEventListener('change', onChange);
    function setError(message) {
        var msg = message == null ? '' : String(message);
        if (msg.trim() === '') {
            clearError();
            return;
        }
        state.error = msg;
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
        }
        applyErrorStyles(true);
    }
    function clearError() {
        state.error = null;
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.add('hidden');
        }
        applyErrorStyles(false);
    }
    function doSetChecked(next, opts) {
        var val = !!next;
        state.checked = val;
        syncUi();
        if (!(opts === null || opts === void 0 ? void 0 : opts.silent))
            emitChange(val);
    }
    // initial state
    applyErrorStyles(false);
    syncUi();
    var api = {
        // values
        getChecked: function () { return state.checked; },
        setChecked: function (next, opts) { return doSetChecked(next, opts); },
        getValue: function () { return state.checked; },
        setValue: function (next, opts) { return doSetChecked(next, opts); },
        toggle: function (opts) {
            state.checked = !state.checked;
            syncUi();
            if (!(opts === null || opts === void 0 ? void 0 : opts.silent))
                emitChange(state.checked);
        },
        // labels
        setLabel: function (text) {
            var top = root.querySelector("#".concat(CSS.escape(topLabelId)));
            if (top)
                top.textContent = text != null ? String(text) : '';
        },
        setStateLabels: function (_a) {
            var _b = _a === void 0 ? {} : _a, trueLabel = _b.trueLabel, falseLabel = _b.falseLabel;
            if (trueLabel != null)
                state.trueLabel = String(trueLabel);
            if (falseLabel != null)
                state.falseLabel = String(falseLabel);
            syncUi();
        },
        setDescription: function (text) {
            var desc = root.querySelector('.text-xs.text-neutral-500');
            if (!desc && text != null && String(text) !== '') {
                desc = document.createElement('p');
                desc.className = 'text-xs text-neutral-500';
                var container = root.querySelector('div');
                if (container)
                    container.appendChild(desc);
            }
            if (desc)
                desc.textContent = text != null ? String(text) : '';
        },
        // enabled / disabled
        isDisabled: function () { return state.disabled; },
        disable: function () {
            state.disabled = true;
            input.disabled = true;
            input.setAttribute('aria-disabled', 'true');
        },
        enable: function () {
            state.disabled = false;
            input.disabled = false;
            input.removeAttribute('aria-disabled');
        },
        // callback
        setOnChange: function (fn) {
            cfg.onChange = typeof fn === 'function' ? fn : null;
        },
        // errors
        setError: setError,
        clearError: clearError,
        hasError: function () { return state.error != null; },
        // DOM
        inputEl: input,
        trackEl: track,
        stateLabelEl: stateLabel,
        errorEl: errorEl,
        root: root,
        // cleanup
        destroy: function () {
            input.removeEventListener('change', onChange);
            root.innerHTML = '';
        },
    };
    return api;
}
