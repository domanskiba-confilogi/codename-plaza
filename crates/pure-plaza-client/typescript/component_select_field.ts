import { escapeHtml, mustQuerySelector } from "./helpers.js";

export type SelectFieldValue = string | number;

export interface SelectFieldItem<V = SelectFieldValue> {
	value: V;
	displayText: string;
}

export interface SelectFieldItemEventDetail<V = SelectFieldValue> {
	value: V;
	item: SelectFieldItem<V>;
	chosen: V[];
}

export interface SelectFieldChangeDetail<V = SelectFieldValue> {
	chosen: V[];
}

export type SelectFieldNormalizedEventName =
| 'selectfield:select'
| 'selectfield:remove'
| 'selectfield:change';

export type SelectFieldShortEventName = 'select' | 'remove' | 'change';

export type SelectFieldEventName = SelectFieldNormalizedEventName | SelectFieldShortEventName;

export interface SelectFieldOptions<V = SelectFieldValue> {
	label?: string;
	placeholder?: string;
	disabled?: boolean;
	multiple?: boolean;
	onSelect?: (detail: SelectFieldItemEventDetail<V>) => void;
	onRemove?: (detail: SelectFieldItemEventDetail<V>) => void;
}

export interface SelectFieldApi<V = SelectFieldValue> {
	// State getters
	getChosen: () => V[];
	getItems: () => SelectFieldItem<V>[];
	isDisabled: () => boolean;
	isMultiple: () => boolean;

	// State setters
	setChosen: (newItems: V[]) => void;
	setItems: (nextItems: SelectFieldItem<V>[]) => void;
	setDisabled: (flag: boolean) => void;
	setMultiple: (flag: boolean) => void;

	// Actions
	clear: () => void;
	clearSearch: () => void;
	focus: () => void;
	disable: () => void;
	enable: () => void;

	// Runtime callback overrides
	setOnSelect: (fn: ((detail: SelectFieldItemEventDetail<V>) => void) | null) => void;
	setOnRemove: (fn: ((detail: SelectFieldItemEventDetail<V>) => void) | null) => void;

	// Cleanup
	destroy: () => void;
}

export function mountSelectField<V = SelectFieldValue>(
	selector: string,
	items: SelectFieldItem<V>[],
	options: SelectFieldOptions<V> = {}
): SelectFieldApi<V> {
	const root = mustQuerySelector<HTMLElement>(document.body, selector);
	if (!root) {
		throw new Error(`mountSelectField: no element found for selector "${selector}"`);
	}
	if (!Array.isArray(items)) {
		throw new Error('mountSelectField: "items" must be an array of { value, displayText }');
	}

	const cfg: Required<Pick<SelectFieldOptions<V>, 'label' | 'placeholder' | 'disabled'>> & {
		onSelect: SelectFieldOptions<V>['onSelect'] | null;
		onRemove: SelectFieldOptions<V>['onRemove'] | null;
	} & { id: string } = {
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
	<div class="menu z-10 flex-col hidden w-full absolute top-[110%] left-0 max-h-[150px] overflow-auto rounded-xl shadow-lg shadow-black/30"></div>
</div>
`;

	const input = root.querySelector('input') as HTMLInputElement;
	const chips = root.querySelector('.chips') as HTMLDivElement;
	const menu = root.querySelector('.menu') as HTMLDivElement;

	type State = {
		search: string;
		chosen: V[];
		showMenu: boolean;
		items: SelectFieldItem<V>[];
		disabled: boolean;
		multiple: boolean;
	};

	// Component state
	const state: State = {
		search: '',
		chosen: [],
		showMenu: false,
		items: items.slice(),
		disabled: cfg.disabled,
		multiple: options.multiple !== undefined ? !!options.multiple : true,
	};

	// --- Events helper ---
	function normalizeEventName(name: SelectFieldEventName): SelectFieldNormalizedEventName {
		return (name.startsWith('selectfield:') ? name : `selectfield:${name}`) as SelectFieldNormalizedEventName;
	}

	function emit(type: 'select' | 'remove', value: V) {
		const item = state.items.find((i) => i.value === value) || ({ value, displayText: String(value) } as SelectFieldItem<V>);
		const detail: SelectFieldItemEventDetail<V> = { value, item, chosen: state.chosen.slice() };
		if (type === 'select' && cfg.onSelect) cfg.onSelect(detail);
		if (type === 'remove' && cfg.onRemove) cfg.onRemove(detail);
		root.dispatchEvent(new CustomEvent<SelectFieldItemEventDetail<V>>(normalizeEventName(type), { detail }));
		root.dispatchEvent(
			new CustomEvent<SelectFieldChangeDetail<V>>('selectfield:change', { detail: { chosen: state.chosen.slice() } })
		);
	}

	// Helpers
	function applyDisabledUI() {
		if (input) input.disabled = !!state.disabled;
		if (state.disabled) {
			state.showMenu = false;
		}
		renderChips();
		renderMenu();
	}

	function filteredItems(): SelectFieldItem<V>[] {
		const q = state.search.toLowerCase().trim();
		return state.items
			.filter((item) => !state.chosen.includes(item.value))
			.filter((item) => item.displayText.toLowerCase().trim().includes(q));
	}

	function renderChips() {
		chips.innerHTML = '';
		chips.classList.toggle('hidden', state.chosen.length === 0);
		state.chosen.forEach((val) => {
			const item = state.items.find((i) => i.value === val);
			if (!item) return;
			const chip = document.createElement('div');
			chip.className =
				'px-3 py-1.5 rounded bg-neutral-950/60 ring-1 ring-inset ring-neutral-800 flex flex-row gap-2 justify-center items-center group/item cursor-default overflow-hidden';
			const label = document.createElement('span');
			label.textContent = item.displayText;
			label.className = 'select-none truncate';
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className =
				'shrink-0 p-1 rounded hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:focus:ring-0';
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
		if (state.disabled) {
			menu.classList.add('hidden');
			return;
		}
		const list = filteredItems();
		if (list.length === 0) {
			const empty = document.createElement('div');
			empty.className = 'px-4 py-2 bg-neutral-900 text-neutral-400 overflow-hidden';
			empty.textContent = 'Brak wyników';
			menu.appendChild(empty);
		} else {
			list.forEach((item) => {
				const btn = document.createElement('button');
				btn.type = 'button';
				btn.className =
					'text-start w-full px-4 py-2 bg-neutral-900 focus:bg-neutral-800 hover:bg-neutral-800 cursor-pointer truncate';
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

	// NEW: funkcja do ograniczenia liczby wybranych (single mode)
	function enforceSelectionLimit() {
		if (state.multiple) return;
		if (state.chosen.length <= 1) return;
		const keep = state.chosen[0];
		const toRemove = state.chosen.slice(1);
		state.chosen = [keep!];
		renderChips();
		renderMenu();
		toRemove.forEach((v) => emit('remove', v));
		root.dispatchEvent(
			new CustomEvent<SelectFieldChangeDetail<V>>('selectfield:change', { detail: { chosen: state.chosen.slice() } })
		);
	}

	function chooseItem(value: V, focusAfterAction = true) {
		if (state.disabled) return;

		if (!state.multiple) {
			// Tryb pojedynczy – zastępujemy poprzedni wybór nowym
			const toRemove = state.chosen.filter((v) => v !== value);
			const isSame = state.chosen.length === 1 && state.chosen[0] === value;
			state.chosen = [value];
			state.showMenu = false;
			renderChips();
			renderMenu();
			if (!isSame) {
				toRemove.forEach((v) => emit('remove', v));
			}
			console.info(`Chosen item with value: ${String(value)}`);
			emit('select', value);
			// W single nie otwieramy natychmiast menu ponownie
			return;
		}

		// Tryb wielokrotny
		if (!state.chosen.includes(value)) {
			state.chosen.push(value);
		}
		state.showMenu = false;
		renderChips();
		renderMenu();
		console.info(`Chosen item with value: ${String(value)}`);
		emit('select', value);
		setTimeout(() => {
			if (state.disabled) return;
			// W multi po wyborze ponownie pokazujemy menu
			state.showMenu = true;
			renderMenu();
			if (focusAfterAction && input) input.focus();
		}, 50);
	}

	function removeItem(value: V, focusAfterAction = true) {
		if (state.disabled) return;
		const idx = state.chosen.indexOf(value);
		if (idx !== -1) {
			state.chosen.splice(idx, 1);
			renderChips();
			renderMenu();
			emit('remove', value);
			if (focusAfterAction && input) input.focus();
		}
	}

	function clearSearchInput() {
		state.search = '';
		if (input) input.value = '';
		renderMenu();
	}

	function onInput(e: Event) {
		if (state.disabled) return;
		const target = e.target as HTMLInputElement;
		state.search = target?.value || '';
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

	function onKeyDown(e: KeyboardEvent) {
		if (state.disabled) return;
		if (e.key === 'Enter') {
			const list = filteredItems();
			if (list.length > 0) {
				e.preventDefault();
				e.stopPropagation();
				chooseItem(list[0]!.value);
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
	applyDisabledUI();
	renderChips();
	renderMenu();

	// Public API
	const api: SelectFieldApi<V> = {
		getChosen: () => state.chosen.slice(),
		setChosen: (newItems: V[]) => {
			if (!Array.isArray(newItems)) return;
			// remove current (without focusing)
			state.chosen.slice().forEach((chosenItem) => removeItem(chosenItem, false));
			// add new (without focusing)
			newItems.forEach((chosenItem) => chooseItem(chosenItem, false));
			enforceSelectionLimit();
			renderChips();
			renderMenu();
			root.dispatchEvent(
				new CustomEvent<SelectFieldChangeDetail<V>>('selectfield:change', { detail: { chosen: state.chosen.slice() } })
			);
		},
		setItems: (nextItems: SelectFieldItem<V>[]) => {
			if (!Array.isArray(nextItems)) return;
			state.chosen.slice().forEach((chosenItem) => removeItem(chosenItem, false));
			state.items = nextItems.slice();
			// Jeśli single – zabezpiecz, by został tylko jeden element
			enforceSelectionLimit();
			renderChips();
			renderMenu();
			root.dispatchEvent(
				new CustomEvent<SelectFieldChangeDetail<V>>('selectfield:change', { detail: { chosen: state.chosen.slice() } })
			);
		},
		getItems: () => state.items.slice(),
		clear: () => {
			const removed = state.chosen.slice();
			state.chosen = [];
			clearSearchInput();
			renderChips();
			renderMenu();
			removed.forEach((v) => emit('remove', v));
		},
		clearSearch: clearSearchInput,
		focus: () => {
			if (!state.disabled && input) input.focus();
		},
		disable: () => {
			state.disabled = true;
			applyDisabledUI();
		},
		enable: () => {
			state.disabled = false;
			applyDisabledUI();
		},
		setDisabled: (flag: boolean) => {
			state.disabled = !!flag;
			applyDisabledUI();
		},
		isDisabled: () => !!state.disabled,

		setOnSelect: (fn) => {
			cfg.onSelect = typeof fn === 'function' ? fn : null;
		},
		setOnRemove: (fn) => {
			cfg.onRemove = typeof fn === 'function' ? fn : null;
		},

		setMultiple: (flag: boolean) => {
			const next = !!flag;
			if (state.multiple === next) return;
			state.multiple = next;
			if (!state.multiple) {
				// Wchodzimy w tryb single – utnij nadmiar i wyemituj remove dla odrzuconych
				enforceSelectionLimit();
			} else {
				// Powrót do multiple – odśwież menu
				renderMenu();
			}
		},

		isMultiple: () => state.multiple,

		destroy: () => {
			input.removeEventListener('input', onInput);
			input.removeEventListener('focus', onFocus);
			input.removeEventListener('blur', onBlur);
			input.removeEventListener('click', onClick);
			input.removeEventListener('keydown', onKeyDown);
			root.innerHTML = '';
		},
	};

	return api as SelectFieldApi<V>;
}
