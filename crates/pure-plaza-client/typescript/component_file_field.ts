import { escapeHtml } from "./helpers.js";

export type FileChangeMeta = {
	added: File[];
	removed: File[];
};

export type MountFileFieldOptions = {
	label?: string;
	hint?: string;
	multiple?: boolean;
	accept?: string;
	disabled?: boolean;
	// Ograniczenia (opcjonalne, używane w api.validate())
	maxFileSizeMB?: number; // per file
	maxFiles?: number;
	onChange?: (files: File[], meta: FileChangeMeta) => void;
	clearErrorOnChange?: boolean; // default true
	classes?: string; // dodatkowe klasy dla inputa
};

type ResolvedConfig = {
	label: string;
	hint: string;
	multiple: boolean;
	accept: string;
	disabled: boolean;
	maxFileSizeMB: number | null;
	maxFiles: number | null;
	onChange: ((files: File[], meta: FileChangeMeta) => void) | null;
	clearErrorOnChange: boolean;
	classes: string;
};

type ValidationResult = {
	valid: boolean;
	error: string | null;
	oversizeFile: File | null;
};

type State = {
	disabled: boolean;
	files: File[];
	error: string | null;
};

export interface MountFileFieldAPI {
	// files
	getFiles(): File[];
	// Clears selection (uwaga: z powodów bezpieczeństwa nie można ustawiać files programowo)
	clear(): void;

	// constraints helpers (opcjonalne)
	validate(): ValidationResult;

	// error API
	setError(message?: unknown): void;
	clearError(): void;
	hasError(): boolean;

	// state
	disable(): void;
	enable(): void;
	isDisabled(): boolean;

	// attributes
	setLabel(text?: unknown): void;
	setHint(text?: unknown): void;
	setAccept(accept?: unknown): void;
	setMultiple(multiple?: unknown): void;

	// focus
	focus(): void;
	blur(): void;

	// DOM
	inputEl: HTMLInputElement;
	errorEl: HTMLElement | null;
	root: HTMLElement;

	// cleanup
	destroy(): void;
}

export function mountFileField(
	selector: string,
	options: MountFileFieldOptions = {}
): MountFileFieldAPI {
	const rootEl = document.querySelector(selector);
	if (!rootEl) {
		throw new Error(`mountFileField: no element found for selector "${selector}"`);
	}
	if (!(rootEl instanceof HTMLElement)) {
		throw new Error(`mountFileField: element for selector "${selector}" is not an HTMLElement`);
	}
	const root: HTMLElement = rootEl;

	const id = `file-${Math.floor(Math.random() * 1e8)}`;
	const errorId = `${id}-error`;
	const hintId = `${id}-hint`;

	const cfg: ResolvedConfig = {
		label: options.label ?? "Attachments",
		hint: options.hint ?? "",
		multiple: !!options.multiple,
		accept: options.accept ?? "",
		disabled: !!options.disabled,
		maxFileSizeMB:
		Number.isFinite(options.maxFileSizeMB) && options.maxFileSizeMB! > 0
			? Number(options.maxFileSizeMB)
			: null,
		maxFiles: Number.isFinite(options.maxFiles) ? Number(options.maxFiles) : null,
		onChange: typeof options.onChange === "function" ? options.onChange : null,
		clearErrorOnChange: options.clearErrorOnChange !== false,
		classes: (options.classes ?? "").trim(),
	};

	root.innerHTML = `
<div class="flex flex-col">
	<label class="text-sm font-medium" for="${id}">${escapeHtml(cfg.label)}</label>
	<input
		id="${id}"
		type="file"
		class="mt-2 block w-full text-sm
		file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-neutral-200 file:hover:bg-neutral-700/80 file:transition
		rounded-md bg-neutral-950/60 px-3.5 py-2.5 ring-1 ring-inset ring-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-400/60 cursor-pointer
		${escapeHtml(cfg.classes)}"
		${cfg.multiple ? "multiple" : ""}
		${cfg.accept ? `accept="${escapeHtml(cfg.accept)}"` : ""}
		${cfg.disabled ? "disabled" : ""}
	/>
	${cfg.hint ? `<p id="${hintId}" class="mt-2 text-xs text-neutral-500">${escapeHtml(cfg.hint)}</p>` : ""}
	<p id="${errorId}" class="hidden mt-2 text-sm text-red-400" role="alert" aria-live="polite"></p>
</div>
`;

	const input = root.querySelector<HTMLInputElement>(`#${CSS.escape(id)}`)!;
	const errorEl = root.querySelector<HTMLElement>(`#${CSS.escape(errorId)}`);

	const state: State = {
		disabled: cfg.disabled,
		files: [],
		error: null,
	};

	const normalRingClasses: string[] = ["ring-neutral-800", "focus:ring-blue-400/60"];
	const errorRingClasses: string[] = ["ring-red-500/70", "focus:ring-red-500/70"];

	function applyErrorStyles(hasError: boolean): void {
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

	function setError(message?: unknown): void {
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

	function clearError(): void {
		state.error = null;
		if (errorEl) {
			errorEl.textContent = "";
			errorEl.classList.add("hidden");
		}
		applyErrorStyles(false);
	}

	function emitChange(files: File[], meta: FileChangeMeta = { added: [], removed: [] }): void {
		if (cfg.onChange) {
			try {
				cfg.onChange(files.slice(), meta);
			} catch (e) {
				console.error("mountFileField onChange callback failed:", e);
			}
		}
	}

	function onChange(e: Event): void {
		const target = e.currentTarget as HTMLInputElement;
		const prev = state.files;
		const next = Array.from(target.files ?? []);
		state.files = next;

		if (cfg.clearErrorOnChange && state.error != null) {
			clearError();
		}

		// derive basic added/removed info (best-effort)
		const key = (f: File) => `${f.name}:${f.size}:${f.type}`;
		const prevNames = new Set(prev.map(key));
		const nextNames = new Set(next.map(key));
		const added = next.filter((f) => !prevNames.has(key(f)));
		const removed = prev.filter((f) => !nextNames.has(key(f)));

		emitChange(state.files, { added, removed });
	}

	input.addEventListener("change", onChange);

	const api: MountFileFieldAPI = {
		// files
		getFiles: () => state.files.slice(),

		// Clears selection
		clear: () => {
			input.value = "";
			state.files = [];
		},

		// constraints helpers
		validate: (): ValidationResult => {
			clearError();
			const files = state.files;

			if (cfg.maxFiles != null && files.length > cfg.maxFiles) {
				const msg = `You can select up to ${cfg.maxFiles} file${cfg.maxFiles === 1 ? "" : "s"}.`;
				setError(msg);
				return { valid: false, error: msg, oversizeFile: null };
			}

			if (cfg.maxFileSizeMB != null && cfg.maxFileSizeMB > 0) {
				const limit = cfg.maxFileSizeMB * 1024 * 1024;
				const oversize = files.find((f) => f.size > limit) ?? null;
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
		disable: () => {
			state.disabled = true;
			input.disabled = true;
		},
		enable: () => {
			state.disabled = false;
			input.disabled = false;
		},
		isDisabled: () => state.disabled,

		// attributes
		setLabel: (text?: unknown) => {
			const label = root.querySelector<HTMLLabelElement>("label");
			if (label) label.textContent = text != null ? String(text) : "";
		},
		setHint: (text?: unknown) => {
			let hint = root.querySelector<HTMLElement>(`#${CSS.escape(hintId)}`);
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
		setAccept: (accept?: unknown) => {
			const val = accept != null ? String(accept) : "";
			cfg.accept = val;
			if (val) input.setAttribute("accept", val);
				else input.removeAttribute("accept");
		},
		setMultiple: (multiple?: unknown) => {
			const m = !!multiple;
			cfg.multiple = m;
			if (m) input.setAttribute("multiple", "");
				else input.removeAttribute("multiple");
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

	return api;
}
