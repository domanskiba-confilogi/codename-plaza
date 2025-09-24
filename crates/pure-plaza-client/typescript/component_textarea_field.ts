import { escapeHtml, mustQuerySelector } from "./helpers.js";

export type TextAreaOnInput = (payload: { new_value: string }) => void;

export interface MountTextAreaOptions {
	label?: string;
	placeholder?: string;
	disabled?: boolean;
	value?: string | number | null | undefined;
	onInput?: TextAreaOnInput | null;
	// auto-clear error on user input
	clearErrorOnInput?: boolean;
}

export interface TextAreaController {
	// value read/write
	getValue(): string;
	setValue(next: string | number | null | undefined, opts?: { silent?: boolean }): void;

	// enabled / disabled
	isDisabled(): boolean;
	disable(): void;
	enable(): void;

	// focus/blur
	focus(): void;
	blur(): void;

	// clear
	clear(opts?: { silent?: boolean }): void;

	// label / placeholder
	setLabel(text: string | number | null | undefined): void;
	setPlaceholder(text: string | number | null | undefined): void;

	// input callback
	setOnInput(fn: TextAreaOnInput | null | undefined): void;

	// errors
	setError(message: string | number | null | undefined): void;
	clearError(): void;
	hasError(): boolean;

	// DOM elements
	inputEl: HTMLTextAreaElement;
	errorEl: HTMLParagraphElement | null;
	root: HTMLElement;

	// cleanup
	destroy(): void;
}

const cssEscape =
	typeof CSS !== "undefined" && typeof CSS.escape === "function"
		? CSS.escape.bind(CSS)
		: (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, ch => `\\${ch}`);

export function mountTextArea(
	selector: string,
	options: MountTextAreaOptions = {}
): TextAreaController {
	const rootEl = document.querySelector(selector);
	if (!rootEl) {
		throw new Error(`mountTextArea: no element found for selector "${selector}"`);
	}
	const root = rootEl as HTMLElement;

	const id = `textfield-${Math.floor(Math.random() * 1e8)}`;
	const errorId = `${id}-error`;

	const cfg: Required<Pick<MountTextAreaOptions, "label" | "placeholder" | "disabled" | "clearErrorOnInput">> & {
		value: string;
		onInput: TextAreaOnInput | null;
	} = {
			label: options.label ?? "Label",
			placeholder: options.placeholder ?? "",
			disabled: !!options.disabled,
			value: options.value != null ? String(options.value) : "",
			onInput: typeof options.onInput === "function" ? options.onInput : null,
			clearErrorOnInput: !!options.clearErrorOnInput,
		};

	// Render
	root.innerHTML = `
<div class="flex flex-col gap-2 h-full">
	<label class="text-sm font-medium" for="${id}">${escapeHtml(cfg.label)}</label>
	<textarea
		id="${id}"
		class="w-full rounded-md bg-neutral-950/60 text-neutral-100 placeholder-neutral-500 px-3.5 py-2.5 transition hover:bg-neutral-900/60 focus:outline-none focus:bg-neutral-950/80 ring-1 ring-inset ring-neutral-800 focus:ring-2 focus:ring-blue-400/60 disabled:bg-neutral-800 disabled:text-neutral-400 disabled:cursor-not-allowed h-full"
		placeholder="${escapeHtml(cfg.placeholder)}"
		autocomplete="off"
		${cfg.disabled ? "disabled" : ""}
	>${escapeHtml(cfg.value)}</textarea>
	<p id="${errorId}" class="hidden text-sm text-red-400" role="alert" aria-live="polite"></p>
</div>
`;

	const input = mustQuerySelector<HTMLTextAreaElement>(root, "textarea");

	const errorEl = root.querySelector(`#${cssEscape(errorId)}`) as HTMLParagraphElement | null;

	const state: {
		disabled: boolean;
		value: string;
		error: string | null;
	} = {
			disabled: cfg.disabled,
			value: cfg.value,
			error: null,
		};

	// Error styles
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
				console.error("mountTextArea onInput callback failed:", e);
			}
		}
	}

	function onInput(e: Event): void {
		const el = e.currentTarget as HTMLTextAreaElement | null;
		const val = el ? el.value : input.value;
		state.value = val;

		if (cfg.clearErrorOnInput && state.error != null) {
			clearError();
		}
		emitInput(state.value);
	}

	input.addEventListener("input", onInput);

	// Errors API
	function setError(message: string | number | null | undefined): void {
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

	// Public API
	const api: TextAreaController = {
		getValue: () => state.value,
		setValue: (next, { silent = false }: { silent?: boolean } = {}) => {
			const val = next == null ? "" : String(next);
			state.value = val;
			input.value = val;
			if (!silent) emitInput(val);
		},

		isDisabled: () => state.disabled,
		disable: () => {
			state.disabled = true;
			input.disabled = true;
		},
		enable: () => {
			state.disabled = false;
			input.disabled = false;
		},

		focus: () => input.focus(),
		blur: () => input.blur(),

		clear: ({ silent = false }: { silent?: boolean } = {}) => {
			input.value = "";
			state.value = "";
			if (!silent) emitInput("");
		},

		setLabel: (text) => {
			const label = root.querySelector("label");
			if (label) label.textContent = text != null ? String(text) : "";
		},
		setPlaceholder: (text) => {
			input.setAttribute("placeholder", text != null ? String(text) : "");
		},

		setOnInput: (fn) => {
			cfg.onInput = typeof fn === "function" ? fn : null;
		},

		setError,
		clearError,
		hasError: () => state.error != null,

		inputEl: input,
		errorEl,
		root,

		destroy: () => {
			input.removeEventListener("input", onInput);
			root.innerHTML = "";
		},
	};

	return api;
}
