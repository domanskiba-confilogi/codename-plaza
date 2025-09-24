import { escapeHtml } from "./helpers.js";
export function mountFileField(selector, options) {
    var _a, _b, _c, _d;
    if (options === void 0) { options = {}; }
    var rootEl = document.querySelector(selector);
    if (!rootEl) {
        throw new Error("mountFileField: no element found for selector \"".concat(selector, "\""));
    }
    if (!(rootEl instanceof HTMLElement)) {
        throw new Error("mountFileField: element for selector \"".concat(selector, "\" is not an HTMLElement"));
    }
    var root = rootEl;
    var id = "file-".concat(Math.floor(Math.random() * 1e8));
    var errorId = "".concat(id, "-error");
    var hintId = "".concat(id, "-hint");
    var cfg = {
        label: (_a = options.label) !== null && _a !== void 0 ? _a : "Attachments",
        hint: (_b = options.hint) !== null && _b !== void 0 ? _b : "",
        multiple: !!options.multiple,
        accept: (_c = options.accept) !== null && _c !== void 0 ? _c : "",
        disabled: !!options.disabled,
        maxFileSizeMB: Number.isFinite(options.maxFileSizeMB) && options.maxFileSizeMB > 0
            ? Number(options.maxFileSizeMB)
            : null,
        maxFiles: Number.isFinite(options.maxFiles) ? Number(options.maxFiles) : null,
        onChange: typeof options.onChange === "function" ? options.onChange : null,
        clearErrorOnChange: options.clearErrorOnChange !== false,
        classes: ((_d = options.classes) !== null && _d !== void 0 ? _d : "").trim(),
    };
    root.innerHTML = "\n<div class=\"flex flex-col\">\n\t<label class=\"text-sm font-medium\" for=\"".concat(id, "\">").concat(escapeHtml(cfg.label), "</label>\n\t<input\n\t\tid=\"").concat(id, "\"\n\t\ttype=\"file\"\n\t\tclass=\"mt-2 block w-full text-sm\n\t\tfile:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-neutral-200 file:hover:bg-neutral-700/80 file:transition\n\t\trounded-md bg-neutral-950/60 px-3.5 py-2.5 ring-1 ring-inset ring-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-400/60 cursor-pointer\n\t\t").concat(escapeHtml(cfg.classes), "\"\n\t\t").concat(cfg.multiple ? "multiple" : "", "\n\t\t").concat(cfg.accept ? "accept=\"".concat(escapeHtml(cfg.accept), "\"") : "", "\n\t\t").concat(cfg.disabled ? "disabled" : "", "\n\t/>\n\t").concat(cfg.hint ? "<p id=\"".concat(hintId, "\" class=\"mt-2 text-xs text-neutral-500\">").concat(escapeHtml(cfg.hint), "</p>") : "", "\n\t<p id=\"").concat(errorId, "\" class=\"hidden mt-2 text-sm text-red-400\" role=\"alert\" aria-live=\"polite\"></p>\n</div>\n");
    var input = root.querySelector("#".concat(CSS.escape(id)));
    var errorEl = root.querySelector("#".concat(CSS.escape(errorId)));
    var state = {
        disabled: cfg.disabled,
        files: [],
        error: null,
    };
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
    function emitChange(files, meta) {
        if (meta === void 0) { meta = { added: [], removed: [] }; }
        if (cfg.onChange) {
            try {
                cfg.onChange(files.slice(), meta);
            }
            catch (e) {
                console.error("mountFileField onChange callback failed:", e);
            }
        }
    }
    function onChange(e) {
        var _a;
        var target = e.currentTarget;
        var prev = state.files;
        var next = Array.from((_a = target.files) !== null && _a !== void 0 ? _a : []);
        state.files = next;
        if (cfg.clearErrorOnChange && state.error != null) {
            clearError();
        }
        // derive basic added/removed info (best-effort)
        var key = function (f) { return "".concat(f.name, ":").concat(f.size, ":").concat(f.type); };
        var prevNames = new Set(prev.map(key));
        var nextNames = new Set(next.map(key));
        var added = next.filter(function (f) { return !prevNames.has(key(f)); });
        var removed = prev.filter(function (f) { return !nextNames.has(key(f)); });
        emitChange(state.files, { added: added, removed: removed });
    }
    input.addEventListener("change", onChange);
    var api = {
        // files
        getFiles: function () { return state.files.slice(); },
        // Clears selection
        clear: function () {
            input.value = "";
            state.files = [];
        },
        // constraints helpers
        validate: function () {
            var _a;
            clearError();
            var files = state.files;
            if (cfg.maxFiles != null && files.length > cfg.maxFiles) {
                var msg = "You can select up to ".concat(cfg.maxFiles, " file").concat(cfg.maxFiles === 1 ? "" : "s", ".");
                setError(msg);
                return { valid: false, error: msg, oversizeFile: null };
            }
            if (cfg.maxFileSizeMB != null && cfg.maxFileSizeMB > 0) {
                var limit_1 = cfg.maxFileSizeMB * 1024 * 1024;
                var oversize = (_a = files.find(function (f) { return f.size > limit_1; })) !== null && _a !== void 0 ? _a : null;
                if (oversize) {
                    var msg = "File \"".concat(oversize.name, "\" exceeds ").concat(cfg.maxFileSizeMB, "MB limit.");
                    setError(msg);
                    return { valid: false, error: msg, oversizeFile: oversize };
                }
            }
            return { valid: true, error: null, oversizeFile: null };
        },
        // error API
        setError: setError,
        clearError: clearError,
        hasError: function () { return state.error != null; },
        // state
        disable: function () {
            state.disabled = true;
            input.disabled = true;
        },
        enable: function () {
            state.disabled = false;
            input.disabled = false;
        },
        isDisabled: function () { return state.disabled; },
        // attributes
        setLabel: function (text) {
            var label = root.querySelector("label");
            if (label)
                label.textContent = text != null ? String(text) : "";
        },
        setHint: function (text) {
            var hint = root.querySelector("#".concat(CSS.escape(hintId)));
            var hasText = text != null && String(text).trim() !== "";
            if (!hint && hasText) {
                // create on demand
                hint = document.createElement("p");
                hint.id = hintId;
                hint.className = "mt-2 text-xs text-neutral-500";
                input.insertAdjacentElement("afterend", hint);
            }
            if (hint) {
                hint.textContent = hasText ? String(text) : "";
                hint.classList.toggle("hidden", !hasText);
            }
        },
        setAccept: function (accept) {
            var val = accept != null ? String(accept) : "";
            cfg.accept = val;
            if (val)
                input.setAttribute("accept", val);
            else
                input.removeAttribute("accept");
        },
        setMultiple: function (multiple) {
            var m = !!multiple;
            cfg.multiple = m;
            if (m)
                input.setAttribute("multiple", "");
            else
                input.removeAttribute("multiple");
        },
        // focus
        focus: function () { return input.focus(); },
        blur: function () { return input.blur(); },
        // DOM
        inputEl: input,
        errorEl: errorEl,
        root: root,
        // cleanup
        destroy: function () {
            input.removeEventListener("change", onChange);
            root.innerHTML = "";
        },
    };
    return api;
}
