# mountModal — lekki i dostępny modal (Vanilla JS + Tailwind)

Funkcja mountModal montuje węzeł modala w podanym kontenerze, dostarcza pełne API sterujące (open/close, akcje, treść, rozmiar) oraz dba o kluczowe aspekty dostępności: focus trap, ARIA, zamykanie ESC i na backdrop.

- Zero zależności runtime (poza przeglądarką)
- Stylowanie gotowe pod Tailwind (możesz podmienić klasy)
- Bezpieczne escape’owanie tekstu (title, etykiety przycisków)
- Treść HTML traktowana jako zaufana (patrz sekcja Bezpieczeństwo)

## Szybki start

HTML:
```html
<div id="modal-root"></div>
<button id="open">Otwórz modal</button>
```

JS:
```js
const modal = mountModal('#modal-root', {
  title: 'Witaj!',
  contentHtml: '<p class="text-neutral-300">To jest przykładowa treść.</p>',
  size: 'md',
  primaryAction: { label: 'OK', onClick: (_, api) => api.close() },
  secondaryAction: { label: 'Anuluj', onClick: (_, api) => api.close() },
});

document.querySelector('#open').addEventListener('click', () => modal.open());
```

## Sygnatura

```js
const api = mountModal(selectorOrElement, options?)
```

- selectorOrElement: string CSS lub bezpośrednio Element kontenerowy
- Zwraca: API modala (patrz sekcja API)

## Opcje

- title: string (domyślnie "Modal title")
- contentHtml: string (HTML treści, domyślnie prosty paragraf)
- size: 'sm' | 'md' | 'lg' | 'xl' (domyślnie 'md')
- initialOpen: boolean (domyślnie false)
- closeOnEsc: boolean (domyślnie true)
- closeOnBackdrop: boolean (domyślnie true)
- showCloseButton: boolean (domyślnie true)
- classes: string (dodatkowe klasy na kontenerze dialogu)
- primaryAction: { label: string, onClick?: (event, api) => void } | null
- secondaryAction: { label: string, onClick?: (event, api) => void } | null
- onOpen: (api) => void
- onClose: (api) => void

Uwagi:
- title i etykiety przycisków są bezpiecznie escapowane.
- contentHtml jest wstrzykiwane jako zaufane HTML (patrz Bezpieczeństwo).

## API

Metody:
- open(): otwiera modal (przywraca focus do poprzedniego elementu przy zamknięciu)
- close(): zamyka modal
- isOpen(): boolean
- setTitle(text): ustawia tytuł
- setContent(htmlOrNode): podmień treść. Akceptuje:
  - string (HTML, traktowany jako zaufany)
  - Node (np. element formularza)
- setSize(size): 'sm' | 'md' | 'lg' | 'xl' — dynamiczna zmiana szerokości
- setPrimaryAction(cfg): podmień akcję główną lub null
- setSecondaryAction(cfg): podmień akcję drugorzędną lub null
- setCloseOnEsc(boolean)
- setCloseOnBackdrop(boolean)
- destroy(): usuwa nasłuchy, czyści kontener i przywraca overflow dokumentu

Właściwości referencyjne:
- root: element kontenera przekazany do mountModal
- overlayEl: węzeł overlayu
- dialogEl: węzeł dialogu
- contentEl: węzeł treści

## Zachowanie i dostępność (a11y)

- role="dialog", aria-modal="true", aria-labelledby na tytule
- aria-hidden na overlay, zarządzane przy otwarciu/zamknięciu
- Focus trap: Tab/Shift+Tab porusza się w obrębie modala
- ESC zamyka modal (o ile closeOnEsc = true)
- Kliknięcie w tło (backdrop) zamyka modal (o ile closeOnBackdrop = true)
- Po zamknięciu focus wraca do elementu aktywnego przed otwarciem
- Blokada przewijania dokumentu podczas otwartego modala (class overflow-hidden na <html>)

Dodatkowe klasy dialogu: opcja classes. Przykład:
```js
mountModal('#root', { classes: 'bg-white/10 backdrop-blur-md' });
```

Hooki w DOM (data-role), które ułatwiają testy i selektory:
- [data-role="overlay"]
- [data-role="backdrop"]
- [data-role="dialog"]
- [data-role="content"]
- [data-role="footer"]
- [data-role="close"]

## Przykłady

1) Dynamiczna treść jako Node:
```js
const form = document.createElement('form');
form.innerHTML = `
  <label class="block mb-2 text-neutral-300">Email
    <input class="mt-1 w-full rounded bg-neutral-900 ring-1 ring-neutral-800 p-2" type="email" required>
  </label>
`;
const modal = mountModal('#root', { title: 'Zapisz się', contentHtml: '' });
modal.setContent(form);
modal.setPrimaryAction({
  label: 'Wyślij',
  onClick: () => form.requestSubmit(),
});
```

2) Potwierdzenie z akcjami:
```js
const modal = mountModal('#root', {
  title: 'Usunąć element?',
  contentHtml: '<p class="text-neutral-300">Tej operacji nie można cofnąć.</p>',
  primaryAction: { label: 'Usuń', onClick: async (_, api) => { await deleteItem(); api.close(); } },
  secondaryAction: { label: 'Anuluj', onClick: (_, api) => api.close() },
});
modal.open();
```

3) Zmiana rozmiaru i tytułu w locie:
```js
api.setTitle('Szczegóły');
api.setSize('xl');
api.setContent('<div>Nowa treść...</div>');
```

4) Integracja z React (useEffect):
```jsx
useEffect(() => {
  const modal = mountModal(ref.current, { onClose: () => setOpen(false) });
  if (open) modal.open(); else modal.close();
  return () => modal.destroy();
}, [open]);
```

## Zdarzenia

- onOpen(api): wywoływane po otwarciu (po ustawieniu aria-hidden i focus)
- onClose(api): wywoływane po zamknięciu (po przywróceniu overflow i focus)

Zalecenie: otoczyć logikę callbacków try/catch po stronie aplikacji, jeśli wykonujesz działania mogące rzucać błędy.

## Bezpieczeństwo

- Escapowane są: title i etykiety przycisków (zapobiega XSS w tekstach).
- contentHtml jest wstawiany wprost jako HTML i traktowany jako zaufany. Nie wstawiaj tu niesprawdzonego wejścia użytkownika. Jeśli potrzebujesz bezpiecznie zrenderować dane użytkownika, stwórz Node-y ręcznie lub zastosuj własny sanitizer.

## Wiele modalów jednocześnie

- Technicznie możesz utworzyć wiele instancji, ale:
  - Globalny nasłuch klawiszy (Esc) jest podpinany do document dla każdej instancji.
  - Focus trap działa w obrębie pojedynczego dialogu.
- Rekomendacja: utrzymuj aktywny jeden modal naraz, zamykaj poprzedni przed otwarciem kolejnego.

## Sprzątanie

- Wywołaj api.destroy() przy unmount/wyjściu ze strony, aby:
  - Zdjąć nasłuchy
  - Usunąć zawartość kontenera
  - Przywrócić overflow dokumentu

## Znane niuanse i wskazówki

- setSize aktualizuje klasy rozmiaru, ale nie nadpisuje cfg.size — to zamierzone i bezpieczne (stan klasy jest źródłem prawdy).
- Jeśli używasz niestandardowych elementów jako fokusowalne, nadaj im tabindex >= 0.
- Jeśli celujesz w bardzo stare przeglądarki, rozważ polyfill dla CSS.escape i Element.closest/querySelectorAll.

## Testowanie (przykładowe asercje E2E)

- Po open(): overlay nie ma klasy 'hidden', aria-hidden="false", <html> ma overflow-hidden
- Tab krąży między elementami w dialogu
- Escape zamyka modal (gdy closeOnEsc = true)
- Kliknięcie w tło zamyka modal (gdy closeOnBackdrop = true)
- Po close(): focus wraca do wcześniej aktywnego elementu
