# mountSuspenseScreen – dokumentacja

Funkcja montująca prosty ekran „ładowania” (Suspense Screen) w zadanym elemencie DOM. Struktura i nazewnictwo klas odzwierciedlają wzorzec Yew SuspenseScreen. Udostępnia czytelne, imperatywne API do aktualizacji komunikatów, ikony, pokazywania/ukrywania oraz zwalniania zasobów.

## Szybki start

```html
<div id="app-loader"></div>
<script type="module">
  import { mountSuspenseScreen } from './suspense-screen.js';

  const loader = mountSuspenseScreen('#app-loader', {
    message: 'Ładowanie danych...',
    hint: 'To może potrwać kilka sekund',
    fullScreen: true,
  });

  // ...kiedy dane gotowe:
  loader.destroy();
</script>
```

## Sygnatura

```js
function mountSuspenseScreen(
  selector,           // string (CSS selector) lub Element
  options = {}        // konfiguracja opcjonalna
)
```

- selector: string lub Element. Gdzie wstawić ekran.
- Zwraca: uchwyt (handle) z metodami sterującymi i referencjami do elementów.

## Opcje

- message: string – komunikat główny. Domyślnie: "Ładowanie...".
- hint: string|null – dodatkowa podpowiedź poniżej komunikatu. Domyślnie: null (brak).
- iconSvg: string – HTML SVG ikony. Domyślnie: wartość globalna CONFILOGI_ICON_SVG.
- fullScreen: boolean – czy wypełnić pełną wysokość ekranu (min-h-screen). Domyślnie: true.
- classes: string – dodatkowe klasy CSS dodawane do kontenera (np. tło, pozycjonowanie, hidden).

Uwaga: Klasy CSS są zgodne z Tailwind CSS (np. min-h-screen, animate-pulse, text-neutral-600). Bez Tailwinda nadal zadziała struktura, ale style mogą wymagać własnych reguł.

## Zwracane publiczne API

Uchwyt (handle) zwracany przez funkcję:

- setMessage(text): ustawia treść komunikatu statusu.
- setHint(text): ustawia/usuwa podpowiedź. Przekazanie pustego/null usuwa element hint.
- setIconSvg(svg): podmienia ikonę (innerHTML), fallback do DEFAULT_ICON_SVG jeśli brak.
- show(): usuwa klasę hidden z kontenera.
- hide(): dodaje klasę hidden do kontenera.
- destroy(): czyści root.innerHTML, zwalniając komponent.
- root: referencja do elementu root (kontener przekazany/znaleziony przez selector).
- container: referencja do głównego elementu kontenera ekranu.

## Przykłady użycia

1) Podstawowy (full screen, domyślna ikona):
```js
const screen = mountSuspenseScreen('#loader');
```

2) W trybie osadzonym (bez pełnej wysokości):
```js
const screen = mountSuspenseScreen('#section-loader', {
  fullScreen: false,
  message: 'Wczytywanie sekcji...',
});
```

3) Z własnym SVG i dodatkowymi klasami tła:
```js
const MY_SVG = '<svg viewBox="0 0 24 24" ...>...</svg>';
const screen = mountSuspenseScreen('#loader', {
  iconSvg: MY_SVG,
  classes: 'bg-white/80 backdrop-blur-sm fixed inset-0',
});
```

4) Dynamiczna aktualizacja komunikatów:
```js
const screen = mountSuspenseScreen('#loader', { message: 'Start...' });
screen.setMessage('Pobieranie danych 1/3');
screen.setHint('Łączenie z serwerem...');
setTimeout(() => screen.setMessage('Przetwarzanie 2/3'), 1000);
setTimeout(() => { screen.setHint(null); screen.setMessage('Kończenie 3/3'); }, 2000);
```

5) Ukrywanie/pokazywanie (np. „płachta” overlay):
```js
const screen = mountSuspenseScreen('#overlay', { classes: 'hidden fixed inset-0 bg-black/40' });
screen.show();
// ...
screen.hide();
```

6) Inicjalnie ukryty komponent:
```js
const screen = mountSuspenseScreen('#loader', { classes: 'hidden' });
// później
screen.show();
```

## Renderowany markup (schemat)

Tworzone jest pojedyncze dziecko w root z następującą strukturą:

```html
<div class="w-full min-h-screen flex flex-col gap-4 justify-center items-center z-10 {classes}">
  <div class="w-28 z-10" data-role="icon">{iconSvg}</div>
  <p class="animate-pulse select-none z-10" role="status" aria-live="polite" data-role="message">
    {message}
  </p>
  <!-- opcjonalnie -->
  <span class="text-sm text-neutral-600" data-role="hint">{hint}</span>
</div>
```

- fullScreen=false usuwa klasę min-h-screen.
- classes wstrzykiwane są do kontenera głównego.

## Bezpieczeństwo

- message i hint są escapowane przy renderze oraz ustawiane przez textContent w metodach setMessage/setHint, co zapobiega XSS.
- iconSvg jest wstrzykiwane przez innerHTML. Upewnij się, że przekazywany SVG pochodzi z zaufanego źródła lub jest odpowiednio oczyszczony.

## Obsługa błędów

- Gdy selector nie pasuje do żadnego elementu, rzucany jest błąd:
  "mountSuspenseScreen: nie znaleziono elementu dla selektora "…"".
- Upewnij się, że inicjalizacja następuje po wyrenderowaniu elementu root (np. po DOMContentLoaded).

## Dobre praktyki

- Trzymaj jeden ekran ładowania na jeden obszar UI. Dla wielu sekcji rób oddzielne instancje.
- Wywołuj destroy() po zakończeniu, by uniknąć „martwych” węzłów.
- Jeśli ekran ma być początkowo ukryty, podaj classes: "hidden" i steruj show()/hide().
