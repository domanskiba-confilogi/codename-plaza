# mountFileField – dokumentacja komponentu pola wyboru plików

Komponent renderuje nowoczesne, dostępne i łatwe do stylowania pole wyboru plików, z etykietą, podpowiedzią, obsługą błędów, walidacją i przyjaznym API do integracji w aplikacjach SPA lub klasycznych formularzach.

## Wymagania i uwagi
- Przeglądarka z obsługą: File API, CSS.escape, addEventListener
- Stylowanie używa klas w stylu Tailwind; możesz dostosować lub podmienić klasy
- Nie można programowo ustawić FileList (ograniczenie przeglądarki); dostępne jest tylko czyszczenie wyboru
- Walidacja dotyczy liczby i rozmiaru plików. Atrybut accept jest wskazówką dla selektora plików – nie zastępuje walidacji po stronie serwera

## Szybki start

HTML:
```html
<div id="attachments"></div>
```

Inicjalizacja:
```js
const api = mountFileField('#attachments', {
  label: 'Załączniki',
  hint: 'Możesz dodać do 5 plików PNG/JPG lub PDF (max 10MB każdy)',
  multiple: true,
  accept: 'image/png,image/jpeg,.pdf',
  maxFiles: 5,
  maxFileSizeMB: 10,
  onChange: (files, { added, removed }) => {
    console.log('Wybrane pliki:', files);
    console.log('Dodane:', added, 'Usunięte:', removed);
  },
});
```

## Opcje (options)
- label: string (domyślnie "Attachments") – tekst etykiety
- hint: string (domyślnie "") – tekst podpowiedzi pod polem
- multiple: boolean (domyślnie false) – zezwala na wybór wielu plików
- accept: string (domyślnie "") – lista typów/MIME/rozszerzeń (np. "image/*,.pdf")
- disabled: boolean (domyślnie false) – blokada pola
- maxFileSizeMB: number | null – maks. rozmiar pojedynczego pliku w MB (walidacja)
- maxFiles: number | null – maks. liczba plików (walidacja)
- onChange: (files, meta) => void – callback po zmianie wyboru
  - meta: { added: File[]; removed: File[] } – różnice względem poprzedniego wyboru (porównanie po name:size:type)
- clearErrorOnChange: boolean (domyślnie true) – czy czyścić błąd po każdej zmianie wyboru
- classes: string – dodatkowe klasy dla elementu input

Uwaga: Komponent bezpiecznie „escapuje” label/hint/accept; jeżeli globalnie zdefiniujesz window.escapeHtml, zostanie użyty.

## API zwracane przez mountFileField

Metody i właściwości:
- getFiles(): File[] – kopia aktualnie wybranych plików
- clear(): void – czyści wybór plików i wartość input
- validate(): { valid: boolean; error: string|null; oversizeFile: File|null }
  - Sprawdza maxFiles oraz maxFileSizeMB (na plik)
  - W razie błędu ustawia komunikat i styl błędu
- setError(message: string): void – ręczne ustawienie błędu (pusty/whitespace czyści)
- clearError(): void – usuwa informację o błędzie i style błędu
- hasError(): boolean – czy istnieje aktywny błąd
- disable(): void – ustawia disabled
- enable(): void – usuwa disabled
- isDisabled(): boolean – aktualny stan disabled
- setLabel(text: string): void – zmienia tekst etykiety
- setHint(text: string): void – ustawia/aktualizuje podpowiedź (tworzy element, jeśli nie istnieje)
- setAccept(accept: string): void – ustawia atrybut accept
- setMultiple(multiple: boolean): void – włącza/wyłącza wybór wielokrotny
- focus(): void – fokus na input
- blur(): void – blur z input
- inputEl: HTMLInputElement – referencja do inputa
- errorEl: HTMLElement|null – referencja do elementu z błędem
- root: HTMLElement – kontener, do którego zamontowano komponent
- destroy(): void – odmontowanie: usuwa nasłuchiwacze i czyści kontener

## Zdarzenia i przepływ onChange

- Zmiana wyboru plików wywołuje onChange(files, meta)
- files: pełna lista aktualnie wybranych plików
- meta.added/meta.removed: wyprowadzone różnice względem poprzedniego stanu (best-effort przez name:size:type)
- Gdy clearErrorOnChange = true i był aktywny błąd, zostanie automatycznie wyczyszczony przy zmianie

Przykład:
```js
const api = mountFileField('#attachments', {
  onChange: (files, { added, removed }) => {
    if (files.length === 0) {
      api.setHint('Nie wybrano plików');
    } else {
      api.setHint(`${files.length} plik(i/ów) wybrano`);
    }
  },
});
```

## Walidacja i komunikaty błędów

- api.validate() wykonuje:
  - limit liczby plików (maxFiles)
  - limit rozmiaru pojedynczego pliku (maxFileSizeMB w MB)
- Komunikaty (ang.): 
  - "You can select up to N file(s)." przy przekroczeniu liczby
  - "File "NAME" exceeds XMB limit." przy przekroczeniu rozmiaru
- Aby spersonalizować treści błędów (np. i18n), możesz:
  - Nie używać validate() i własnoręcznie walidować w onChange, używając api.setError()
  - Albo wywołać validate(), a następnie nadpisać komunikat api.setError('Twój komunikat')

Przykład walidacji przed wysyłką:
```js
btnUpload.addEventListener('click', async () => {
  const { valid } = api.validate();
  if (!valid) return; // komunikat już ustawiony

  const data = new FormData();
  for (const f of api.getFiles()) data.append('files', f);

  await fetch('/upload', { method: 'POST', body: data });
});
```

## Dostosowanie wyglądu

- Komponent posiada predefiniowane klasy Tailwind (w tym styl błędu – czerwone obramowanie i ring focus)
- Dodaj własne klasy: options.classes lub bezpośrednio na api.inputEl
```js
const api = mountFileField('#attachments', { classes: 'border border-dashed border-neutral-700' });
api.inputEl.classList.add('text-emerald-300'); // przykład dynamicznej zmiany
```

## Przykłady

1) Prosty wybór jednego pliku PDF:
```js
mountFileField('#pdf', {
  label: 'Raport PDF',
  accept: 'application/pdf',
  multiple: false,
});
```

2) Dynamiczna zmiana akceptowanych typów i liczby plików:
```js
const api = mountFileField('#dyn', { multiple: true, accept: 'image/*' });
toggleImgOnly.addEventListener('click', () => {
  api.setAccept('image/*,.webp');
});
toggleMulti.addEventListener('click', () => {
  api.setMultiple(!api.inputEl.hasAttribute('multiple'));
});
```

3) Reset po wysłaniu:
```js
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const res = api.validate();
  if (!res.valid) return;
  // ...wyślij...
  api.clear();        // czyści FileList
  api.clearError();   // usuwa ewentualny błąd
  api.setHint('Wysłano. Możesz dodać kolejne pliki.');
});
```

4) Własna walidacja typu/MIME:
```js
mountFileField('#custom', {
  onChange(files, { added }) {
    const bad = added.find(f => !/\.(png|jpg|jpeg|pdf)$/i.test(f.name));
    if (bad) this?.setError?.(`Niedozwolone rozszerzenie: ${bad.name}`); // lub zachowaj referencję na api z zewnątrz
  },
});
```

## Struktura DOM generowana przez komponent

Przykładowy HTML (uproszczony):
```html
<div class="flex flex-col">
  <label class="text-sm font-medium" for="file-XXXXXXXX">Załączniki</label>
  <input id="file-XXXXXXXX" type="file" class="..." multiple accept="..."/>
  <p id="file-XXXXXXXX-hint" class="mt-2 text-xs text-neutral-500">Treść podpowiedzi</p>
  <p id="file-XXXXXXXX-error" class="hidden mt-2 text-sm text-red-400" role="alert" aria-live="polite"></p>
</div>
```

## Sprzątanie zasobów

W SPA pamiętaj o destroy():
```js
const api = mountFileField('#attachments', { /* ... */ });
// ...
api.destroy(); // usuwa nasłuchiwacz change i czyści root.innerHTML
```
