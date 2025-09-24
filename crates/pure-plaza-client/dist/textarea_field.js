import { escapeHtml, mustQuerySelector } from "./helpers.js";
var cssEscape = typeof CSS !== "undefined" && typeof CSS.escape === "function"
    ? CSS.escape.bind(CSS)
    : function (s) { return s.replace(/[^a-zA-Z0-9_-]/g, function (ch) { return "\\".concat(ch); }); };
export function mountTextArea(selector, options) {
    var _a, _b;
    if (options === void 0) { options = {}; }
    var rootEl = document.querySelector(selector);
    if (!rootEl) {
        throw new Error("mountTextArea: no element found for selector \"".concat(selector, "\""));
    }
    var root = rootEl;
    var id = "textfield-".concat(Math.floor(Math.random() * 1e8));
    var errorId = "".concat(id, "-error");
    var cfg = {
        label: (_a = options.label) !== null && _a !== void 0 ? _a : "Label",
        placeholder: (_b = options.placeholder) !== null && _b !== void 0 ? _b : "",
        disabled: !!options.disabled,
        value: options.value != null ? String(options.value) : "",
        onInput: typeof options.onInput === "function" ? options.onInput : null,
        clearErrorOnInput: !!options.clearErrorOnInput,
    };
    // Render
    root.innerHTML = "\n<div class=\"flex flex-col gap-2 h-full\">\n\t<label class=\"text-sm font-medium\" for=\"".concat(id, "\">").concat(escapeHtml(cfg.label), "</label>\n\t<textarea\n\t\tid=\"").concat(id, "\"\n\t\tclass=\"w-full rounded-md bg-neutral-950/60 text-neutral-100 placeholder-neutral-500 px-3.5 py-2.5 transition hover:bg-neutral-900/60 focus:outline-none focus:bg-neutral-950/80 ring-1 ring-inset ring-neutral-800 focus:ring-2 focus:ring-blue-400/60 disabled:bg-neutral-800 disabled:text-neutral-400 disabled:cursor-not-allowed h-full\"\n\t\tplaceholder=\"").concat(escapeHtml(cfg.placeholder), "\"\n\t\tautocomplete=\"off\"\n\t\t").concat(cfg.disabled ? "disabled" : "", "\n\t>").concat(escapeHtml(cfg.value), "</textarea>\n\t<p id=\"").concat(errorId, "\" class=\"hidden text-sm text-red-400\" role=\"alert\" aria-live=\"polite\"></p>\n</div>\n");
    var input = mustQuerySelector(root, "textarea");
    var errorEl = root.querySelector("#".concat(cssEscape(errorId)));
    var state = {
        disabled: cfg.disabled,
        value: cfg.value,
        error: null,
    };
    // Error styles
    var normalRingClasses = ["ring-neutral-800", "focus:ring-blue-400/60"];
    var errorRingClasses = ["ring-red-500/70", "focus:ring-red-500/70"];
    function applyErrorStyles(hasError) {
        var _a, _b, _c, _d;
        if (hasError) {
            (_a = input.classList).remove.apply(_a, normalRingClasses);
            (_b = input.classList).add.apply(_b, errorRingClasses);
            input.setAttribute("aria-invalid", "true");
            input.setAttribute("aria-describedby", errorId);
        }
        else {
            (_c = input.classList).remove.apply(_c, errorRingClasses);
            (_d = input.classList).add.apply(_d, normalRingClasses);
            input.removeAttribute("aria-invalid");
            if (input.getAttribute("aria-describedby") === errorId) {
                input.removeAttribute("aria-describedby");
            }
        }
    }
    function emitInput(value) {
        if (cfg.onInput) {
            try {
                cfg.onInput({ new_value: value });
            }
            catch (e) {
                console.error("mountTextArea onInput callback failed:", e);
            }
        }
    }
    function onInput(e) {
        var el = e.currentTarget;
        var val = el ? el.value : input.value;
        state.value = val;
        if (cfg.clearErrorOnInput && state.error != null) {
            clearError();
        }
        emitInput(state.value);
    }
    input.addEventListener("input", onInput);
    // Errors API
    function setError(message) {
        var msg = message == null ? "" : String(message);
        if (msg.trim() === "") {
            clearError();
            return;
        }
        state.error = msg;
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove("hidden");
        }
        applyErrorStyles(true);
    }
    function clearError() {
        state.error = null;
        if (errorEl) {
            errorEl.textContent = "";
            errorEl.classList.add("hidden");
        }
        applyErrorStyles(false);
    }
    // Public API
    var api = {
        getValue: function () { return state.value; },
        setValue: function (next, _a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.silent, silent = _c === void 0 ? false : _c;
            var val = next == null ? "" : String(next);
            state.value = val;
            input.value = val;
            if (!silent)
                emitInput(val);
        },
        isDisabled: function () { return state.disabled; },
        disable: function () {
            state.disabled = true;
            input.disabled = true;
        },
        enable: function () {
            state.disabled = false;
            input.disabled = false;
        },
        focus: function () { return input.focus(); },
        blur: function () { return input.blur(); },
        clear: function (_a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.silent, silent = _c === void 0 ? false : _c;
            input.value = "";
            state.value = "";
            if (!silent)
                emitInput("");
        },
        setLabel: function (text) {
            var label = root.querySelector("label");
            if (label)
                label.textContent = text != null ? String(text) : "";
        },
        setPlaceholder: function (text) {
            input.setAttribute("placeholder", text != null ? String(text) : "");
        },
        setOnInput: function (fn) {
            cfg.onInput = typeof fn === "function" ? fn : null;
        },
        setError: setError,
        clearError: clearError,
        hasError: function () { return state.error != null; },
        inputEl: input,
        errorEl: errorEl,
        root: root,
        destroy: function () {
            input.removeEventListener("input", onInput);
            root.innerHTML = "";
        },
    };
    return api;
}
