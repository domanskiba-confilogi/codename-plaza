function mountFileField(selector, options = {}) {
	const root = document.querySelector(selector);
	if (!root) throw new Error(`mountFileField: no element found for selector "${selector}"`);

	const esc = typeof window.escapeHtml === "function"
		? window.escapeHtml
		: (str) => String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));

	const id = `file-${Math.floor(Math.random() * 1e8)}`;
	const errorId = `${id}-error`;
	const hintId = `${id}-hint`;

	const cfg = {
		label: options.label || "Attachments",
		hint: options.hint || "",
		multiple: !!options.multiple,
		accept: options.accept || "",
		disabled: !!options.disabled,
		// Optional constraints helpers (used by api.validate())
		maxFileSizeMB: Number.isFinite(options.maxFileSizeMB) ? Number(options.maxFileSizeMB) : null, // per file
		maxFiles: Number.isFinite(options.maxFiles) ? Number(options.maxFiles) : null,
		onChange: typeof options.onChange === "function" ? options.onChange : null,
		clearErrorOnChange: options.clearErrorOnChange !== false, // default true
		classes: (options.classes || "").trim(), // optional extra classes for input
	};

	root.innerHTML = `
<div class="flex flex-col">
	<label class="text-sm font-medium" for="${id}">${esc(cfg.label)}</label>
	<input
		id="${id}"
		type="file"
		class="mt-2 block w-full text-sm
		file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-neutral-200 file:hover:bg-neutral-700/80 file:transition
		rounded-md bg-neutral-950/60 px-3.5 py-2.5 ring-1 ring-inset ring-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-400/60 cursor-pointer
		${esc(cfg.classes)}"
		${cfg.multiple ? "multiple" : ""}
		${cfg.accept ? `accept="${esc(cfg.accept)}"` : ""}
		${cfg.disabled ? "disabled" : ""}
	/>
	${cfg.hint ? `<p id="${hintId}" class="mt-2 text-xs text-neutral-500">${esc(cfg.hint)}</p>` : ""}
	<p id="${errorId}" class="hidden mt-2 text-sm text-red-400" role="alert" aria-live="polite"></p>
</div>
`;

	const input = root.querySelector(`#${CSS.escape(id)}`);
	const errorEl = root.querySelector(`#${CSS.escape(errorId)}`);

	const state = {
		disabled: cfg.disabled,
		files: [],
		error: null,
	};

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
			if (input.getAttribute("aria-describedby") === errorId) {
				input.removeAttribute("aria-describedby");
			}
		}
	}

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

	function emitChange(files, meta = {}) {
		if (cfg.onChange) {
			try {
				cfg.onChange(files.slice(), meta);
			} catch (e) {
				console.error("mountFileField onChange callback failed:", e);
			}
		}
	}

	function onChange(e) {
		const prev = state.files;
		const next = Array.from(e.target.files || []);
		state.files = next;
		if (cfg.clearErrorOnChange && state.error != null) {
			clearError();
		}

		// derive basic added/removed info (best-effort)
		const prevNames = new Set(prev.map(f => `${f.name}:${f.size}:${f.type}`));
		const nextNames = new Set(next.map(f => `${f.name}:${f.size}:${f.type}`));
		const added = next.filter(f => !prevNames.has(`${f.name}:${f.size}:${f.type}`));
		const removed = prev.filter(f => !nextNames.has(`${f.name}:${f.size}:${f.type}`));

		emitChange(state.files, { added, removed });
	}

	input.addEventListener("change", onChange);

	// Public API
	return {
		// files
		getFiles: () => state.files.slice(),
		// Clears selection (note: for security reasons, you cannot programmatically set files)
		clear: () => {
			input.value = "";
			state.files = [];
		},

		// constraints helpers (optional)
		validate: () => {
			clearError();
			const files = state.files;
			if (cfg.maxFiles != null && files.length > cfg.maxFiles) {
				const msg = `You can select up to ${cfg.maxFiles} file${cfg.maxFiles === 1 ? "" : "s"}.`;
				setError(msg);
				return { valid: false, error: msg, oversizeFile: null };
			}
			if (cfg.maxFileSizeMB != null && cfg.maxFileSizeMB > 0) {
				const limit = cfg.maxFileSizeMB * 1024 * 1024;
				const oversize = files.find(f => f.size > limit);
				if (oversize) {
					const msg = `File "${oversize.name}" exceeds ${cfg.maxFileSizeMB}MB limit.`;
					setError(msg);
					return { valid: false, error: msg, oversizeFile: oversize };
				}
			}
			return { valid: true, error: null, oversizeFile: null };
		},

		// error API
		setError,
		clearError,
		hasError: () => state.error != null,

		// state
		disable: () => { state.disabled = true; input.disabled = true; },
		enable: () => { state.disabled = false; input.disabled = false; },
		isDisabled: () => state.disabled,

		// attributes
		setLabel: (text) => {
			const label = root.querySelector("label");
			if (label) label.textContent = text != null ? String(text) : "";
		},
		setHint: (text) => {
			let hint = root.querySelector(`#${CSS.escape(hintId)}`);
			const hasText = text != null && String(text).trim() !== "";
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
		setAccept: (accept) => {
			const val = accept != null ? String(accept) : "";
			cfg.accept = val;
			if (val) input.setAttribute("accept", val); else input.removeAttribute("accept");
		},
		setMultiple: (multiple) => {
			const m = !!multiple;
			cfg.multiple = m;
			if (m) input.setAttribute("multiple", ""); else input.removeAttribute("multiple");
		},

		// focus
		focus: () => input.focus(),
		blur: () => input.blur(),

		// DOM
		inputEl: input,
		errorEl,
		root,

		// cleanup
		destroy: () => {
			input.removeEventListener("change", onChange);
			root.innerHTML = "";
		},
	};
}
