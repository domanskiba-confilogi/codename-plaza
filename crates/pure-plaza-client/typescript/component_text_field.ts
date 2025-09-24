import { escapeHtml, mustQuerySelector } from "./helpers.js";

export type TextFieldType = "text" | "email" | "password";

export interface TextFieldOptions {
	type?: TextFieldType | (string & {});
	label?: string;
	placeholder?: string;
	disabled?: boolean;
	value?: string | number | null | undefined;
	onInput?: (payload: { new_value: string }) => void;
	// nowość: czy automatycznie usuwać błąd przy zdarzeniu "input"
	clearErrorOnInput?: boolean;
}

export interface TextFieldApi {
	// odczyt/zapis wartości
	getValue: () => string;
	setValue: (next: string | number | null | undefined, opts?: { silent?: boolean }) => void;

	// typ: "text" | "email" | "password"
	getType: () => TextFieldType;
	setType: (nextType: TextFieldType | string) => void;

	// enabled / disabled
	isDisabled: () => boolean;
	disable: () => void;
	enable: () => void;

	// focus/blur
	focus: () => void;
	blur: () => void;

	// czyszczenie
	clear: (opts?: { silent?: boolean }) => void;

	// podmiana etykiety/placeholdera
	setLabel: (text: string | number | null | undefined) => void;
	setPlaceholder: (text: string | number | null | undefined) => void;

	// podmiana callbacku
	setOnInput: (fn: TextFieldOptions["onInput"]) => void;

	// BŁĘDY: ustawianie/zerowanie
	setError: (message?: string | number | null) => void; // ustawia/aktualizuje treść błędu (pusty/null usuwa błąd)
	clearError: () => void;                               // usuwa błąd
	hasError: () => boolean;

	// elementy DOM
	inputEl: HTMLInputElement;
	errorEl: HTMLParagraphElement | null;
	root: HTMLElement;

	// sprzątanie
	destroy: () => void;
}

function normalizeType(input?: string): TextFieldType {
	const t = String(input ?? "text").toLowerCase();
	return t === "text" || t === "email" || t === "password" ? t : "text";
}

export function mountTextField(selector: string, options?: TextFieldOptions): TextFieldApi {
	const root = document.querySelector<HTMLElement>(selector);
	if (!root) {
		throw new Error(`mountTextField: no element found for selector "${selector}"`);
	}

	const id = `input-${Math.floor(Math.random() * 1e8)}`;
	const errorId = `${id}-error`;

	const cfg = {
		type: normalizeType(options?.type),
		label: options?.label ?? "Label",
		placeholder: options?.placeholder ?? "",
		disabled: !!options?.disabled,
		value: options?.value != null ? String(options.value) : "",
		onInput: typeof options?.onInput === "function" ? options.onInput : null as TextFieldOptions["onInput"] | null,
		// nowość: czy automatycznie usuwać błąd przy zdarzeniu "input"
		clearErrorOnInput: !!options?.clearErrorOnInput,
	};

	root.innerHTML = `
<div class="flex flex-col gap-2">
<label class="text-sm font-medium" for="${id}">${escapeHtml(String(cfg.label))}</label>
<input
id="${id}"
type="${cfg.type}"
class="w-full rounded-md bg-neutral-950/60 text-neutral-100 placeholder-neutral-500 px-3.5 py-2.5 transition hover:bg-neutral-900/60 focus:outline-none focus:bg-neutral-950/80 ring-1 ring-inset ring-neutral-800 focus:ring-2 focus:ring-blue-400/60 disabled:bg-neutral-800 disabled:text-neutral-400 disabled:cursor-not-allowed"
placeholder="${escapeHtml(String(cfg.placeholder))}"
autocomplete="off"
${cfg.disabled ? "disabled" : ""}
value="${escapeHtml(String(cfg.value))}"
/>
<p id="${errorId}" class="hidden text-sm text-red-400" role="alert" aria-live="polite"></p>
</div>
`.trim();

	let input = mustQuerySelector<HTMLInputElement>(root, "input");

	const errorSelector = "#" + ((globalThis as any).CSS?.escape ? (globalThis as any).CSS.escape(errorId) : errorId);
	const errorEl = root.querySelector<HTMLParagraphElement>(errorSelector);

	const state: {
		type: TextFieldType;
		disabled: boolean;
		value: string;
		error: string | null;
	} = {
		type: cfg.type,
		disabled: cfg.disabled,
		value: cfg.value,
		error: null,
	};

	// style pomocnicze dla błędów
	const normalRingClasses = ["ring-neutral-800", "focus:ring-blue-400/60"];
	const errorRingClasses = ["ring-red-500/70", "focus:ring-red-500/70"];

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
			// tylko usuwamy aria-describedby, jeśli pokazujemy je wyłącznie dla błędu
			if (input.getAttribute("aria-describedby") === errorId) {
				input.removeAttribute("aria-describedby");
			}
		}
	}

	function emitInput(value: string): void {
		if (cfg.onInput) {
			try {
				cfg.onInput({ new_value: value });
			} catch (e) {
				console.error("mountTextField onInput callback failed:", e);
			}
		}
	}

	function onInput(ev: Event): void {
		const target = ev.target as HTMLInputElement | null;
		if (!target) return;
		state.value = target.value;

		// auto-czyszczenie błędu przy "input" (jeśli włączone)
		if (cfg.clearErrorOnInput && state.error != null) {
			clearError();
		}
		emitInput(state.value);
	}

	input.addEventListener("input", onInput);

	// API błędów
	function setError(message?: string | number | null): void {
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

	// Publiczne API
	return {
		// odczyt/zapis wartości
		getValue: () => state.value,
		setValue: (next, { silent = false }: { silent?: boolean } = {}) => {
			const val = next == null ? "" : String(next);
			state.value = val;
			input.value = val;
			if (!silent) emitInput(val);
		},

		// typ: "text" | "email" | "password"
		getType: () => state.type,
		setType: (nextType: TextFieldType | string) => {
			const t = normalizeType(nextType);
			state.type = t;
			input.setAttribute("type", t);
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
		clear: ({ silent = false }: { silent?: boolean } = {}) => {
			input.value = "";
			state.value = "";
			if (!silent) emitInput("");
		},

		// podmiana etykiety/placeholdera
		setLabel: (text) => {
			const label = root.querySelector<HTMLLabelElement>("label");
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
