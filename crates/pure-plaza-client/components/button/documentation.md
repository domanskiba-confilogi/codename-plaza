# mountButton — dokumentacja

Lekki, czysty (pure) JavaScriptowy komponent przycisku/linku z gotowymi wariantami Tailwind, rozmiarami i obsługą ikon. Renderuje się jako <button> lub <a>, jest dostępny (ARIA), klawiaturowo przyjazny i zwraca prosty, użyteczny API.

- Wymaga: Tailwind CSS (klasy wbudowane, bez dynamicznych nazw)
- Funkcje:
  - Warianty: primary, secondary, success, danger, warning, ghost, outline
  - Rozmiary: sm, md, lg
  - Kształt: rounded: none | sm | md | lg | xl | full
  - Tryb blokowy (full width)
  - Ikony wiodąca/końcowa (SVG string) i spinner w trybie loading
  - Render jako <a> (gdy podasz href) lub <button>
  - Obsługa disabled i loading (również dla <a> z aria-disabled)
  - Prosty API: metody set*, on, destroy, getState, itd.

---

## Szybki start

HTML:
```html
<div id="cta"></div>
```

JS:
```js
const btn = mountButton('#cta', {
  label: 'Wyślij',
  variant: 'primary',
  size: 'md',
  onClick: () => console.log('Klik!'),
});

// Zmiana stanu po czasie
setTimeout(() => btn.setLoading(true), 1000);
```

---

## Opcje (constructor/options)

Funkcja:
```js
const api = mountButton(selector, options?);
```

- selector: string — CSS selektor kontenera, do którego komponent zostanie zamontowany (wewnątrz podmienia innerHTML na przycisk/link).
- options: obiekt konfiguracyjny.

Proponowany typ (TS, orientacyjnie):
```ts
type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';
type Rounded = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ButtonOptions {
  id?: string;                 // domyślnie: "btn-{losowy}"
  label?: string;              // domyślnie: "Button"
  ariaLabel?: string;          // opcjonalny override aria-label
  variant?: Variant;           // domyślnie: "primary"
  size?: Size;                 // domyślnie: "md"
  rounded?: Rounded;           // domyślnie: "md"
  block?: boolean;             // domyślnie: false (w-full + justify-center gdy true)
  href?: string | null;        // jeśli ustawione, renderuje <a>
  target?: string;             // np. "_blank"
  rel?: string;                // np. "noopener noreferrer"
  type?: 'button' | 'submit' | 'reset'; // tylko dla <button>, domyślnie "button"
  disabled?: boolean;          // domyślnie: false
  loading?: boolean;           // domyślnie: false
  leadingIconSvg?: string;     // SVG jako string
  trailingIconSvg?: string;    // SVG jako string
  onClick?: (ev: MouseEvent) => void; // handler kliknięcia
}
```

Zachowanie:
- Jeśli href jest stringiem → render jako <a>.
- W przeciwnym razie → render jako <button>.
- Dla <a> w stanie disabled/loading ustawiane są aria-disabled + pointer-events-none.
- Dla <button> w stanie disabled/loading ustawiane jest el.disabled.

Błędy:
- Jeśli selector nie pasuje do żadnego elementu — rzuca Error.

---

## Publiczne API

```ts
interface ButtonAPI {
  root: HTMLElement;                    // kontener, do którego zamontowano
  el: HTMLButtonElement | HTMLAnchorElement; // aktualny element UI
  focus(): void;
  click(): void;
  setLabel(next: string): void;
  setVariant(variant: Variant): void;
  setSize(size: Size): void;
  setRounded(rounded: Rounded): void;
  setBlock(block: boolean): void;
  setDisabled(disabled: boolean): void;
  setLoading(loading: boolean): void;
  setHref(href?: string | null, target?: string, rel?: string): void;
  setIcons(args: { leading?: string; trailing?: string }): void;
  on(eventName: string, handler: EventListener): () => void; // zwraca unsubscribe
  destroy(): void;                         // odmontowanie komponentu
  getState(): {
    variant: Variant;
    size: Size;
    rounded: Rounded;
    block: boolean;
    disabled: boolean;
    loading: boolean;
    href: string | null;
    label: string;
    leadingIconSvg: string;
    trailingIconSvg: string;
  };
}
```

Uwagi:
- on(eventName, handler) pozwala podpiąć dowolne zdarzenie DOM (np. focus, blur, mouseenter). Zwraca funkcję, która wypina handler.
- setIcons podmienia surowe SVG (string) dla ikon wiodącej/końcowej.
- setLoading(true) wymusza spinner po lewej (leading), zastępując ewentualną ikonę wiodącą.

---

## Warianty, rozmiary, kształt

- Rozmiary:
  - sm: px-3 py-1.5 text-sm
  - md: px-4 py-2 text-sm
  - lg: px-5 py-3 text-base

- Kształt (rounded):
  - none, sm, md, lg, xl, full

- Warianty (kolory/focus ring):
  - primary: bg-blue-500/20 text-blue-400 hover:bg-blue-500/25 focus:ring-blue-400/60
  - secondary: text-neutral-200 hover:bg-neutral-900 focus:ring-neutral-400/60
  - success: bg-green-500/20 text-green-400 hover:bg-green-500/25 focus:ring-green-400/60
  - danger: bg-red-500/20 text-red-400 hover:bg-red-500/25 focus:ring-red-400/60
  - warning: bg-amber-500/20 text-amber-400 hover:bg-amber-500/25 focus:ring-amber-400/60
  - ghost: bg-transparent text-neutral-200 hover:bg-neutral-900/60 focus:ring-neutral-400/60
  - outline: bg-transparent text-neutral-200 hover:bg-neutral-900 focus:ring-neutral-400/60

Wspólna baza klas:
- inline-flex items-center gap-2 font-semibold ring-1 ring-inset ring-neutral-800 transition-colors
- focus:outline-none focus:ring-2 select-none
- disabled:opacity-50 disabled:cursor-not-allowed
- Dodatkowo przy block=true: w-full justify-center

---

## Ikony i stan ładowania

- leadingIconSvg i trailingIconSvg przyjmują surowy string SVG (np. '<svg ...>...</svg>').
- loading=true wyświetla wiodący spinner (zastępuje leadingIconSvg).
- Ikonowe kontenery pojawiają się tylko, gdy mają zawartość (brak pustych spanów).

Przykład ikony:
```js
const ICON_SEND = `
<svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor" aria-hidden="true">
  <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
</svg>`;

const api = mountButton('#slot', {
  label: 'Wyślij',
  leadingIconSvg: ICON_SEND,
});
```

---

## Dostępność (A11y)

- aria-label: możesz nadpisać za pomocą options.ariaLabel (inaczej używana jest treść etykiety).
- Focus ring: dostępny przez focus:ring-* klasy Tailwind.
- Role/klawiatura:
  - <button> jest klawiaturowo dostępny natywnie.
  - <a>: gdy posiada href, zachowuje się jak link; w stanie disabled/loading — aria-disabled="true" + pointer-events-none (klik blokowany także w handlerze).
- Kontrast/kolorystyka zależne od Twojej palety Tailwind (klasy presetowane).

---

## Zdarzenia

- onClick: handler przekazany w options.onClick
- Dodatkowe zdarzenia przez api.on(eventName, handler)
  - Przykład: blur, focus, mouseenter, keydown, itp.
  - Zwrócona funkcja służy do odpięcia handlera.

---

## Przykłady użycia

1) Prosty przycisk (button)
```js
const api = mountButton('#btn1', {
  label: 'Zapisz',
  variant: 'success',
  size: 'md',
  onClick: () => console.log('Zapisano'),
});
```

2) Link otwierany w nowej karcie
```js
mountButton('#btn2', {
  label: 'Dokumentacja',
  href: 'https://example.com/docs',
  target: '_blank',
  rel: 'noopener noreferrer',
  variant: 'outline',
  size: 'sm',
});
```

3) Pełna szerokość i zaokrąglenie
```js
mountButton('#btn3', {
  label: 'Kontynuuj',
  block: true,
  rounded: 'full',
  variant: 'primary',
  size: 'lg',
});
```

4) Loading + blokada interakcji
```js
const api = mountButton('#btn4', {
  label: 'Wysyłanie',
  loading: true,
  variant: 'warning',
});
setTimeout(() => api.setLoading(false), 1500);
```

5) Dynamiczna zmiana wariantów i ikon
```js
const api = mountButton('#btn5', {
  label: 'Usuń',
  variant: 'danger',
});
api.setIcons({
  leading: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v2H6z"/></svg>',
});
api.setVariant('secondary');
```

6) Podmiana na link w locie
```js
const api = mountButton('#btn6', { label: 'Przejdź' });
// ...
api.setHref('/konto', '_self', 'noopener');
```

7) Słuchanie zdarzeń
```js
const api = mountButton('#btn7', { label: 'Fokus' });
const off = api.on('focus', () => console.log('focus!'));
setTimeout(off, 5000); // odpinamy po 5s
```

---

## Wskazówki integracyjne i personalizacja

- Ikony: Podawaj kompletne, samowystarczalne SVG (z atrybutami viewBox, aria-hidden="true" jeśli dekoracyjne). Kolor dziedziczy z text-current / text-*, więc ikona wpisze się w kolorystykę wariantu.
- target="_blank": zawsze dodawaj rel="noopener noreferrer" z uwagi na bezpieczeństwo.
- Styl globalny: klasy focus:ring-* są użyte; jeśli stosujesz reset, nie wycinaj outline/focus stylów, by zachować dostępność.

---

## Znane ograniczenia i uwagi

- Zmiana <button> → <a> przez api.setHref:
  - Komponent próbuje przebudować element na <a>. W obecnej implementacji wewnętrzna referencja używana przez niektóre metody nadal wskazuje na oryginalny węzeł, co może prowadzić do niespójności po przebudowie.
  - Rekomendacje:
    - Jeśli od początku wiesz, że to ma być link — ustaw href już przy montowaniu.
    - Jeśli konieczna dynamiczna zmiana typu elementu, przetestuj ścieżkę w swojej aplikacji; w razie problemów rozważ ponowny montaż (destroy + mountButton) z nową konfiguracją.
- Obsługa „anchor bez href jako button”:
  - W praktyce komponent renderuje <a> tylko gdy href jest podany. Nie przewiduje trybu <a role="button"> na starcie (co jest ok w większości przypadków).
- Programistyczne kliknięcia:
  - Nawet dla <a> z aria-disabled programistyczny .click() mógłby wołać handler; komponent dodatkowo sprawdza state.disabled/loading w onClick i blokuje akcję.

---

## Minimalny przykład HTML + JS

```html
<div id="root" class="p-4 bg-black text-white"></div>

<script>
  const api = mountButton('#root', {
    label: 'Zacznij teraz',
    variant: 'primary',
    size: 'lg',
    rounded: 'xl',
    block: true,
    onClick: () => alert('Go!'),
  });

  // Stan ładowania po 1s
  setTimeout(() => api.setLoading(true), 1000);
  setTimeout(() => api.setLoading(false), 2500);
</script>
```
