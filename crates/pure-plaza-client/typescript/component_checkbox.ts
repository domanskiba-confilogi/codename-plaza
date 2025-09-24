import { escapeHtml, mustQuerySelector } from "./helpers.js";

export interface MountCheckboxChangeEvent {
	checked: boolean;
}

export type MountCheckboxOnChange = (ev: MountCheckboxChangeEvent) => void;

export interface MountCheckboxOptions {
	label?: string | number | boolean;
	description?: string;
	checked?: boolean;
	disabled?: boolean;
	trueLabel?: string | number | boolean;
	falseLabel?: string | number | boolean;
	onChange?: MountCheckboxOnChange | null;
	clearErrorOnChange?: boolean;
}

export interface CheckboxApi {
	// values
	getChecked(): boolean;
	setChecked(next: boolean, opts?: { silent?: boolean }): void;
	getValue(): boolean;
	setValue(next: boolean, opts?: { silent?: boolean }): void;
	toggle(opts?: { silent?: boolean }): void;

	// labels
	setLabel(text?: string | number | boolean | null): void;
	setStateLabels(labels?: { trueLabel?: string | number | boolean; falseLabel?: string | number | boolean }): void;
	setDescription(text?: string | number | boolean | null): void;

	// enabled / disabled
	isDisabled(): boolean;
	disable(): void;
	enable(): void;

	// callback
	setOnChange(fn?: MountCheckboxOnChange | null): void;

	// errors
	setError(message?: string | number | boolean | null): void;
	clearError(): void;
	hasError(): boolean;

	// DOM
	inputEl: HTMLInputElement;
	trackEl: HTMLSpanElement | null;
	stateLabelEl: HTMLElement | null;
	errorEl: HTMLElement | null;
	root: HTMLElement;

	// cleanup
	destroy(): void;
}

export function mountCheckbox(selector: string, options: MountCheckboxOptions = {}): CheckboxApi {
	const root = document.querySelector<HTMLElement>(selector);
	if (!root) throw new Error(`mountCheckbox: no element found for selector "${selector}"`);

	const id = `chk-${Math.floor(Math.random() * 1e8)}`;
	const errorId = `${id}-error`;
	const topLabelId = `${id}-toplabel`;
	const stateLabelId = `${id}-statelabel`;

	const cfg: {
		label: string;
		description: string;
		checked: boolean;
		disabled: boolean;
		trueLabel: string;
		falseLabel: string;
		onChange: MountCheckboxOnChange | null;
		clearErrorOnChange: boolean;
	} = {
			label: options.label !== undefined ? String(options.label) : "",
			description: options.description ?? '',
			checked: !!options.checked,
			disabled: !!options.disabled,
			trueLabel: options.trueLabel != null ? String(options.trueLabel) : 'Yes',
			falseLabel: options.falseLabel != null ? String(options.falseLabel) : 'No',
			onChange: typeof options.onChange === 'function' ? options.onChange : null,
			clearErrorOnChange: !!options.clearErrorOnChange,
		};

	root.innerHTML = `
<div class="flex flex-col gap-2 group">
<span id="${topLabelId}" class="text-sm font-medium">${cfg.label != null ? escapeHtml(cfg.label) : ''}</span>
<label for="${id}" class="inline-flex items-center cursor-pointer select-none ">
<input
id="${id}"
type="checkbox"
class="sr-only peer focus-visible:outline-none"
${cfg.checked ? 'checked' : ''}
${cfg.disabled ? 'disabled' : ''}
role="switch"
aria-labelledby="${topLabelId}"
aria-describedby="${errorId}"
/>
<span class="w-11 h-6 bg-neutral-800 rounded-full ring-1 ring-neutral-700 transition-colors relative
peer-checked:bg-blue-500/20
peer-focus:ring-2 peer-focus:ring-blue-400/60">
<span class="absolute top-0.5 left-0.5 w-5 h-5 bg-neutral-300 rounded-full transition-transform
group-has-[:checked]:translate-x-5"></span>
</span>
<span id="${stateLabelId}" class="ml-3 text-sm text-neutral-300">${cfg.checked ? escapeHtml(cfg.trueLabel) : escapeHtml(cfg.falseLabel)}</span>
</label>
${cfg.description ? `<p class="text-xs text-neutral-500">${escapeHtml(cfg.description)}</p>` : ''}
<p id="${errorId}" class="hidden text-sm text-red-400" role="alert" aria-live="polite"></p>
</div>`.trim();

	const input = mustQuerySelector<HTMLInputElement>(root, `#${CSS.escape(id)}`);
	if (!input) throw new Error('mountCheckbox: failed to create input element');

	const track = mustQuerySelector<HTMLSpanElement>(root, 'label > span');
	const stateLabel = mustQuerySelector<HTMLElement>(root, `#${CSS.escape(stateLabelId)}`);
	const errorEl = mustQuerySelector<HTMLElement>(root, `#${CSS.escape(errorId)}`);

	const state: {
		checked: boolean;
		disabled: boolean;
		error: string | null;
		trueLabel: string;
		falseLabel: string;
	} = {
			checked: cfg.checked,
			disabled: cfg.disabled,
			error: null,
			trueLabel: cfg.trueLabel,
			falseLabel: cfg.falseLabel,
		};

	const normalRingClasses: string[] = ['ring-neutral-700', 'peer-focus:ring-blue-400/60'];
	const errorRingClasses: string[] = ['ring-red-500/70', 'peer-focus:ring-red-500/70'];

	function applyErrorStyles(hasError: boolean): void {
		if (!track) return;
		if (hasError) {
			track.classList.remove(...normalRingClasses);
			track.classList.add(...errorRingClasses);
			input.setAttribute('aria-invalid', 'true');
		} else {
			track.classList.remove(...errorRingClasses);
			normalRingClasses.forEach(c => track.classList.add(c));
			input.removeAttribute('aria-invalid');
		}
	}

	function emitChange(checked: boolean): void {
		if (cfg.onChange) {
			try {
				cfg.onChange({ checked });
			} catch (e) {
				console.error('mountCheckbox onChange callback failed:', e);
			}
		}
	}

	function syncUi(): void {
		if (stateLabel) {
			stateLabel.textContent = state.checked ? state.trueLabel : state.falseLabel;
		}
		input.checked = state.checked;
		input.setAttribute('aria-checked', String(state.checked));
	}

	function onChange(): void {
		state.checked = input.checked;
		syncUi();
		if (cfg.clearErrorOnChange && state.error != null) {
			clearError();
		}
		emitChange(state.checked);
	}

	input.addEventListener('change', onChange);

	function setError(message?: string | number | boolean | null): void {
		const msg = message == null ? '' : String(message);
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

	function clearError(): void {
		state.error = null;
		if (errorEl) {
			errorEl.textContent = '';
			errorEl.classList.add('hidden');
		}
		applyErrorStyles(false);
	}

	function doSetChecked(next: boolean, opts?: { silent?: boolean }): void {
		const val = !!next;
		state.checked = val;
		syncUi();
		if (!opts?.silent) emitChange(val);
	}

	// initial state
	applyErrorStyles(false);
	syncUi();

	const api: CheckboxApi = {
		// values
		getChecked: () => state.checked,
		setChecked: (next, opts) => doSetChecked(next, opts),
		getValue: () => state.checked,
		setValue: (next, opts) => doSetChecked(next, opts),
		toggle: (opts) => {
			state.checked = !state.checked;
			syncUi();
			if (!opts?.silent) emitChange(state.checked);
		},

		// labels
		setLabel: (text) => {
			const top = root.querySelector<HTMLElement>(`#${CSS.escape(topLabelId)}`);
			if (top) top.textContent = text != null ? String(text) : '';
		},
		setStateLabels: ({ trueLabel, falseLabel } = {}) => {
			if (trueLabel != null) state.trueLabel = String(trueLabel);
			if (falseLabel != null) state.falseLabel = String(falseLabel);
			syncUi();
		},
		setDescription: (text) => {
			let desc = root.querySelector<HTMLParagraphElement>('.text-xs.text-neutral-500');
			if (!desc && text != null && String(text) !== '') {
				desc = document.createElement('p');
				desc.className = 'text-xs text-neutral-500';
				const container = root.querySelector('div');
				if (container) container.appendChild(desc);
			}
			if (desc) desc.textContent = text != null ? String(text) : '';
		},

		// enabled / disabled
		isDisabled: () => state.disabled,
		disable: () => {
			state.disabled = true;
			input.disabled = true;
			input.setAttribute('aria-disabled', 'true');
		},
		enable: () => {
			state.disabled = false;
			input.disabled = false;
			input.removeAttribute('aria-disabled');
		},

		// callback
		setOnChange: (fn) => {
			cfg.onChange = typeof fn === 'function' ? fn : null;
		},

		// errors
		setError,
		clearError,
		hasError: () => state.error != null,

		// DOM
		inputEl: input,
		trackEl: track,
		stateLabelEl: stateLabel,
		errorEl,
		root,

		// cleanup
		destroy: () => {
			input.removeEventListener('change', onChange);
			root.innerHTML = '';
		},
	};

	return api;
}
