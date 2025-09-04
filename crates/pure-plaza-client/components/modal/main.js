function mountModal(selector, options = {}) {
	const root = typeof selector === 'string' ? document.querySelector(selector) : selector;
	if (!root) throw new Error(`mountModal: no element found for selector "${selector}"`);

	// Local safe-escape for text content (title, buttons). Content HTML is treated as trusted.
	const esc = (str) => String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));

	// Generate ids
	const uid = Math.floor(Math.random() * 1e8);
	const dialogId = `modal-${uid}`;
	const titleId = `${dialogId}-title`;

	// Defaults
	const cfg = {
		title: options.title ?? 'Modal title',
		contentHtml: options.contentHtml ?? '<p class="text-neutral-300">Your content goes here.</p>',
		size: ['sm','md','lg','xl'].includes(options.size) ? options.size : 'md',
		initialOpen: !!options.initialOpen,
		closeOnEsc: options.closeOnEsc !== false,
		closeOnBackdrop: options.closeOnBackdrop !== false,
		showCloseButton: options.showCloseButton !== false,
		classes: options.classes || '',
		// Actions
		primaryAction: options.primaryAction || null, // { label, onClick }
		secondaryAction: options.secondaryAction || null, // { label, onClick }
		// Events
		onOpen: typeof options.onOpen === 'function' ? options.onOpen : null,
		onClose: typeof options.onClose === 'function' ? options.onClose : null,
	};

	const sizeMap = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-2xl',
	};

	// Render
	root.innerHTML = `
<div class="fixed inset-0 z-50 ${cfg.initialOpen ? '' : 'hidden'}" data-role="overlay" aria-hidden="${cfg.initialOpen ? 'false' : 'true'}">
	<div class="absolute inset-0 bg-neutral-950/80 backdrop-blur"></div>

	<div class="relative w-full p-4 flex items-center justify-center min-h-screen" data-role="backdrop">
		<div
			id="${dialogId}"
			class="w-full ${sizeMap[cfg.size]} ${cfg.classes}"
			role="dialog"
			aria-modal="true"
			aria-labelledby="${titleId}"
			data-role="dialog"
		>
			<div class="bg-neutral-900/60 ring-1 ring-neutral-800 rounded-2xl shadow-lg overflow-hidden">
				<div class="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
					<h2 id="${titleId}" class="text-lg font-semibold text-neutral-100">${esc(cfg.title)}</h2>
					${cfg.showCloseButton ? `
					<button type="button" data-role="close"
						class="inline-flex items-center justify-center rounded-md p-2 text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
						aria-label="Close">
						<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"></path>
						</svg>
					</button>
					` : ''}
				</div>

				<div class="px-6 py-4" data-role="content">${cfg.contentHtml}</div>

				<div class="px-6 py-4 border-t border-neutral-800 flex items-center justify-end gap-2" data-role="footer"></div>
			</div>
		</div>
	</div>
</div>
`;

	// DOM refs
	const overlayEl = root.querySelector('[data-role="overlay"]');
	const dialogEl = root.querySelector('[data-role="dialog"]');
	const contentEl = root.querySelector('[data-role="content"]');
	const footerEl = root.querySelector('[data-role="footer"]');
	const closeBtn = root.querySelector('[data-role="close"]');

	// Internal state
	let isOpen = !!cfg.initialOpen;
	let lastFocusedEl = null;

	// Helpers: actions
	function renderActions() {
		footerEl.innerHTML = '';

		const baseBtn = 'inline-flex items-center gap-2 font-semibold ring-1 ring-inset ring-neutral-800 transition-colors focus:outline-none focus:ring-2 select-none disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm';
		const secondaryBtnCls = `${baseBtn} bg-transparent text-neutral-200 hover:bg-neutral-900/60 focus:ring-neutral-400/60 px-3 py-1.5`;
		const primaryBtnCls = `${baseBtn} bg-blue-500/20 text-blue-400 hover:bg-blue-500/25 focus:ring-blue-400/60 px-4 py-2`;

		if (cfg.secondaryAction && cfg.secondaryAction.label) {
			const b = document.createElement('button');
			b.type = 'button';
			b.className = secondaryBtnCls;
			b.textContent = cfg.secondaryAction.label;
			b.addEventListener('click', (e) => {
				if (typeof cfg.secondaryAction.onClick === 'function') cfg.secondaryAction.onClick(e, api);
			});
			footerEl.appendChild(b);
		}

		if (cfg.primaryAction && cfg.primaryAction.label) {
			const b = document.createElement('button');
			b.type = 'button';
			b.className = primaryBtnCls;
			b.textContent = cfg.primaryAction.label;
			b.addEventListener('click', (e) => {
				if (typeof cfg.primaryAction.onClick === 'function') cfg.primaryAction.onClick(e, api);
			});
			footerEl.appendChild(b);
		}
	}
	renderActions();

	// Focus management
	function getFocusable() {
		return dialogEl.querySelectorAll(
			'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
		);
	}
	function trapTab(e) {
		if (e.key !== 'Tab') return;
		const focusable = Array.from(getFocusable());
		if (!focusable.length) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const active = document.activeElement;

		if (e.shiftKey && active === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && active === last) {
			e.preventDefault();
			first.focus();
		}
	}

	// Open/Close
	function open() {
		if (isOpen) return;
		isOpen = true;
		lastFocusedEl = document.activeElement;
		overlayEl.classList.remove('hidden');
		overlayEl.setAttribute('aria-hidden', 'false');
		document.documentElement.classList.add('overflow-hidden');

		// Focus first focusable or close button
		const focusable = Array.from(getFocusable());
		const preferred = focusable.find(el => el.getAttribute('data-role') === 'close') || focusable[0];
		if (preferred) setTimeout(() => preferred.focus(), 0);

		if (cfg.onOpen) {
			try { cfg.onOpen(api); } catch (e) { console.error('mountModal onOpen callback failed:', e); }
		}
	}
	function close() {
		if (!isOpen) return;
		isOpen = false;
		overlayEl.classList.add('hidden');
		overlayEl.setAttribute('aria-hidden', 'true');
		document.documentElement.classList.remove('overflow-hidden');

		// Restore focus
		if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
			setTimeout(() => lastFocusedEl.focus(), 0);
		}
		if (cfg.onClose) {
			try { cfg.onClose(api); } catch (e) { console.error('mountModal onClose callback failed:', e); }
		}
	}

	// Event handlers
	function onBackdropClick(e) {
		if (!cfg.closeOnBackdrop) return;
		// Close only when clicking on the transparent backdrop (not inside the panel)
		const backdrop = overlayEl.querySelector('[data-role="backdrop"]');
		if (e.target === backdrop) {
			close();
		}
	}
	function onEsc(e) {
		if (!cfg.closeOnEsc) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		}
	}

	overlayEl.addEventListener('click', onBackdropClick);
	document.addEventListener('keydown', onEsc);
	dialogEl.addEventListener('keydown', trapTab);
	if (closeBtn) closeBtn.addEventListener('click', close);

	// API
	const api = {
		open,
		close,
		isOpen: () => isOpen,
		setTitle: (text) => {
			const t = root.querySelector(`#${CSS.escape(titleId)}`);
			if (t) t.textContent = text != null ? String(text) : '';
		},
		setContent: (htmlOrNode) => {
			if (htmlOrNode instanceof Node) {
				contentEl.innerHTML = '';
				contentEl.appendChild(htmlOrNode);
			} else {
				contentEl.innerHTML = htmlOrNode != null ? String(htmlOrNode) : '';
			}
		},
		setSize: (size) => {
			const s = ['sm','md','lg','xl'].includes(size) ? size : null;
			if (!s) return;
			dialogEl.classList.remove(...Object.values(sizeMap));
			dialogEl.classList.add(sizeMap[s]);
		},
		setPrimaryAction: (cfgAction) => {
			cfg.primaryAction = cfgAction || null;
			renderActions();
		},
		setSecondaryAction: (cfgAction) => {
			cfg.secondaryAction = cfgAction || null;
			renderActions();
		},
		setCloseOnEsc: (val) => { cfg.closeOnEsc = !!val; },
		setCloseOnBackdrop: (val) => { cfg.closeOnBackdrop = !!val; },
		root,
		overlayEl,
		dialogEl,
		contentEl,
		destroy: () => {
			overlayEl.removeEventListener('click', onBackdropClick);
			document.removeEventListener('keydown', onEsc);
			dialogEl.removeEventListener('keydown', trapTab);
			if (closeBtn) closeBtn.removeEventListener('click', close);
			document.documentElement.classList.remove('overflow-hidden');
			root.innerHTML = '';
		},
	};

	if (cfg.initialOpen) open();
	return api;
}
