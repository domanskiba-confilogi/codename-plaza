/**
 * mountButton: Pure JS + Tailwind button/link component
 * - Supports variants: primary, secondary, success, danger, warning, ghost, outline
 * - Sizes: sm, md, lg
 * - Renders as <a> if href is provided, otherwise as <button>
 * - Leading/trailing icons (SVG strings) + loading spinner
 * - Accessible, keyboard-friendly, returns a small API
 *
 * Dependencies: TailwindCSS
 */

function mountButton(selector, options = {}) {
	const root = document.querySelector(selector);
	if (!root) {
		throw new Error(`mountButton: no element found for selector "${selector}"`);
	}

	const cfg = {
		id: options.id || `btn-${Math.floor(Math.random() * 1e12)}`,
		label: options.label ?? 'Button',
		variant: options.variant || 'primary',
		size: options.size || 'md',
		href: typeof options.href === 'string' ? options.href : null,
		target: options.target || undefined, // e.g., '_blank'
		rel: options.rel || undefined,       // e.g., 'noopener noreferrer'
		block: !!options.block,              // full width button
		rounded: options.rounded || 'md',    // 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
		leadingIconSvg: options.leadingIconSvg || '',
		trailingIconSvg: options.trailingIconSvg || '',
		disabled: !!options.disabled,
		loading: !!options.loading,
		type: options.type || 'button',      // button type if rendered as <button>
		ariaLabel: options.ariaLabel,        // optional aria-label override
		onClick: typeof options.onClick === 'function' ? options.onClick : null,
	};

	// Tailwind class maps (avoid dynamic class names for JIT)
	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-sm',
		lg: 'px-5 py-3 text-base',
	};
	const roundedClasses = {
		none: 'rounded-none',
		sm: 'rounded-sm',
		md: 'rounded-md',
		lg: 'rounded-lg',
		xl: 'rounded-xl',
		full: 'rounded-full',
	};
	const variantClasses = {
		primary: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/25 focus:ring-blue-400/60',
		secondary: 'text-neutral-200 hover:bg-neutral-900 focus:ring-neutral-400/60',
		success: 'bg-green-500/20 text-green-400 hover:bg-green-500/25 focus:ring-green-400/60',
		danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/25 focus:ring-red-400/60',
		warning: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/25 focus:ring-amber-400/60',
		ghost: 'bg-transparent text-neutral-200 hover:bg-neutral-900/60 focus:ring-neutral-400/60',
		outline: 'bg-transparent text-neutral-200 hover:bg-neutral-900 focus:ring-neutral-400/60',
	};
	const BASE =
		'inline-flex items-center gap-2 font-semibold ring-1 ring-inset ring-neutral-800 transition-colors ' +
			'focus:outline-none focus:ring-2 select-none disabled:opacity-50 disabled:cursor-not-allowed';

	// Icons
	const SPINNER_SVG = `
<svg class="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" aria-hidden="true">
<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"></path>
</svg>`.trim();

	// Create element
	const elTag = cfg.href ? 'a' : 'button';
	const el = document.createElement(elTag);
	el.id = cfg.id;
	el.className = composeClassName();
	if (cfg.ariaLabel) el.setAttribute('aria-label', cfg.ariaLabel);

	if (cfg.href) {
		el.setAttribute('href', cfg.href);
		if (cfg.target) el.setAttribute('target', cfg.target);
		if (cfg.rel) el.setAttribute('rel', cfg.rel);
		// When disabled, simulate with aria-disabled + pointer-events-none
		if (cfg.disabled) {
			el.setAttribute('aria-disabled', 'true');
			el.classList.add('pointer-events-none');
		}
	} else {
		el.setAttribute('type', cfg.type);
		el.disabled = !!cfg.disabled;
	}

	// Inner structure: [leadingIcon] [label] [trailingIcon]
	const leading = document.createElement('span');
	leading.className = 'inline-flex items-center justify-center';
	const label = document.createElement('span');
	label.className = 'inline-block';
	const trailing = document.createElement('span');
	trailing.className = 'inline-flex items-center justify-center';

	label.textContent = cfg.label;

	// Initial icons
	if (cfg.loading) {
		leading.innerHTML = SPINNER_SVG;
	} else if (cfg.leadingIconSvg) {
		leading.innerHTML = cfg.leadingIconSvg;
	}
	if (cfg.trailingIconSvg) {
		trailing.innerHTML = cfg.trailingIconSvg;
	}

	// Only append icon containers if they have content
	if (leading.innerHTML.trim().length) el.appendChild(leading);
	el.appendChild(label);
	if (trailing.innerHTML.trim().length) el.appendChild(trailing);

	// Click handling
	function onClick(e) {
		if (state.disabled || state.loading) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		if (typeof cfg.onClick === 'function') {
			cfg.onClick(e);
		}
	}
	el.addEventListener('click', onClick);

	// Keyboard handling for anchor without href (role=button)
	if (elTag === 'a' && !cfg.href) {
		el.setAttribute('role', 'button');
		el.setAttribute('tabindex', '0');
		el.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				el.click();
			}
		});
	}

	// Mount into root
	root.innerHTML = '';
	root.appendChild(el);

	// Component state
	const state = {
		variant: cfg.variant,
		size: cfg.size,
		rounded: cfg.rounded,
		block: cfg.block,
		disabled: cfg.disabled,
		loading: cfg.loading,
		href: cfg.href,
		label: cfg.label,
		leadingIconSvg: cfg.leadingIconSvg,
		trailingIconSvg: cfg.trailingIconSvg,
	};

	// Helpers
	function composeClassName() {
		const v = variantClasses[cfg.variant] || variantClasses.primary;
		const s = sizeClasses[cfg.size] || sizeClasses.md;
		const r = roundedClasses[cfg.rounded] || roundedClasses.md;
		const w = cfg.block ? 'w-full justify-center' : '';
		// outline variant should keep ring visible; others already have base ring
		// All variants share the base ring to match your snippet
		return [BASE, v, s, r, w].join(' ').trim();
	}

	function refreshClasses() {
		cfg.variant = state.variant;
		cfg.size = state.size;
		cfg.rounded = state.rounded;
		cfg.block = state.block;
		el.className = composeClassName();
		// Disabled visual for anchor
		if (elTag === 'a') {
			if (state.disabled || state.loading) {
				el.classList.add('pointer-events-none');
				el.setAttribute('aria-disabled', 'true');
			} else {
				el.classList.remove('pointer-events-none');
				el.removeAttribute('aria-disabled');
			}
		}
	}

	function renderIcons() {
		// Clear containers
		leading.innerHTML = '';
		trailing.innerHTML = '';
		// Decide leading content
		if (state.loading) {
			leading.innerHTML = SPINNER_SVG;
		} else if (state.leadingIconSvg) {
			leading.innerHTML = state.leadingIconSvg;
		}
		if (state.trailingIconSvg) {
			trailing.innerHTML = state.trailingIconSvg;
		}
		// Ensure elements are attached/detached cleanly
		// Remove existing children
		el.innerHTML = '';
		if (leading.innerHTML.trim().length) el.appendChild(leading);
		el.appendChild(label);
		if (trailing.innerHTML.trim().length) el.appendChild(trailing);
	}

	// Public API
	const api = {
		root,
		el,
		focus: () => el.focus(),
		click: () => el.click(),
		setLabel: (next) => {
			state.label = String(next ?? '');
			label.textContent = state.label;
		},
		setVariant: (variant) => {
			if (!variantClasses[variant]) return;
			state.variant = variant;
			refreshClasses();
		},
		setSize: (size) => {
			if (!sizeClasses[size]) return;
			state.size = size;
			refreshClasses();
		},
		setRounded: (rounded) => {
			if (!roundedClasses[rounded]) return;
			state.rounded = rounded;
			refreshClasses();
		},
		setBlock: (block) => {
			state.block = !!block;
			refreshClasses();
		},
		setDisabled: (disabled) => {
			state.disabled = !!disabled;
			if (elTag === 'button') {
				el.disabled = state.disabled;
			}
			refreshClasses();
		},
		setLoading: (loading) => {
			state.loading = !!loading;
			if (elTag === 'button') {
				el.disabled = state.loading || state.disabled;
			}
			renderIcons();
			refreshClasses();
		},
		setHref: (href, target, rel) => {
			state.href = typeof href === 'string' ? href : null;
			if (elTag === 'button') {
				// Rebuild as anchor
				const parent = el.parentElement;
				const idx = Array.prototype.indexOf.call(parent.childNodes, el);
				el.removeEventListener('click', onClick);
				const newNode = document.createElement('a');
				copyAttributes(el, newNode);
				newNode.id = el.id;
				newNode.className = el.className;
				newNode.append(...Array.from(el.childNodes));
				if (state.href) newNode.setAttribute('href', state.href);
				if (target) newNode.setAttribute('target', target);
				if (rel) newNode.setAttribute('rel', rel);
				newNode.addEventListener('click', onClick);
				parent.replaceChild(newNode, el);
				api.el = newNode;
			} else {
				// Same anchor element
				const a = el;
				if (state.href) {
					a.setAttribute('href', state.href);
				} else {
					a.removeAttribute('href');
				}
				if (target) a.setAttribute('target', target);
				if (rel) a.setAttribute('rel', rel);
			}
			refreshClasses();
		},
		setIcons: ({ leading: leadSvg, trailing: trailSvg }) => {
			state.leadingIconSvg = leadSvg || '';
			state.trailingIconSvg = trailSvg || '';
			renderIcons();
		},
		on: (eventName, handler) => {
			if (typeof handler !== 'function') return () => {};
			el.addEventListener(eventName, handler);
			return () => el.removeEventListener(eventName, handler);
		},
		destroy: () => {
			el.removeEventListener('click', onClick);
			root.innerHTML = '';
		},
		// Expose state snapshot
		getState: () => ({ ...state }),
	};

	return api;

	// Utils
	function copyAttributes(from, to) {
		for (const { name, value } of Array.from(from.attributes)) {
			if (name === 'type') continue; // switching to anchor
			to.setAttribute(name, value);
		}
	}
}

