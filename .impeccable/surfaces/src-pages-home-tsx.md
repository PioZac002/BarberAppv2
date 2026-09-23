---
version: 1
slug: "src-pages-home-tsx"
primary_target: "src/pages/Home.tsx"
related_targets: ["src/index.css","tailwind.config.ts","src/components/Navigation.tsx","src/components/dashboard/DashboardLayout.tsx","src/pages/Booking.tsx","src/pages/Team.tsx","src/pages/Services.tsx","src/pages/Login.tsx"]
---

# Surface brief — SZLIF (cała aplikacja)

## Scope & mode

Cały produkt, jeden świat w dwóch rejestrach. Strony publiczne (`/`, `/services`, `/team`, `/reviews`, `/booking`, `/login`, `/register`) w trybie **Persuade**. Panele klienta, barbera i admina (`/user-dashboard/*`, `/barber-dashboard/*`, `/admin-dashboard/*`) w trybie **Operate**.

Publiczność: klient wybierający zakład wieczorem na telefonie; barber przy fotelu, na stojąco, między klientami; admin przy biurku, dłuższe sesje. Zadanie: zarezerwować wizytę / poprowadzić dzień pracy / rozliczyć salon.

Nienaruszalne: PL+EN z `LanguageContext`, dark+light z `ThemeContext`, PWA, cała logika i dane. Render free tier — zimny start 30–60 s jest normalnym stanem, nie błędem. Zdjęcia w portfolio i awatary są wgrywane przez użytkowników, więc layouty muszą znieść dowolną jakość i proporcję.

Marka: nazwa autorska. **Znak dostarczony przez użytkownika** (`logo_barber.png`): głowa z profilu z fade'em i brodą, wordmark SZLIF, „BARBERSHOP" i linia „Klasyczny styl. Nowa definicja." Miękka niebieska poświata, z którą plik przyszedł, została usunięta przez przebudowę kanału alfa z bieli piksela; znak jedzie jako maska alfa (`.brand-mark` / `.brand-lockup`), więc bierze tusz podłoża zamiast wozić dwie kopie. To ilustracja, nie ikona — trzyma się od ok. 32 px w górę. Stare złoto `#c8a000` / `#ffd100` i `BarberShopLogo.png` to anty-referencja.

Zdjęcia: jedna para „przed/po" dostarczona przez użytkownika (`public/media/cut-*.jpg`) — ten sam fotel, światło i kadr. To jedyne fotografie w produkcie.

## Direction contract

**THESIS.** Najbardziej rozpoznawalny kolor barberingu to elektryczny błękit Barbicide, nie złoto — więc ten błękit zalewa produkt na skalę strony, a treść leży na nim jak drukowane etykiety toników na glazurowanej ścianie zaplecza. Odmawiam domyślnego układu kategorii: ciemne hero z nastrojowym zdjęciem fade'u, złoty akcent, rozstrzelony nadtytuł, przyklejone „Book now”. Odmawiam też jego przeciwieństwa: klinicznego beżowo-białego spa.

**OWN-WORLD.** Pole: glazurowana płytka w błękicie Barbicide (`#1D2FC9`), fuga o ton ciemniejsza, siatka płytek jest realną siatką layoutu. Kontr-materiał: kremowa etykieta (`#F4F2EA`) z ramką z podwójnej linii i czerwoną drugą farbą (`#E03127`) na stemplach, ostrzeżeniach i znaku. Chrom (`#B9BEC4`) na krawędziach, półkach i liniach cięcia. Dark to ten sam lokal po zamknięciu: granatowo-czarne `#0A0D22`, błękit przestaje odbijać i zaczyna świecić (`#3A54FF`). Typografia to dwa kroje i ani jednego więcej: Archivo (zmienny, z osią szerokości) na wszystko, Spline Sans Mono na liczby, godziny, ceny i tabele. Komponenty mówią językiem etykiety: plakietka, blok „sposób użycia”, linia netto, numer partii, stempel stanu. Panele odwracają rejestr — grunt etykiety, błękit trzyma szynę nawigacji, nagłówki tabel, stany aktywne i akcje główne.

**STORY.** Klient rozumie, że to konkretny zakład z konkretnym rzemiosłem, nie szablon; wierzy w to, bo produkt pokazuje usługi jako policzalne pozycje z czasem i ceną, a zespół jako ponumerowane stanowiska; działa, rezerwując z pierwszego ekranu bez przewijania. Barber i admin dostają ten sam świat w gęstszym rejestrze: stany są stemplem, obłożenie jest poziomem, nic nie wymaga tłumaczenia dwa razy.

**FIRST VIEWPORT (v3, current).** Błękitna glazurowana ściana. Po lewej roszczenie w wersalikach etykiety i akapit, po prawej oprawiony kadr „przed/po" z chromową linią cięcia — pierwszy ekran pokazuje robotę, zamiast o niej zapewniać. Pod spodem chromowa półka i rząd plakietek z realnego cennika; skrajnie z lewej plakietka rezerwacji zalana błękitem. Sekcja niżej to ściana zdjęć lokalu, w której słup barberski stoi w pełnej wadze, bo jego czerwień i błękit to dwa inki tej strony. Poprzednie wersje, dla zapisu — v2 (orbita fotela sterowana scrollem, usunięta na życzenie właściciela): Pełny kadr to nadal błękitna glazurowana ściana z realną siatką fug, ale nazwa w wielkiej skali ustąpiła miejsca pokojowi: po lewej roszczenie w wersalikach etykiety i akapit, po prawej oprawiony kadr, w którym kamera obchodzi fotel wraz ze scrollem, z odczytem postępu obrotu pod spodem. Pod nimi chromowa linia półki i rząd plakietek z realnego cennika — skrajnie z lewej plakietka rezerwacji jako etykieta słoja, jedyny obiekt zalany błękitem. Nazwa SZLIF żyje teraz w znaku w pasku i w lockupie zamykającym stronę. Poprzednia wersja tego bloku, dla zapisu:  Pełny kadr to błękitna glazurowana ściana z realną siatką fug. Przez całą szerokość, na wysokości wzroku, nazwa SZLIF w Archivo Expanded Black w bieli płytki, ciasno zamknięta w kadrze. Pod nią chromowa linia półki grubości 3 px z rzuconym cieniem. Na półce, poniżej linii, rząd kremowych plakietek: skrajnie z lewej plakietka rezerwacji jako etykieta słoja Barbicide — jedyny obiekt całkowicie zalany błękitem — dalej sygnaturowe usługi, każda z linią netto (czas, cena) i numerem partii. Na telefonie półka przewija się poziomo, nazwa trzyma skalę. Akcja główna siedzi na półce, nie w pasku nawigacji.

**FORM.** BACK BAR — zaplecze zakładu: słój Barbicide, chrom, glazura, drukowana etykieta tonikowa. Pozycja 1 na mojej uporządkowanej liście kierunków (IMPECCABLE'S PICK), wybrana przez użytkownika ponad przypisanie losowania (indeks 6, WZÓR — płyta rysunku technicznego). Seed key: de8dcb67.

**Przeniesione dyscypliny.** Z rundy kierunków biorę cztery rzeczy niezależne od świata: każda linia i reguła ma zdefiniowane znaczenie, zero dekoracyjnych kresek; każdy rekord niesie widoczny pasek proweniencji (kto, kiedy, rewizja); hierarchia z wagi, wersalików i szerokości linii, nigdy z trzeciego kroju; pierwszy kadr trzyma pełną skalę aż do telefonu.

**Sygnaturowy moment.** Poziom cieczy, czytany pionowo i poziomo. Jeden autorski materiał ruchu w całym produkcie: pełne pole błękitu podnoszące się do dokładnej linii z 1 px menisku. Obłożenie dnia, postęp, wybór slotu, stan przycisku przy wciśnięciu i zimny start Rendera to ten sam gest — słój napełniający się do kreski. Żadnych rozsypanych efektów hover w zamian.

**Cięcie.** Ten sam gest położony na bok: chromowa linia (ta sama, która jest półką i krawędzią) jedzie za kursorem przez parę zdjęć przed/po, z uchwytem do przeciągnięcia na dotyku, obsługą klawiatury jako suwak i jednorazowym przejazdem przy wejściu w kadr, żeby nikt nie musiał zgadywać, że to się rusza. Spoczynek to „przed" — na tyle wsunięty, żeby linia i uchwyt nie były przycięte krawędzią kadru. To dowód zamiast deklaracji i jedyna fotografia na stronie głównej.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Nierozstrzygnięte

- Adres, godziny otwarcia i dane kontaktowe salonu to treść autorska dla fikcyjnego zakładu; nie wolno ich podawać jako faktów o realnym biznesie ani dopisywać nagród, dat założenia czy liczby klientów.
- Ikony PWA i `BarberShopLogo.png` do zastąpienia znakiem SZLIF; format rastrowy zależny od dostępnego rasteryzera.
