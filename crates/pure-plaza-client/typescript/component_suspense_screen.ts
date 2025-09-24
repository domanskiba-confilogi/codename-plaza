import { escapeHtml } from "./helpers.js";

interface MountSuspenseScreenOptions {
	message?: string;
	hint?: string | null;
	iconSvg?: string;           // Ikona użyta przy montażu
	fullScreen?: boolean;       // Domyślnie true
	classes?: string;           // Dodatkowe klasy na kontenerze
	defaultIconSvg?: string;    // Fallback dla setIconSvg()
}

interface SuspenseScreenApi {
	setMessage(text: string | null | undefined): void;
	setHint(text: string | null | undefined): void;
	setIconSvg(svg?: string | null): void;
	show(): void;
	hide(): void;
	destroy(): void;
	root: HTMLElement;
	container: HTMLElement;
}

// Minimalny domyślny SVG (spinner)
const DEFAULT_ICON_SVG = `
<svg viewBox="0 0 24 24" width="112" height="112" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.2" stroke-width="4"/>
<path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="4" stroke-linecap="round">
<animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
</path>
</svg>
`;

function mountSuspenseScreen(
	selector: string | HTMLElement,
	options: MountSuspenseScreenOptions = {}
): SuspenseScreenApi {
	const root = typeof selector === 'string'
		? document.querySelector<HTMLElement>(selector)
		: selector;

	if (!root) {
		throw new Error(`mountSuspenseScreen: nie znaleziono elementu dla selektora "${selector}"`);
	}

	const cfg = {
		message: options.message ?? 'Ładowanie...',
		hint: options.hint ?? null as string | null,
		iconSvg: options.iconSvg ?? options.defaultIconSvg ?? DEFAULT_ICON_SVG,
		fullScreen: options.fullScreen !== false,
		classes: options.classes ?? '',
	};

	// Struktura i klasy odzwierciedlają Yew SuspenseScreen
	root.innerHTML = `
<div class="w-full ${cfg.fullScreen ? 'min-h-screen' : ''} flex flex-col gap-4 justify-center items-center z-10 ${cfg.classes}">
	<div class="w-28 z-10" data-role="icon">${cfg.iconSvg}</div>
	<p class="animate-pulse select-none z-10" role="status" aria-live="polite" data-role="message">
		${escapeHtml(String(cfg.message))}
	</p>
	${cfg.hint ? `<span class="text-sm text-neutral-600" data-role="hint">${escapeHtml(String(cfg.hint))}</span>` : ''}
</div>
`;

	const container = root.firstElementChild as HTMLElement | null;
	if (!container) {
		throw new Error('mountSuspenseScreen: nie udało się zbudować kontenera');
	}

	const iconEl = container.querySelector<HTMLElement>('[data-role="icon"]');
	const messageEl = container.querySelector<HTMLElement>('[data-role="message"]');
	let hintEl = container.querySelector<HTMLElement>('[data-role="hint"]') || null;

	if (!iconEl || !messageEl) {
		throw new Error('mountSuspenseScreen: brak wymaganych elementów (icon lub message)');
	}

	// Publiczne API
	return {
		setMessage(text) {
			messageEl.textContent = text != null ? String(text) : '';
		},
		setHint(text) {
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
		setIconSvg(svg) {
			iconEl.innerHTML = svg ?? options.defaultIconSvg ?? DEFAULT_ICON_SVG;
		},
		show() {
			container.classList.remove('hidden');
		},
		hide() {
			container.classList.add('hidden');
		},
		destroy() {
			root.innerHTML = '';
		},
		root,
		container,
	};
}

export { MountSuspenseScreenOptions, SuspenseScreenApi, mountSuspenseScreen };
