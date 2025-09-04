
# SelectField — dokumentacja komponentu

Wielokrotny wybór z wyszukiwarką i „chipsami”, montowany w wybranym elemencie DOM. Wymaga Tailwind CSS.

- Wyszukiwanie po tekście (case-insensitive)
- Wybór wielu pozycji, prezentacja w formie „chipsów”
- Usuwanie pojedynczych pozycji
- Obsługa klawiatury (Enter wybiera pierwszą pasującą opcję)
- API do odczytu wybranych wartości, czyszczenia, podmiany listy pozycji i niszczenia instancji

## Minimalny przykład

```html
<!-- Kontener docelowy -->
<div id="target"></div>

<!-- Tailwind CSS (np. CDN) -->
<script src="https://cdn.tailwindcss.com"></script>

<script>
  // Upewnij się, że globalnie dostępna jest funkcja escapeHtml (patrz sekcja „Wymagania”)
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }
</script>

<script>
  // Zakładając, że kod mountSelectField jest załadowany
  const api = mountSelectField('#target', [
    { value: 1, displayText: 'Apple' },
    { value: 2, displayText: 'Banana' },
    { value: 3, displayText: 'Cherry' },
  ], {
    label: 'Wybierz owoce',
    placeholder: 'Szukaj...'
  });

  // Przykład użycia API
  console.log(api.getChosen()); // []
</script>
```

## Wymagania

- Tailwind CSS dostępny na stronie (komponent używa klas Tailwinda).
- Istnienie elementu w DOM pasującego do podanego selektora.
- Globalna funkcja escapeHtml(string) — komponent zakłada jej istnienie i używa do bezpiecznego wstawiania label i placeholder do HTML.

## Inicjalizacja

```js
const api = mountSelectField(selector, items, options);
```

- selector: string (np. '#target') — CSS selektor elementu, do którego komponent zostanie zamontowany. Rzuca błąd, jeśli nie znaleziono elementu.
- items: Array<{ value, displayText }> — lista pozycji do wyboru.
  - value: prymityw (liczba, string itp.) porównywany ściśle (===)
  - displayText: string wyświetlany użytkownikowi
- options: obiekt konfiguracyjny (opcjonalny)
  - label: string (domyślnie "Select items")
  - placeholder: string (domyślnie "Search...")

Przykład:
```js
const api = mountSelectField('#filters', [
  { value: 'pl', displayText: 'Polska' },
  { value: 'de', displayText: 'Niemcy' },
], {
  label: 'Kraje',
  placeholder: 'Filtruj...'
});
```

## Zachowanie i UX

- Filtrowanie: wpisany tekst jest porównywany z displayText (case-insensitive, z trim); pokazywane są wyłącznie pozycje jeszcze nie wybrane.
- Wybór:
  - Kliknięcie pozycji na liście lub naciśnięcie Enter wybiera pierwszą pasującą pozycję.
  - Po wyborze pozycja staje się chipem nad polem, menu zamyka się, a po krótkiej chwili znów się otwiera i kursor pozostaje w polu (ułatwia szybkie kolejne wybory).
- Usuwanie: kliknięcie ikony X na chipie usuwa pozycję ze stanu i przywraca fokus do pola.
- Puste wyniki: gdy filtr nic nie zwraca, wyświetlany jest komunikat „Brak wyników”.
- Pokazywanie/ukrywanie menu:
  - focus/click/input w polu — pokazuje menu
  - blur — ukrywa menu z opóźnieniem 150 ms (by umożliwić klik w opcję)
- Identyfikacja: input otrzymuje losowe id, label łączy się z input poprzez for/id.

Uwaga: komunikaty wbudowane w komponent (np. „Brak wyników”) i aria-label na przycisku usuwania są po polsku.

## API zwracane przez mountSelectField

Obiekt zwracany przez funkcję montującą:

- getChosen(): number[] | string[] — zwraca kopię tablicy aktualnie wybranych wartości (kolejność wg kolejności wyboru).
- setItems(nextItems: Array<{ value, displayText }>): void
  - Podmienia listę dostępnych pozycji.
  - Ważne: po podmianie komponent automatycznie zaznacza wszystkie pozycje z nowej listy (wszystkie wartości trafiają do chosen). To intencjonalne zachowanie w kodzie — jeśli chcesz innej logiki, zobacz sekcję „Wzorce/Recipe”.
- clear(): void — usuwa wszystkie wybrane pozycje i czyści pole wyszukiwania.
- clearSearch(): void — czyści jedynie tekst wyszukiwania.
- focus(): void — ustawia fokus na polu input.
- destroy(): void — usuwa nasłuchiwacze, czyści root.innerHTML; po wywołaniu instancja nie jest używalna.
- root: HTMLElement — korzeń komponentu (kontener przekazany przez selector).

Przykłady:
```js
api.getChosen();          // np. [1, 2]
api.clear();              // []
api.clearSearch();        // czyści tekst, nie rusza wyboru
api.focus();              // fokus do pola
api.setItems([{ value: 'a', displayText: 'A' }]); // chosen => ['a']
api.destroy();            // demontaż
```

## Model danych i porównania

- value jest porównywane przez ===. Używaj prymitywów (liczby, stringi). Unikaj obiektów jako value.
- Duplikaty:
  - W items mogą się pojawić duplikaty value, ale nie są zalecane.
  - setItems tworzy Set z values, a następnie przepisuje chosen na wszystkie unikalne wartości z nowej listy.

## Obsługa klawiatury

- Enter w polu: wybiera pierwszą pozycję z aktualnie przefiltrowanej listy (jeśli istnieje).
- Strzałki nie są obsłużone do nawigacji po liście (można dopisać wg potrzeb).
- Fokus automatycznie wraca do pola po wyborze/usunięciu.

## Błędy i walidacja

- Jeśli selector nie pasuje do żadnego elementu — rzucany jest błąd.
- Jeśli items nie jest tablicą — rzucany jest błąd.
- setItems ignoruje wejście, jeśli nextItems nie jest tablicą.

## Ograniczenia i uwagi

- Wymagany jest globalny escapeHtml. Bez niego kod zgłosi ReferenceError w momencie montowania.
- Brak pełnej nawigacji strzałkami po liście.
- setItems ustawia chosen na wszystkie pozycje z nowej listy (może być nieoczekiwane — świadomie zaprojektuj logikę).
- Filtrowanie odbywa się w pamięci; dla bardzo dużych list rozważ wirtualizację lub paginację.

