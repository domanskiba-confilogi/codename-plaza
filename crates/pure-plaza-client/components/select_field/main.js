function mountSelectField(selector, items, options = {}) {
	const root = document.querySelector(selector);

	if (!root) {
		throw new Error(`mountSelectField: no element found for selector "${selector}"`);
	}

	if (!Array.isArray(items)) {
		throw new Error('mountSelectField: "items" must be an array of { value, displayText }');
	}

	const cfg = {
		label: options.label || 'Select items',
		placeholder: options.placeholder || 'Search...',
		id: `select-field-${Math.floor(Math.random() * 1e14)}`,
		disabled: !!options.disabled,
		onSelect: typeof options.onSelect === 'function' ? options.onSelect : null,
		onRemove: typeof options.onRemove === 'function' ? options.onRemove : null,
	};

	const X_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" class="w-4 aspect-square text-neutral-300 group-hover/item:text-yellow-400"
viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<line x1="18" y1="6" x2="6" y2="18"></line>
<line x1="6" y1="6" x2="18" y2="18"></line>
</svg>
`;

	// Mount structure
	root.innerHTML = `
<div class="flex flex-col gap-2 relative group">
	<label class="text-sm font-medium" for="${cfg.id}">${escapeHtml(cfg.label)}</label>
	<div class="chips flex flex-row gap-2 w-full flex-wrap hidden"></div>
	<input
		id="${cfg.id}"
		type="text"
		class="peer w-full rounded-md bg-neutral-950/60 text-neutral-100 placeholder-neutral-500 px-3.5 py-2.5 transition hover:bg-neutral-900/60 focus:outline-none focus:bg-neutral-950/80 ring-1 ring-inset ring-neutral-800 focus:ring-2 focus:ring-blue-400/60 disabled:bg-neutral-800 disabled:text-neutral-400 disabled:cursor-not-allowed"
		placeholder="${escapeHtml(cfg.placeholder)}"
		autocomplete="off"
	/>
	<div class="menu flex-col hidden w-full absolute top-[110%] left-0 max-h-[150px] overflow-auto rounded-xl shadow-lg shadow-black/30"></div>
</div>
`;

	const input = root.querySelector('input');
	const chips = root.querySelector('.chips');
	const menu = root.querySelector('.menu');

	// Component state
	let state = {
		search: '',
		chosen: [],        // array of values
		showMenu: false,
		items: items.slice(),
		disabled: cfg.disabled,
	};

	// --- Events helper ---
	function normalizeEventName(name) {
		return name.startsWith('selectfield:') ? name : `selectfield:${name}`;
	}

	function emit(type, value) {
		const item = state.items.find(i => i.value === value) || { value, displayText: String(value) };
		const detail = { value, item, chosen: state.chosen.slice() };

		if (type === 'select' && cfg.onSelect) cfg.onSelect(detail);
		if (type === 'remove' && cfg.onRemove) cfg.onRemove(detail);

		root.dispatchEvent(new CustomEvent(`selectfield:${type}`, { detail }));
		root.dispatchEvent(new CustomEvent('selectfield:change', { detail: { chosen: state.chosen.slice() } }));
	}

	// Helpers
	function applyDisabledUI() {
		if (input) input.disabled = !!state.disabled;
		// Ukryj menu i wyczyść je, gdy disabled
		if (state.disabled) {
			state.showMenu = false;
		}
		renderChips();
		renderMenu();
	}

	function filteredItems() {
		const q = state.search.toLowerCase().trim();
		return state.items
			.filter(item => !state.chosen.includes(item.value))
			.filter(item => item.displayText.toLowerCase().trim().includes(q));
	}

	function renderChips() {
		chips.innerHTML = '';
		chips.classList.toggle("hidden", state.chosen.length === 0);
		state.chosen.forEach(val => {
			const item = state.items.find(i => i.value === val);
			if (!item) return;

			const chip = document.createElement('div');
			chip.className = 'px-3 py-1.5 rounded bg-neutral-950/60 ring-1 ring-inset ring-neutral-800 flex flex-row gap-2 justify-center items-center group/item cursor-default';

			const label = document.createElement('span');
			label.textContent = item.displayText;
			label.className = 'select-none';

			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'shrink-0 p-1 rounded hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:focus:ring-0';
			btn.setAttribute('aria-label', `Usuń ${item.displayText}`);
			btn.innerHTML = X_ICON_SVG;
			btn.disabled = !!state.disabled;
			btn.addEventListener('click', (e) => {
				if (state.disabled) return;
				e.stopPropagation();
				removeItem(val);
			});

			chip.appendChild(label);
			chip.appendChild(btn);
			chips.appendChild(chip);
		});
	}

	function renderMenu() {
		menu.innerHTML = '';
		// Gdy disabled, menu ma być ukryte i nieaktywne
		if (state.disabled) {
			menu.classList.add('hidden');
			return;
		}
		const list = filteredItems();
		if (list.length === 0) {
			const empty = document.createElement('div');
			empty.className = 'px-4 py-2 bg-neutral-900 text-neutral-400';
			empty.textContent = 'Brak wyników';
			menu.appendChild(empty);
		} else {
			list.forEach(item => {
				const btn = document.createElement('button');
				btn.type = 'button';
				btn.className = 'text-start w-full px-4 py-2 bg-neutral-900 focus:bg-neutral-800 hover:bg-neutral-800 cursor-pointer';
				btn.textContent = item.displayText;
				btn.addEventListener('click', () => {
					if (state.disabled) return;
					chooseItem(item.value);
				});
				menu.appendChild(btn);
			});
		}
		menu.classList.toggle('hidden', !state.showMenu);
	}

	function chooseItem(value) {
		if (state.disabled) return;
		state.chosen.push(value);
		state.showMenu = false;
		renderChips();
		renderMenu();
		clearSearchInput();
		console.info(`Chosen item with value: ${value}`);

		// Emit after state updated
		emit('select', value);

		setTimeout(() => {
			if (state.disabled) return;
			state.showMenu = true;
			renderMenu();
			input && input.focus();
		}, 50);
	}

	function removeItem(value) {
		if (state.disabled) return;
		const idx = state.chosen.indexOf(value);
		if (idx !== -1) {
			state.chosen.splice(idx, 1);
			renderChips();
			renderMenu();
			// Emit after state updated
			emit('remove', value);
			if (input) input.focus();
		}
	}

	function clearSearchInput() {
		state.search = '';
		if (input) input.value = '';
		renderMenu();
	}

	function onInput(e) {
		if (state.disabled) return;
		state.search = e.target.value || '';
		state.showMenu = true;
		renderMenu();
	}

	function onFocus() {
		if (state.disabled) return;
		state.showMenu = true;
		renderMenu();
	}

	function onClick() {
		if (state.disabled) return;
		state.showMenu = true;
		renderMenu();
	}

	// Delay hide on blur so click on menu items registers
	function onBlur() {
		setTimeout(() => {
			state.showMenu = false;
			renderMenu();
		}, 150);
	}

	function onKeyDown(e) {
		if (state.disabled) return;
		if (e.key === 'Enter') {
			const list = filteredItems();
			if (list.length > 0) {
				e.preventDefault();
				e.stopPropagation();
				chooseItem(list[0].value);
			}
		}
	}

	// Attach listeners
	input.addEventListener('click', onClick);
	input.addEventListener('input', onInput);
	input.addEventListener('focus', onFocus);
	input.addEventListener('blur', onBlur);
	input.addEventListener('keydown', onKeyDown);

	// Initial render
	applyDisabledUI(); // ustawia też input.disabled
	renderChips();
	renderMenu();

	// Public API
	return {
		getChosen: () => state.chosen.slice(),
		setItems: (nextItems) => {
			if (!Array.isArray(nextItems)) return;
			state.items = nextItems.slice();
			const valuesSet = new Set(state.items.map(i => i.value));
			// UWAGA: obecna logika nadpisuje chosen wszystkimi dostępnymi wartościami (zachowana zgodnie z pierwowzorem)
			state.chosen = [...valuesSet];
			renderChips();
			renderMenu();
			// Zmiana zestawu może mieć wpływ na selection – emituje change
			root.dispatchEvent(new CustomEvent('selectfield:change', { detail: { chosen: state.chosen.slice() } }));
		},
		clear: () => {
			const removed = state.chosen.slice();
			state.chosen = [];
			clearSearchInput();
			renderChips();
			renderMenu();
			// Opcjonalnie: emitujemy remove dla każdego usuniętego elementu
			removed.forEach(v => emit('remove', v));
		},
		clearSearch: clearSearchInput,
		focus: () => { if (!state.disabled) input.focus(); },
		disable: () => { state.disabled = true; applyDisabledUI(); },
		enable: () => { state.disabled = false; applyDisabledUI(); },
		setDisabled: (flag) => { state.disabled = !!flag; applyDisabledUI(); },
		isDisabled: () => !!state.disabled,
		// Event API (sugar na CustomEvent)
		addEventListener: (eventName, handler) => {
			root.addEventListener(normalizeEventName(eventName), handler);
			return () => root.removeEventListener(normalizeEventName(eventName), handler);
		},
		removeEventListener: (eventName, handler) => {
			root.removeEventListener(normalizeEventName(eventName), handler);
		},
		// Możliwość przeprogramowania callbacków runtime
		setOnSelect: (fn) => { cfg.onSelect = typeof fn === 'function' ? fn : null; },
		setOnRemove: (fn) => { cfg.onRemove = typeof fn === 'function' ? fn : null; },
		destroy: () => {
			input.removeEventListener('input', onInput);
			input.removeEventListener('focus', onFocus);
			input.removeEventListener('blur', onBlur);
			input.removeEventListener('click', onClick);
			input.removeEventListener('keydown', onKeyDown);
			root.innerHTML = '';
		},
	};
}
