type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonRounded = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
type ButtonType = 'button' | 'submit' | 'reset';

export interface MountButtonOptions {
	id?: string;
	label?: string;
	variant?: ButtonVariant;
	size?: ButtonSize;
	href?: string | null;
	target?: string;
	rel?: string;
	block?: boolean;
	rounded?: ButtonRounded;
	leadingIconSvg?: string;
	trailingIconSvg?: string;
	disabled?: boolean;
	loading?: boolean;
	type?: ButtonType;
	ariaLabel?: string;
	onClick?: (e: MouseEvent) => void;
}

export interface ButtonState {
	variant: ButtonVariant;
	size: ButtonSize;
	rounded: ButtonRounded;
	block: boolean;
	disabled: boolean;
	loading: boolean;
	href: string | null;
	label: string;
	leadingIconSvg: string;
	trailingIconSvg: string;
}

type BtnEl = HTMLButtonElement | HTMLAnchorElement;

export interface ButtonAPI {
	root: Element;
	el: BtnEl;
	focus: () => void;
	click: () => void;
	setLabel: (next: string) => void;
	setVariant: (variant: ButtonVariant) => void;
	setSize: (size: ButtonSize) => void;
	setRounded: (rounded: ButtonRounded) => void;
	setBlock: (block: boolean) => void;
	setDisabled: (disabled: boolean) => void;
	setLoading: (loading: boolean) => void;
	setHref: (href?: string | null, target?: string, rel?: string) => void;
	setIcons: (icons: { leading?: string; trailing?: string }) => void;
	on: <K extends keyof HTMLElementEventMap>(
		eventName: K,
		handler: (e: HTMLElementEventMap[K]) => void
	) => () => void;
	destroy: () => void;
	getState: () => ButtonState;
}

export function mountButton(selector: string, options: MountButtonOptions = {}): ButtonAPI {
	const root = document.querySelector(selector);
	if (!root) {
		throw new Error(`mountButton: no element found for selector "${selector}"`);
	}

	const cfg = {
		id: options.id ?? `btn-${Math.floor(Math.random() * 1e12)}`,
		label: options.label ?? 'Button',
		variant: options.variant ?? 'primary',
		size: options.size ?? 'md',
		href: typeof options.href === 'string' ? options.href : null,
		target: options.target,
		rel: options.rel,
		block: !!options.block,
		rounded: options.rounded ?? 'md',
		leadingIconSvg: options.leadingIconSvg ?? '',
		trailingIconSvg: options.trailingIconSvg ?? '',
		disabled: !!options.disabled,
		loading: !!options.loading,
		type: options.type ?? 'button',
		ariaLabel: options.ariaLabel,
		onClick: typeof options.onClick === 'function' ? options.onClick : undefined,
	};

	const sizeClasses: Record<ButtonSize, string> = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-sm',
		lg: 'px-5 py-3 text-base',
	};

	const roundedClasses: Record<ButtonRounded, string> = {
		none: 'rounded-none',
		sm: 'rounded-sm',
		md: 'rounded-md',
		lg: 'rounded-lg',
		xl: 'rounded-xl',
		full: 'rounded-full',
	};

	const variantClasses: Record<ButtonVariant, string> = {
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

	const SPINNER_SVG = `
<svg class="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" aria-hidden="true">
<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"></path>
</svg>`.trim();

	// Initial element
	let el: BtnEl = cfg.href ? document.createElement('a') : document.createElement('button');
	el.id = cfg.id;

	const state: ButtonState = {
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

	const leading = document.createElement('span');
	leading.className = 'inline-flex items-center justify-center';
	const label = document.createElement('span');
	label.className = 'inline-block';
	const trailing = document.createElement('span');
	trailing.className = 'inline-flex items-center justify-center';
	label.textContent = state.label;

	function isAnchor(node: BtnEl): node is HTMLAnchorElement {
		return node.tagName === 'A';
	}

	function composeClassName(): string {
		const v = variantClasses[state.variant] ?? variantClasses.primary;
		const s = sizeClasses[state.size] ?? sizeClasses.md;
		const r = roundedClasses[state.rounded] ?? roundedClasses.md;
		const w = state.block ? 'w-full justify-center' : '';
		return [BASE, v, s, r, w].join(' ').trim();
	}

	function applyAriaAndDisabled() {
		if (isAnchor(el)) {
			if (state.disabled || state.loading) {
				el.setAttribute('aria-disabled', 'true');
				el.classList.add('pointer-events-none');
			} else {
				el.removeAttribute('aria-disabled');
				el.classList.remove('pointer-events-none');
			}
		} else {
			el.disabled = !!(state.disabled || state.loading);
		}
	}

	function refreshClasses() {
		el.className = composeClassName();
		applyAriaAndDisabled();
	}

	function renderIcons() {
		// Clear containers
		leading.innerHTML = '';
		trailing.innerHTML = '';

		if (state.loading) {
			leading.innerHTML = SPINNER_SVG;
		} else if (state.leadingIconSvg) {
			leading.innerHTML = state.leadingIconSvg;
		}
		if (state.trailingIconSvg) {
			trailing.innerHTML = state.trailingIconSvg;
		}

		// Rebuild children
		el.innerHTML = '';
		if (leading.innerHTML.trim().length) el.appendChild(leading);
		el.appendChild(label);
		if (trailing.innerHTML.trim().length) el.appendChild(trailing);
	}

	function onClick(e: MouseEvent) {
		if (state.disabled || state.loading) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		if (typeof cfg.onClick === 'function') {
			cfg.onClick(e);
		}
	}

	// Initialize attributes
	if (cfg.ariaLabel) el.setAttribute('aria-label', cfg.ariaLabel);

	if (isAnchor(el)) {
		if (cfg.href) el.setAttribute('href', cfg.href);
		if (cfg.target) el.setAttribute('target', cfg.target);
		if (cfg.rel) el.setAttribute('rel', cfg.rel);
	} else {
		el.setAttribute('type', cfg.type);
		(el as HTMLButtonElement).disabled = !!cfg.disabled;
	}

	// Initial content
	if (cfg.loading) {
		leading.innerHTML = SPINNER_SVG;
	} else if (cfg.leadingIconSvg) {
		leading.innerHTML = cfg.leadingIconSvg;
	}
	if (cfg.trailingIconSvg) {
		trailing.innerHTML = cfg.trailingIconSvg;
	}

	if (leading.innerHTML.trim().length) el.appendChild(leading);
	el.appendChild(label);
	if (trailing.innerHTML.trim().length) el.appendChild(trailing);

	el.className = composeClassName();
	applyAriaAndDisabled();

	el.addEventListener('click', onClick as EventListener);

	// Optional keyboard handling for anchor without href (role=button style)
	if (isAnchor(el) && !cfg.href) {
		el.setAttribute('role', 'button');
		el.setAttribute('tabindex', '0');
		el.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				el.click();
			}
		});
	}

	// Mount
	root.innerHTML = '';
	root.appendChild(el);

	function copyAttributes(from: Element, to: Element) {
		for (const { name, value } of Array.from(from.attributes)) {
			if (name === 'type' || name === 'disabled') continue; // not applicable to <a>
			to.setAttribute(name, value);
		}
	}

	const api: ButtonAPI = {
		root,
		el,
		focus: () => el.focus(),
		click: () => el.click(),
		setLabel: (next: string) => {
			state.label = String(next ?? '');
			label.textContent = state.label;
		},
		setVariant: (variant: ButtonVariant) => {
			if (!variantClasses[variant]) return;
			state.variant = variant;
			refreshClasses();
		},
		setSize: (size: ButtonSize) => {
			if (!sizeClasses[size]) return;
			state.size = size;
			refreshClasses();
		},
		setRounded: (rounded: ButtonRounded) => {
			if (!roundedClasses[rounded]) return;
			state.rounded = rounded;
			refreshClasses();
		},
		setBlock: (block: boolean) => {
			state.block = !!block;
			refreshClasses();
		},
		setDisabled: (disabled: boolean) => {
			state.disabled = !!disabled;
			applyAriaAndDisabled();
			refreshClasses();
		},
		setLoading: (loading: boolean) => {
			state.loading = !!loading;
			applyAriaAndDisabled();
			renderIcons();
			refreshClasses();
		},
		setHref: (href?: string | null, target?: string, rel?: string) => {
			state.href = typeof href === 'string' ? href : null;

			if (!isAnchor(el)) {
				// Rebuild as anchor only if href is provided
				if (state.href) {
					const parent = el.parentElement;
					const newNode = document.createElement('a');
					copyAttributes(el, newNode);
					newNode.id = el.id;
					newNode.className = el.className;

					// move children
					while (el.firstChild) {
						newNode.appendChild(el.firstChild);
					}

					newNode.addEventListener('click', onClick);

					newNode.setAttribute('href', state.href);
					if (target) newNode.setAttribute('target', target);
					if (rel) newNode.setAttribute('rel', rel);

					el.removeEventListener('click', onClick);

					if (parent) {
						parent.replaceChild(newNode, el);
					}
					el = newNode;
					api.el = el;
				} else {
					// keep as button when href is null/undefined
					// just refresh disabled state and classes
				}
			} else {
				// Same anchor element; add/remove href + target/rel
				if (state.href) {
					el.setAttribute('href', state.href);
				} else {
					el.removeAttribute('href');
				}
				if (target) el.setAttribute('target', target);
				if (rel) el.setAttribute('rel', rel);
			}
			refreshClasses();
		},
		setIcons: ({ leading: leadSvg, trailing: trailSvg }: { leading?: string; trailing?: string }) => {
			state.leadingIconSvg = leadSvg || '';
			state.trailingIconSvg = trailSvg || '';
			renderIcons();
		},
		on: <K extends keyof HTMLElementEventMap>(
			eventName: K,
			handler: (e: HTMLElementEventMap[K]) => void
		) => {
			if (typeof handler !== 'function') return () => {};
			el.addEventListener(eventName, handler as EventListener);
			return () => el.removeEventListener(eventName, handler as EventListener);
		},
		destroy: () => {
			el.removeEventListener('click', onClick as EventListener);
			root.innerHTML = '';
		},
		getState: () => ({ ...state }),
	};

	return api;
}
