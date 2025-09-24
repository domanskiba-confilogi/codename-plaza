function mountTextArea(selector, options = {}) {
	const root = document.querySelector(selector);
	if (!root) throw new Error(`mountTextField: no element found for selector "${selector}"`);

	const id = `textfield-${Math.floor(Math.random() * 1e8)}`;
	const errorId = `${id}-error`;

	const cfg = {
		label: options.label || "Label",
		placeholder: options.placeholder || "",
		disabled: !!options.disabled,
		value: options.value != null ? String(options.value) : "",
		onInput: typeof options.onInput === "function" ? options.onInput : null,
		// nowość: czy automatycznie usuwać błąd przy zdarzeniu "input"
		clearErrorOnInput: !!options.clearErrorOnInput,
	};

	root.innerHTML = `
<div class="flex flex-col gap-2 h-full">
	<label class="text-sm font-medium" for="${id}">${escapeHtml(cfg.label)}</label>
	<textarea
		id="${id}"
		class="w-full rounded-md bg-neutral-950/60 text-neutral-100 placeholder-neutral-500 px-3.5 py-2.5 transition hover:bg-neutral-900/60 focus:outline-none focus:bg-neutral-950/80 ring-1 ring-inset ring-neutral-800 focus:ring-2 focus:ring-blue-400/60 disabled:bg-neutral-800 disabled:text-neutral-400 disabled:cursor-not-allowed h-full"
		placeholder="${escapeHtml(cfg.placeholder)}"
		autocomplete="off"
		${cfg.disabled ? "disabled" : ""}
		value="${escapeHtml(cfg.value)}"
	>${escapeHtml(cfg.value)}</textarea>
	<p id="${errorId}" class="hidden text-sm text-red-400" role="alert" aria-live="polite"></p>
</div>
`;

	const input = root.querySelector("textarea");
	const errorEl = root.querySelector(`#${CSS.escape(errorId)}`);

	const state = {
		disabled: cfg.disabled,
		value: cfg.value,
		error: null,
	};

	// style pomocnicze dla błędów
	const normalRingClasses = ["ring-neutral-800", "focus:ring-blue-400/60"];
	const errorRingClasses = ["ring-red-500/70", "focus:ring-red-500/70"];

	function applyErrorStyles(hasError) {
		if (hasError) {
			input.classList.remove(...normalRingClasses);
			input.classList.add(...errorRingClasses);
			input.setAttribute("aria-invalid", "true");
			input.setAttribute("aria-describedby", errorId);
		} else {
			input.classList.remove(...errorRingClasses);
			input.classList.add(...normalRingClasses);
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
			} catch (e) {
				console.error("mountTextField onInput callback failed:", e);
			}
		}
	}

	function onInput(e) {
		state.value = e.target.value;
		// auto-czyszczenie błędu przy "input" (jeśli włączone)
		if (cfg.clearErrorOnInput && state.error != null) {
			clearError();
		}
		emitInput(state.value);
	}

	input.addEventListener("input", onInput);

	// API błędów
	function setError(message) {
		const msg = message == null ? "" : String(message);
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
		getValue: () => state.value,
		setValue: (next, { silent = false } = {}) => {
			const val = next == null ? "" : String(next);
			state.value = val;
			input.value = val;
			if (!silent) emitInput(val);
		},

		// enabled / disabled
		isDisabled: () => state.disabled,
		disable: () => {
			state.disabled = true;
			input.disabled = true;
		},
		enable: () => {
			state.disabled = false;
			input.disabled = false;
		},

		// focus/blur
		focus: () => input.focus(),
		blur: () => input.blur(),

		// czyszczenie
		clear: ({ silent = false } = {}) => {
			input.value = "";
			state.value = "";
			if (!silent) emitInput("");
		},

		// podmiana etykiety/placeholdera
		setLabel: (text) => {
			const label = root.querySelector("label");
			if (label) label.textContent = text != null ? String(text) : "";
		},
		setPlaceholder: (text) => {
			input.setAttribute("placeholder", text != null ? String(text) : "");
		},

		// podmiana callbacku
		setOnInput: (fn) => {
			cfg.onInput = typeof fn === "function" ? fn : null;
		},

		// BŁĘDY: ustawianie/zerowanie
		setError,           // ustawia/aktualizuje treść błędu (pusty/null usuwa błąd)
		clearError,         // usuwa błąd
		hasError: () => state.error != null,

		// elementy DOM
		inputEl: input,
		errorEl,
		root,

		// sprzątanie
		destroy: () => {
			input.removeEventListener("input", onInput);
			root.innerHTML = "";
		},
	};
}
