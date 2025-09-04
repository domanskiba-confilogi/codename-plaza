function mountSuspenseScreen(selector, options = {}) {
	const root = typeof selector === 'string' ? document.querySelector(selector) : selector;
	if (!root) {
		throw new Error(`mountSuspenseScreen: nie znaleziono elementu dla selektora "${selector}"`);
	}

	const cfg = {
		message: options.message || 'Ładowanie...',
		hint: options.hint ?? null,
		iconSvg: options.iconSvg || CONFILOGI_ICON_SVG,
		fullScreen: options.fullScreen !== false,
		classes: options.classes || '',
	};

	// Struktura i klasy odzwierciedlają Yew SuspenseScreen
	root.innerHTML = `
<div class="w-full ${cfg.fullScreen ? 'min-h-screen' : ''} flex flex-col gap-4 justify-center items-center z-10 ${cfg.classes}">
	<div class="w-28 z-10" data-role="icon">${cfg.iconSvg}</div>
	<p class="animate-pulse select-none z-10" role="status" aria-live="polite" data-role="message">
		${escapeHtml(cfg.message)}
	</p>
	${cfg.hint ? `<span class="text-sm text-neutral-600" data-role="hint">${escapeHtml(cfg.hint)}</span>` : ''}
</div>
`;

	const container = root.firstElementChild;
	const iconEl = container.querySelector('[data-role="icon"]');
	const messageEl = container.querySelector('[data-role="message"]');
	let hintEl = container.querySelector('[data-role="hint"]');

	// Publiczne API – podobnie jak w mountSelectField
	return {
		setMessage: (text) => {
			messageEl.textContent = text != null ? String(text) : '';
		},
		setHint: (text) => {
			if (text == null || text === '') {
				if (hintEl) {
					hintEl.remove();
					hintEl = null;
				}
			} else {
				if (!hintEl) {
					hintEl = document.createElement('span');
					hintEl.className = 'text-sm text-neutral-600';
					hintEl.setAttribute('data-role', 'hint');
					container.appendChild(hintEl);
				}
				hintEl.textContent = String(text);
			}
		},
		setIconSvg: (svg) => {
			iconEl.innerHTML = svg || DEFAULT_ICON_SVG;
		},
		show: () => {
			container.classList.remove('hidden');
		},
		hide: () => {
			container.classList.add('hidden');
		},
		destroy: () => {
			root.innerHTML = '';
		},
		root,
		container,
	};
}
