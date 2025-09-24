import { escapeHtml, mustQuerySelector } from "./helpers.js";
export function mountSelectField(selector, items, options) {
    if (options === void 0) { options = {}; }
    var root = mustQuerySelector(document.body, selector);
    if (!root) {
        throw new Error("mountSelectField: no element found for selector \"".concat(selector, "\""));
    }
    if (!Array.isArray(items)) {
        throw new Error('mountSelectField: "items" must be an array of { value, displayText }');
    }
    var cfg = {
        label: options.label || 'Select items',
        placeholder: options.placeholder || 'Search...',
        id: "select-field-".concat(Math.floor(Math.random() * 1e14)),
        disabled: !!options.disabled,
        onSelect: typeof options.onSelect === 'function' ? options.onSelect : null,
        onRemove: typeof options.onRemove === 'function' ? options.onRemove : null,
    };
    var X_ICON_SVG = "\n<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"w-4 aspect-square text-neutral-300 group-hover/item:text-yellow-400\"\nviewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"\nstroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">\n<line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"></line>\n<line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"></line>\n</svg>\n";
    // Mount structure
    root.innerHTML = "\n<div class=\"flex flex-col gap-2 relative group\">\n\t<label class=\"text-sm font-medium\" for=\"".concat(cfg.id, "\">").concat(escapeHtml(cfg.label), "</label>\n\t<div class=\"chips flex flex-row gap-2 w-full flex-wrap hidden\"></div>\n\t<input\n\t\tid=\"").concat(cfg.id, "\"\n\t\ttype=\"text\"\n\t\tclass=\"peer w-full rounded-md bg-neutral-950/60 text-neutral-100 placeholder-neutral-500 px-3.5 py-2.5 transition hover:bg-neutral-900/60 focus:outline-none focus:bg-neutral-950/80 ring-1 ring-inset ring-neutral-800 focus:ring-2 focus:ring-blue-400/60 disabled:bg-neutral-800 disabled:text-neutral-400 disabled:cursor-not-allowed\"\n\t\tplaceholder=\"").concat(escapeHtml(cfg.placeholder), "\"\n\t\tautocomplete=\"off\"\n\t/>\n\t<div class=\"menu z-10 flex-col hidden w-full absolute top-[110%] left-0 max-h-[150px] overflow-auto rounded-xl shadow-lg shadow-black/30\"></div>\n</div>\n");
    var input = root.querySelector('input');
    var chips = root.querySelector('.chips');
    var menu = root.querySelector('.menu');
    // Component state
    var state = {
        search: '',
        chosen: [],
        showMenu: false,
        items: items.slice(),
        disabled: cfg.disabled,
        multiple: options.multiple !== undefined ? !!options.multiple : true,
    };
    // --- Events helper ---
    function normalizeEventName(name) {
        return (name.startsWith('selectfield:') ? name : "selectfield:".concat(name));
    }
    function emit(type, value) {
        var item = state.items.find(function (i) { return i.value === value; }) || { value: value, displayText: String(value) };
        var detail = { value: value, item: item, chosen: state.chosen.slice() };
        if (type === 'select' && cfg.onSelect)
            cfg.onSelect(detail);
        if (type === 'remove' && cfg.onRemove)
            cfg.onRemove(detail);
        root.dispatchEvent(new CustomEvent(normalizeEventName(type), { detail: detail }));
        root.dispatchEvent(new CustomEvent('selectfield:change', { detail: { chosen: state.chosen.slice() } }));
    }
    // Helpers
    function applyDisabledUI() {
        if (input)
            input.disabled = !!state.disabled;
        if (state.disabled) {
            state.showMenu = false;
        }
        renderChips();
        renderMenu();
    }
    function filteredItems() {
        var q = state.search.toLowerCase().trim();
        return state.items
            .filter(function (item) { return !state.chosen.includes(item.value); })
            .filter(function (item) { return item.displayText.toLowerCase().trim().includes(q); });
    }
    function renderChips() {
        chips.innerHTML = '';
        chips.classList.toggle('hidden', state.chosen.length === 0);
        state.chosen.forEach(function (val) {
            var item = state.items.find(function (i) { return i.value === val; });
            if (!item)
                return;
            var chip = document.createElement('div');
            chip.className =
                'px-3 py-1.5 rounded bg-neutral-950/60 ring-1 ring-inset ring-neutral-800 flex flex-row gap-2 justify-center items-center group/item cursor-default overflow-hidden';
            var label = document.createElement('span');
            label.textContent = item.displayText;
            label.className = 'select-none truncate';
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className =
                'shrink-0 p-1 rounded hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:focus:ring-0';
            btn.setAttribute('aria-label', "Usu\u0144 ".concat(item.displayText));
            btn.innerHTML = X_ICON_SVG;
            btn.disabled = !!state.disabled;
            btn.addEventListener('click', function (e) {
                if (state.disabled)
                    return;
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
        var list = filteredItems();
        if (list.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'px-4 py-2 bg-neutral-900 text-neutral-400 overflow-hidden';
            empty.textContent = 'Brak wyników';
            menu.appendChild(empty);
        }
        else {
            list.forEach(function (item) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className =
                    'text-start w-full px-4 py-2 bg-neutral-900 focus:bg-neutral-800 hover:bg-neutral-800 cursor-pointer truncate';
                btn.textContent = item.displayText;
                btn.addEventListener('click', function () {
                    if (state.disabled)
                        return;
                    chooseItem(item.value);
                });
                menu.appendChild(btn);
            });
        }
        menu.classList.toggle('hidden', !state.showMenu);
    }
    // NEW: funkcja do ograniczenia liczby wybranych (single mode)
    function enforceSelectionLimit() {
        if (state.multiple)
            return;
        if (state.chosen.length <= 1)
            return;
        var keep = state.chosen[0];
        var toRemove = state.chosen.slice(1);
        state.chosen = [keep];
        renderChips();
        renderMenu();
        toRemove.forEach(function (v) { return emit('remove', v); });
        root.dispatchEvent(new CustomEvent('selectfield:change', { detail: { chosen: state.chosen.slice() } }));
    }
    function chooseItem(value, focusAfterAction) {
        if (focusAfterAction === void 0) { focusAfterAction = true; }
        if (state.disabled)
            return;
        if (!state.multiple) {
            // Tryb pojedynczy – zastępujemy poprzedni wybór nowym
            var toRemove = state.chosen.filter(function (v) { return v !== value; });
            var isSame = state.chosen.length === 1 && state.chosen[0] === value;
            state.chosen = [value];
            state.showMenu = false;
            renderChips();
            renderMenu();
            if (!isSame) {
                toRemove.forEach(function (v) { return emit('remove', v); });
            }
            console.info("Chosen item with value: ".concat(String(value)));
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
        console.info("Chosen item with value: ".concat(String(value)));
        emit('select', value);
        setTimeout(function () {
            if (state.disabled)
                return;
            // W multi po wyborze ponownie pokazujemy menu
            state.showMenu = true;
            renderMenu();
            if (focusAfterAction && input)
                input.focus();
        }, 50);
    }
    function removeItem(value, focusAfterAction) {
        if (focusAfterAction === void 0) { focusAfterAction = true; }
        if (state.disabled)
            return;
        var idx = state.chosen.indexOf(value);
        if (idx !== -1) {
            state.chosen.splice(idx, 1);
            renderChips();
            renderMenu();
            emit('remove', value);
            if (focusAfterAction && input)
                input.focus();
        }
    }
    function clearSearchInput() {
        state.search = '';
        if (input)
            input.value = '';
        renderMenu();
    }
    function onInput(e) {
        if (state.disabled)
            return;
        var target = e.target;
        state.search = (target === null || target === void 0 ? void 0 : target.value) || '';
        state.showMenu = true;
        renderMenu();
    }
    function onFocus() {
        if (state.disabled)
            return;
        state.showMenu = true;
        renderMenu();
    }
    function onClick() {
        if (state.disabled)
            return;
        state.showMenu = true;
        renderMenu();
    }
    // Delay hide on blur so click on menu items registers
    function onBlur() {
        setTimeout(function () {
            state.showMenu = false;
            renderMenu();
        }, 150);
    }
    function onKeyDown(e) {
        if (state.disabled)
            return;
        if (e.key === 'Enter') {
            var list = filteredItems();
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
    applyDisabledUI();
    renderChips();
    renderMenu();
    // Public API
    var api = {
        getChosen: function () { return state.chosen.slice(); },
        setChosen: function (newItems) {
            if (!Array.isArray(newItems))
                return;
            // remove current (without focusing)
            state.chosen.slice().forEach(function (chosenItem) { return removeItem(chosenItem, false); });
            // add new (without focusing)
            newItems.forEach(function (chosenItem) { return chooseItem(chosenItem, false); });
            enforceSelectionLimit();
            renderChips();
            renderMenu();
            root.dispatchEvent(new CustomEvent('selectfield:change', { detail: { chosen: state.chosen.slice() } }));
        },
        setItems: function (nextItems) {
            if (!Array.isArray(nextItems))
                return;
            state.chosen.slice().forEach(function (chosenItem) { return removeItem(chosenItem, false); });
            state.items = nextItems.slice();
            // Jeśli single – zabezpiecz, by został tylko jeden element
            enforceSelectionLimit();
            renderChips();
            renderMenu();
            root.dispatchEvent(new CustomEvent('selectfield:change', { detail: { chosen: state.chosen.slice() } }));
        },
        getItems: function () { return state.items.slice(); },
        clear: function () {
            var removed = state.chosen.slice();
            state.chosen = [];
            clearSearchInput();
            renderChips();
            renderMenu();
            removed.forEach(function (v) { return emit('remove', v); });
        },
        clearSearch: clearSearchInput,
        focus: function () {
            if (!state.disabled && input)
                input.focus();
        },
        disable: function () {
            state.disabled = true;
            applyDisabledUI();
        },
        enable: function () {
            state.disabled = false;
            applyDisabledUI();
        },
        setDisabled: function (flag) {
            state.disabled = !!flag;
            applyDisabledUI();
        },
        isDisabled: function () { return !!state.disabled; },
        setOnSelect: function (fn) {
            cfg.onSelect = typeof fn === 'function' ? fn : null;
        },
        setOnRemove: function (fn) {
            cfg.onRemove = typeof fn === 'function' ? fn : null;
        },
        setMultiple: function (flag) {
            var next = !!flag;
            if (state.multiple === next)
                return;
            state.multiple = next;
            if (!state.multiple) {
                // Wchodzimy w tryb single – utnij nadmiar i wyemituj remove dla odrzuconych
                enforceSelectionLimit();
            }
            else {
                // Powrót do multiple – odśwież menu
                renderMenu();
            }
        },
        isMultiple: function () { return state.multiple; },
        destroy: function () {
            input.removeEventListener('input', onInput);
            input.removeEventListener('focus', onFocus);
            input.removeEventListener('blur', onBlur);
            input.removeEventListener('click', onClick);
            input.removeEventListener('keydown', onKeyDown);
            root.innerHTML = '';
        },
    };
    return api;
}
