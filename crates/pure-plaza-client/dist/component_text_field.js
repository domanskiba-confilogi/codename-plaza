import { escapeHtml, mustQuerySelector } from "./helpers.js";
function normalizeType(input) {
    var t = String(input !== null && input !== void 0 ? input : "text").toLowerCase();
    return t === "text" || t === "email" || t === "password" ? t : "text";
}
export function mountTextField(selector, options) {
    var _a, _b, _c;
    var root = document.querySelector(selector);
    if (!root) {
        throw new Error("mountTextField: no element found for selector \"".concat(selector, "\""));
    }
    var id = "input-".concat(Math.floor(Math.random() * 1e8));
    var errorId = "".concat(id, "-error");
    var cfg = {
        type: normalizeType(options === null || options === void 0 ? void 0 : options.type),
        label: (_a = options === null || options === void 0 ? void 0 : options.label) !== null && _a !== void 0 ? _a : "Label",
        placeholder: (_b = options === null || options === void 0 ? void 0 : options.placeholder) !== null && _b !== void 0 ? _b : "",
        disabled: !!(options === null || options === void 0 ? void 0 : options.disabled),
        value: (options === null || options === void 0 ? void 0 : options.value) != null ? String(options.value) : "",
        onInput: typeof (options === null || options === void 0 ? void 0 : options.onInput) === "function" ? options.onInput : null,
        // nowość: czy automatycznie usuwać błąd przy zdarzeniu "input"
        clearErrorOnInput: !!(options === null || options === void 0 ? void 0 : options.clearErrorOnInput),
    };
    root.innerHTML = "\n<div class=\"flex flex-col gap-2\">\n<label class=\"text-sm font-medium\" for=\"".concat(id, "\">").concat(escapeHtml(String(cfg.label)), "</label>\n<input\nid=\"").concat(id, "\"\ntype=\"").concat(cfg.type, "\"\nclass=\"w-full rounded-md bg-neutral-950/60 text-neutral-100 placeholder-neutral-500 px-3.5 py-2.5 transition hover:bg-neutral-900/60 focus:outline-none focus:bg-neutral-950/80 ring-1 ring-inset ring-neutral-800 focus:ring-2 focus:ring-blue-400/60 disabled:bg-neutral-800 disabled:text-neutral-400 disabled:cursor-not-allowed\"\nplaceholder=\"").concat(escapeHtml(String(cfg.placeholder)), "\"\nautocomplete=\"off\"\n").concat(cfg.disabled ? "disabled" : "", "\nvalue=\"").concat(escapeHtml(String(cfg.value)), "\"\n/>\n<p id=\"").concat(errorId, "\" class=\"hidden text-sm text-red-400\" role=\"alert\" aria-live=\"polite\"></p>\n</div>\n").trim();
    var input = mustQuerySelector(root, "input");
    var errorSelector = "#" + (((_c = globalThis.CSS) === null || _c === void 0 ? void 0 : _c.escape) ? globalThis.CSS.escape(errorId) : errorId);
    var errorEl = root.querySelector(errorSelector);
    var state = {
        type: cfg.type,
        disabled: cfg.disabled,
        value: cfg.value,
        error: null,
    };
    // style pomocnicze dla błędów
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
            // tylko usuwamy aria-describedby, jeśli pokazujemy je wyłącznie dla błędu
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
                console.error("mountTextField onInput callback failed:", e);
            }
        }
    }
    function onInput(ev) {
        var target = ev.target;
        if (!target)
            return;
        state.value = target.value;
        // auto-czyszczenie błędu przy "input" (jeśli włączone)
        if (cfg.clearErrorOnInput && state.error != null) {
            clearError();
        }
        emitInput(state.value);
    }
    input.addEventListener("input", onInput);
    // API błędów
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
    // Publiczne API
    return {
        // odczyt/zapis wartości
        getValue: function () { return state.value; },
        setValue: function (next, _a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.silent, silent = _c === void 0 ? false : _c;
            var val = next == null ? "" : String(next);
            state.value = val;
            input.value = val;
            if (!silent)
                emitInput(val);
        },
        // typ: "text" | "email" | "password"
        getType: function () { return state.type; },
        setType: function (nextType) {
            var t = normalizeType(nextType);
            state.type = t;
            input.setAttribute("type", t);
        },
        // enabled / disabled
        isDisabled: function () { return state.disabled; },
        disable: function () {
            state.disabled = true;
            input.disabled = true;
        },
        enable: function () {
            state.disabled = false;
            input.disabled = false;
        },
        // focus/blur
        focus: function () { return input.focus(); },
        blur: function () { return input.blur(); },
        // czyszczenie
        clear: function (_a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.silent, silent = _c === void 0 ? false : _c;
            input.value = "";
            state.value = "";
            if (!silent)
                emitInput("");
        },
        // podmiana etykiety/placeholdera
        setLabel: function (text) {
            var label = root.querySelector("label");
            if (label)
                label.textContent = text != null ? String(text) : "";
        },
        setPlaceholder: function (text) {
            input.setAttribute("placeholder", text != null ? String(text) : "");
        },
        // podmiana callbacku
        setOnInput: function (fn) {
            cfg.onInput = typeof fn === "function" ? fn : null;
        },
        // BŁĘDY: ustawianie/zerowanie
        setError: setError, // ustawia/aktualizuje treść błędu (pusty/null usuwa błąd)
        clearError: clearError, // usuwa błąd
        hasError: function () { return state.error != null; },
        // elementy DOM
        inputEl: input,
        errorEl: errorEl,
        root: root,
        // sprzątanie
        destroy: function () {
            input.removeEventListener("input", onInput);
            root.innerHTML = "";
        },
    };
}
