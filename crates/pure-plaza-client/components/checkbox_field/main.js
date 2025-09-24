function mountCheckbox(selector, options = {}) {
	const root = document.querySelector(selector);

	if (!root) throw new Error(`mountCheckbox: no element found for selector "${selector}"`);
	// Helper escape (współpracuje z globalnym escapeHtml jeśli istnieje)
	//
	const esc = typeof escapeHtml === 'function'
		? escapeHtml
		: (s) => String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

	const id = `chk-${Math.floor(Math.random() * 1e8)}`;
	const errorId = `${id}-error`;
	const topLabelId = `${id}-toplabel`;
	const stateLabelId = `${id}-statelabel`;

	const cfg = {
		label: options.label,
		description: options.description || '',
		checked: !!options.checked,
		disabled: !!options.disabled,
		trueLabel: options.trueLabel != null ? String(options.trueLabel) : 'Yes',
		falseLabel: options.falseLabel != null ? String(options.falseLabel) : 'No',
		onChange: typeof options.onChange === 'function' ? options.onChange : null,
		clearErrorOnChange: !!options.clearErrorOnChange,
	};

	root.innerHTML = `
<div class="flex flex-col gap-2 group">
	<span id="${topLabelId}" class="text-sm font-medium">${esc(cfg.label)}</span>
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
		<span id="${stateLabelId}" class="ml-3 text-sm text-neutral-300">${cfg.checked ? esc(cfg.trueLabel) : esc(cfg.falseLabel)}</span>
	</label>

	${cfg.description ? `<p class="text-xs text-neutral-500">${esc(cfg.description)}</p>` : ''}

	<p id="${errorId}" class="hidden text-sm text-red-400" role="alert" aria-live="polite"></p>
</div> `;

	const input = root.querySelector(`#${CSS.escape(id)}`);
	const track = root.querySelector('label > span'); // pierwszy <span> w label – tor przełącznika
	const stateLabel = root.querySelector(`#${CSS.escape(stateLabelId)}`);
	const errorEl = root.querySelector(`#${CSS.escape(errorId)}`);
	const state = {
		checked: cfg.checked,
		disabled: cfg.disabled,
		error: null,
		trueLabel: cfg.trueLabel,
		falseLabel: cfg.falseLabel,
	};
	const normalRingClasses = ['ring-neutral-700', 'peer-focus:ring-blue-400/60'];
	const errorRingClasses = ['ring-red-500/70', 'peer-focus:ring-red-500/70'];

	function applyErrorStyles(hasError) {
		if (!track) return;
		if (hasError) {
			track.classList.remove(...normalRingClasses);
			track.classList.add(...errorRingClasses);
			input.setAttribute('aria-invalid', 'true');
		} else {
			track.classList.remove(...errorRingClasses);
			track.classList.add(...normalRingClasses);
			input.removeAttribute('aria-invalid');
		}
	}

	function emitChange(checked) {
		if (cfg.onChange) {
			try {
				cfg.onChange({ checked });
			} catch (e) {
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

	// API błędów
	function setError(message) {
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

	function clearError() {
		state.error = null;
		if (errorEl) {
			errorEl.textContent = '';
			errorEl.classList.add('hidden');
		}
		applyErrorStyles(false);
	}

	// Inicjalny stan pierścienia (bez błędu)
	applyErrorStyles(false);
	syncUi();

	// Publiczne API
	return {
		// wartości
		getChecked: () => state.checked,
		setChecked: (next, { silent = false } = {}) => {
			const val = !!next;
			state.checked = val;
			syncUi();
			if (!silent) emitChange(val);
		},
		// aliasy
		getValue: () => state.checked,
		setValue: (next, opts = {}) => { return this.setChecked ? this.setChecked(next, opts) : null; },
		toggle: ({ silent = false } = {}) => {
			state.checked = !state.checked;
			syncUi();
			if (!silent) emitChange(state.checked);
		},

		// etykiety
		setLabel: (text) => {
			const top = root.querySelector(`#${CSS.escape(topLabelId)}`);
			if (top) top.textContent = text != null ? String(text) : '';
		},
		setStateLabels: ({ trueLabel, falseLabel } = {}) => {
			if (trueLabel != null) state.trueLabel = String(trueLabel);
			if (falseLabel != null) state.falseLabel = String(falseLabel);
			syncUi();
		},
		setDescription: (text) => {
			let desc = root.querySelector('.text-xs.text-neutral-500');
			if (!desc && text) {
				desc = document.createElement('p');
				desc.className = 'text-xs text-neutral-500';
				root.querySelector('div').appendChild(desc);
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

		// błędy
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
}
