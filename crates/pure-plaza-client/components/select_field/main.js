// Mounts a select-field component into the element matched by selector.
// Requires TailwindCSS present on the page.
// Usage:
//   const api = mountSelectField('#target', [
//     { value: 1, displayText: 'Apple' },
//     { value: 2, displayText: 'Banana' },
//   ], { label: 'Choose fruits', placeholder: 'Search...' });

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
	};

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
			btn.className = 'shrink-0 p-1 rounded hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-yellow-400/60';
			btn.setAttribute('aria-label', `Usuń ${item.displayText}`);
			btn.innerHTML = X_ICON_SVG;
			btn.addEventListener('click', (e) => {
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
					chooseItem(item.value);
				});
				menu.appendChild(btn);
			});
		}

		menu.classList.toggle('hidden', !state.showMenu);
	}

	function chooseItem(value) {
		state.chosen.push(value);
		state.showMenu = false;
		renderChips();
		renderMenu();
		clearSearchInput();

		console.info(`Chosen item with value: ${value}`);

		setTimeout(() => {
			state.showMenu = true;
			renderMenu();
			input && input.focus();
		}, 50);
	}

	function removeItem(value) {
		const idx = state.chosen.indexOf(value);
		if (idx !== -1) {
			state.chosen.splice(idx, 1);
			renderChips();
			renderMenu();
			if (input) input.focus();
		}
	}

	function clearSearchInput() {
		state.search = '';
		if (input) input.value = '';
		renderMenu();
	}

	function onInput(e) {
		state.search = e.target.value || '';
		state.showMenu = true;
		renderMenu();
	}

	function onFocus() {
		state.showMenu = true;
		renderMenu();
	}

	function onClick() {
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
	renderChips();
	renderMenu();

	// Public API
	return {
		getChosen: () => state.chosen.slice(),
		setItems: (nextItems) => {
			if (!Array.isArray(nextItems)) return;
			state.items = nextItems.slice();
			const valuesSet = new Set(state.items.map(i => i.value));
			state.chosen = [...valuesSet];
			renderChips();
			renderMenu();
		},
		clear: () => {
			state.chosen = [];
			clearSearchInput();
			renderChips();
		},
		clearSearch: clearSearchInput,
		focus: () => input.focus(),
		destroy: () => {
			input.removeEventListener('input', onInput);
			input.removeEventListener('focus', onFocus);
			input.removeEventListener('blur', onBlur);
			input.removeEventListener('click', onClick);
			input.removeEventListener('keydown', onKeyDown);
			root.innerHTML = '';
		},
		root,
	};
}
