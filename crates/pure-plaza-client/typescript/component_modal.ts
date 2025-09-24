import { escapeHtml, mustQuerySelector } from "./helpers.js";
import { mountButton } from "./component_button.js";

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalAction {
	label: string;
	onClick?: (e: MouseEvent, api: ModalApi) => void;
}

export interface ModalOptions {
	title?: string;
	contentHtml?: string;
	size?: ModalSize;
	initialOpen?: boolean;
	closeOnEsc?: boolean;
	closeOnBackdrop?: boolean;
	showCloseButton?: boolean;
	classes?: string;
	primaryAction?: ModalAction | null;
	secondaryAction?: ModalAction | null;
	onOpen?: (api: ModalApi) => void;
	onClose?: (api: ModalApi) => void;
}

type ResolvedModalOptions = {
	title: string;
	contentHtml: string;
	size: ModalSize;
	initialOpen: boolean;
	closeOnEsc: boolean;
	closeOnBackdrop: boolean;
	showCloseButton: boolean;
	classes: string;
	primaryAction: ModalAction | null;
	secondaryAction: ModalAction | null;
	onOpen: ((api: ModalApi) => void) | null;
	onClose: ((api: ModalApi) => void) | null;
};

export interface ModalApi {
	open: () => void;
	close: () => void;
	isOpen: () => boolean;
	setTitle: (text: string | number | null | undefined) => void;
	setContent: (htmlOrNode: string | Node | null | undefined) => void;
	setSize: (size: ModalSize) => void;
	setPrimaryAction: (cfgAction: ModalAction | null) => void;
	setSecondaryAction: (cfgAction: ModalAction | null) => void;
	setCloseOnEsc: (val: boolean) => void;
	setCloseOnBackdrop: (val: boolean) => void;
	// NOWE: masowe przełączanie ładowania na przyciskach akcji
	setActionsLoading: (loading: boolean) => void;
	root: HTMLElement;
	overlayEl: HTMLElement;
	dialogEl: HTMLElement;
	contentEl: HTMLElement;
	destroy: () => void;
}

const isModalSize = (v: unknown): v is ModalSize =>
	v === 'sm' || v === 'md' || v === 'lg' || v === 'xl';

export function mountModal(
	selector: string | HTMLElement,
	options: ModalOptions = {}
): ModalApi {
	const root: HTMLElement | null =
		typeof selector === 'string'
			? (document.querySelector(selector) as HTMLElement | null)
			: selector;
	if (!root) {
		throw new Error(`mountModal: no element found for selector "${String(selector)}"`);
	}

	const uid = Math.floor(Math.random() * 1e8);
	const dialogId = `modal-${uid}`;
	const titleId = `${dialogId}-title`;

	const cfg: ResolvedModalOptions = {
		title: options.title ?? 'Modal title',
		contentHtml: options.contentHtml ?? '<p class="text-neutral-300">Your content goes here.</p>',
		size: isModalSize(options.size) ? options.size : 'md',
		initialOpen: !!options.initialOpen,
		closeOnEsc: options.closeOnEsc !== false,
		closeOnBackdrop: options.closeOnBackdrop !== false,
		showCloseButton: options.showCloseButton !== false,
		classes: options.classes || '',
		primaryAction: options.primaryAction ?? null,
		secondaryAction: options.secondaryAction ?? null,
		onOpen: typeof options.onOpen === 'function' ? options.onOpen : null,
		onClose: typeof options.onClose === 'function' ? options.onClose : null,
	};

	const sizeMap: Record<ModalSize, string> = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-2xl',
	};

	root.innerHTML = `
<div class="fixed inset-0 z-50 bg-neutral-950/80 ${cfg.initialOpen ? '' : 'hidden'} overflow-auto" data-role="overlay" aria-hidden="${cfg.initialOpen ? 'false' : 'true'}">
	<div class="w-full p-4 flex items-center justify-center min-h-screen" data-role="backdrop">
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
					<h2 id="${titleId}" class="text-lg font-semibold text-neutral-100">${escapeHtml(cfg.title)}</h2>
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

	const overlayEl = mustQuerySelector<HTMLElement>(root, '[data-role="overlay"]');
	const dialogEl = mustQuerySelector<HTMLElement>(root, '[data-role="dialog"]');
	const contentEl = mustQuerySelector<HTMLElement>(root, '[data-role="content"]');
	const footerEl = mustQuerySelector<HTMLElement>(root, '[data-role="footer"]');
	const closeBtn = root.querySelector<HTMLButtonElement>('[data-role="close"]'); // nie wymagamy już mustQuerySelector

	if (!overlayEl || !dialogEl || !contentEl || !footerEl) {
		throw new Error('mountModal: failed to initialize modal DOM structure.');
	}

	let isOpen = !!cfg.initialOpen;
	let lastFocusedEl: Element | null = null;

	type ButtonAPI = ReturnType<typeof mountButton>;
	let primaryBtnApi: ButtonAPI | null = null;
	let secondaryBtnApi: ButtonAPI | null = null;
	let actionsLoading = false;

	let api!: ModalApi;

	function destroyActionButtons(): void {
		try {
			primaryBtnApi?.destroy?.();
		} catch {}
		try {
			secondaryBtnApi?.destroy?.();
		} catch {}
		primaryBtnApi = null;
		secondaryBtnApi = null;
	}

	function renderActions(): void {
		destroyActionButtons();
		footerEl.innerHTML = '';

		if (cfg.secondaryAction && cfg.secondaryAction.label) {
			const secId = `${dialogId}-btn-secondary-${Math.floor(Math.random() * 1e8)}`;
			const secMount = document.createElement('span');
			secMount.id = secId;
			footerEl.appendChild(secMount);

			secondaryBtnApi = mountButton(`#${secId}`, {
				label: cfg.secondaryAction.label,
				variant: 'secondary',
				size: 'md',
				type: 'button',
				loading: actionsLoading,
				onClick: (e: MouseEvent) => {
					if (typeof cfg.secondaryAction?.onClick === 'function') {
						cfg.secondaryAction.onClick(e, api);
					}
				},
			});
		}

		if (cfg.primaryAction && cfg.primaryAction.label) {
			const priId = `${dialogId}-btn-primary-${Math.floor(Math.random() * 1e8)}`;
			const priMount = document.createElement('span');
			priMount.id = priId;
			footerEl.appendChild(priMount);

			primaryBtnApi = mountButton(`#${priId}`, {
				label: cfg.primaryAction.label,
				variant: 'primary',
				size: 'md',
				type: 'button',
				loading: actionsLoading,
				onClick: (e: MouseEvent) => {
					if (typeof cfg.primaryAction?.onClick === 'function') {
						cfg.primaryAction.onClick(e, api);
					}
				},
			});
		}
	}

	renderActions();

	function getFocusable(): HTMLElement[] {
		const nodes = dialogEl.querySelectorAll(
			'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
		);
		return Array.from(nodes).filter((el): el is HTMLElement => el instanceof HTMLElement);
	}
	function trapTab(e: KeyboardEvent): void {
		if (e.key !== 'Tab') return;

		const focusable = getFocusable();

		if (!focusable.length) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		if (first === null || last === null) return;

		const active = document.activeElement as HTMLElement | null;

		if (e.shiftKey && active === first) {
			e.preventDefault();
			last!.focus();
		} else if (!e.shiftKey && active === last) {
			e.preventDefault();
			first!.focus();
		}
	}

	function open(): void {
		if (isOpen) return;
		isOpen = true;
		lastFocusedEl = document.activeElement;
		overlayEl.classList.remove('hidden');
		overlayEl.setAttribute('aria-hidden', 'false');
		document.documentElement.classList.add('overflow-hidden');

		const focusable = getFocusable();
		const preferred =
			focusable.find(el => el.getAttribute('data-role') === 'close') ||
				(closeBtn as HTMLElement | null) ||
				focusable[0];
		if (preferred) setTimeout(() => preferred.focus(), 0);

		if (cfg.onOpen) {
			try {
				cfg.onOpen(api);
			} catch (e) {
				console.error('mountModal onOpen callback failed:', e);
			}
		}
	}
	function close(): void {
		if (!isOpen) return;
		isOpen = false;
		overlayEl.classList.add('hidden');
		overlayEl.setAttribute('aria-hidden', 'true');
		document.documentElement.classList.remove('overflow-hidden');

		const lf = lastFocusedEl as HTMLElement | null;
		if (lf && typeof lf.focus === 'function') {
			setTimeout(() => lf.focus(), 0);
		}
		if (cfg.onClose) {
			try {
				cfg.onClose(api);
			} catch (e) {
				console.error('mountModal onClose callback failed:', e);
			}
		}
	}

	function onBackdropClick(e: MouseEvent): void {
		if (!cfg.closeOnBackdrop) return;
		const backdrop = overlayEl.querySelector<HTMLElement>('[data-role="backdrop"]');
		if (backdrop && e.target === backdrop) {
			close();
		}
	}
	function onEsc(e: KeyboardEvent): void {
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

	api = {
		open,
		close,
		isOpen: () => isOpen,
		setTitle: (text) => {
			const t = root.querySelector<HTMLElement>(`#${CSS.escape(titleId)}`);
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
			if (!isModalSize(size)) return;
			dialogEl.classList.remove(...Object.values(sizeMap));
			dialogEl.classList.add(sizeMap[size]);
		},
		setPrimaryAction: (cfgAction) => {
			cfg.primaryAction = cfgAction ?? null;
			renderActions();
		},
		setSecondaryAction: (cfgAction) => {
			cfg.secondaryAction = cfgAction ?? null;
			renderActions();
		},
		setCloseOnEsc: (val) => {
			cfg.closeOnEsc = !!val;
		},
		setCloseOnBackdrop: (val) => {
			cfg.closeOnBackdrop = !!val;
		},
		setActionsLoading: (loading: boolean) => {
			actionsLoading = !!loading;
			if (secondaryBtnApi) secondaryBtnApi.setLoading(actionsLoading);
			if (primaryBtnApi) primaryBtnApi.setLoading(actionsLoading);
		},
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
			destroyActionButtons(); // posprzątaj Button API
			root.innerHTML = '';
		},
	};

	if (cfg.initialOpen) open();
	return api;
}
