# sebastianstrus.com — portfolio

Statyczna strona (HTML, CSS, JavaScript) bez zależności i bez kroku budowania. Działa na GitHub Pages.

## Struktura

- `index.html` — cała strona; angielski tekst jest wpisany jako wersja zapasowa
- `css/style.css` — wygląd; kolory i typografia są w sekcji „Tokens” na górze pliku
- `js/main.js` — przełączanie języków i animacje
- `js/i18n/en.js`, `sv.js`, `pl.js` — **wszystkie teksty**, po jednym pliku na język
- `assets/` — czcionki (hostowane lokalnie), zdjęcia, wideo aplikacji

## Jak poprawiać teksty

Otwórz plik języka w `js/i18n/` i zmień tekst po prawej stronie dwukropka. Kluczy po lewej nie zmieniaj.
Każdy tekst ma ten sam klucz we wszystkich trzech plikach, np. `"hero.title"`.

Strona zawsze pobiera teksty z tych plików, także angielskie. Tekst wpisany w `index.html`
widzą tylko wyszukiwarki i przeglądarki bez JavaScriptu, więc po większych zmianach w `en.js`
warto przenieść je też do `index.html`.

## Języki

Domyślny jest angielski. Wybór użytkownika jest zapamiętywany, a język można też wymusić linkiem:
`https://sebastianstrus.com/?lang=sv` lub `?lang=pl`.

## Podgląd lokalny

    cd <ten folder>
    python3 -m http.server 8000

i otwórz http://localhost:8000

## Publikacja

Ten folder jest kompletny: zawiera też `documents/` (polityki prywatności aplikacji z App Store
i certyfikaty) oraz `CNAME`, skopiowane bez zmian ze starej strony. Aby opublikować, zastąp
zawartość repozytorium `sebastianstrus.github.io` zawartością tego folderu (folder `.git` zostaje)
i wypchnij zmiany. Stare foldery `img/`, `css/`, `js/` i stare pliki `.html` nie są już potrzebne.
