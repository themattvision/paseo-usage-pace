# paseo-ritmo-consumo

Plugin Paseo (id runtime `ritmo-consumo`) che mostra il consumo dei provider AI (Claude, Codex e gli altri configurati in Paseo) con una lineetta che indica il ritmo lineare: dove dovresti essere se consumassi in modo uniforme nella finestra (5 ore, 7 giorni). La parte consumata oltre la lineetta ha un altro colore (arancione fino a 10 punti di eccesso, rosso oltre). Funziona su Mac e iPhone (solo primitive React Native).

## Cosa fa
- Riga in fondo alla sidebar (`addSidebarFooterItem`): logo del provider scelto, barra con lineetta, percentuale e durata (es. "22% 5h"). Al tocco apre la schermata completa.
- Schermata "Ritmo consumo" (`addScreen` `ritmo`, aprila anche da Cmd+K): una scheda per provider con tutte le finestre, tempo al reset, scritta "N% sopra/sotto ritmo". Il segnaposto accanto a ogni finestra sceglie quale mostrare nella riga in fondo (scelta salvata).
- La riga integrata di Paseo si spegne da Settings, sezione Usage, interruttore "Summary in sidebar" (impostazione dell'app, per dispositivo).

## Struttura
- `shared/pace.ts`: calcolo puro del ritmo (elapsedPct, diffPct, tono ok/warning/danger).
- `shared/contract.ts`: contratti zod delle RPC `ritmo.usage`, `ritmo.config.get`, `ritmo.config.set`.
- `server/usage.ts`: legge i consumi eseguendo `paseo usage ls --json` (execFile senza shell, timeout 10 s, cache 30 s, ultima lettura buona con `stale`). `server/config.ts`: configurazione in `~/.paseo/plugin-data/ritmo-consumo/config.json`.
- `client/useRitmo.ts`: hook condivisi (stessa cache di riga e schermata). `client/PaceBar.tsx`: barra con lineetta e colore dell'eccesso. `client/RitmoFooterItem.tsx`, `client/RitmoView.tsx`.

## Comandi
`npm install`, `npm run typecheck`, `paseo plugin install /Users/matteozampieri/ProgettiApp/paseo-ritmo-consumo`, dopo ogni modifica `paseo plugin reload ritmo-consumo`, log con `paseo plugin logs ritmo-consumo`. Mai riavviare il daemon per caricare il sorgente.

## Trappole
- DATI: NON chiamare da soli l'endpoint Anthropic `/api/oauth/usage`. SINTOMO: la schermata mostra "Claude ha chiesto di aspettare" (HTTP 429), perché più lettori ogni minuto (plugin, Paseo, Claude Code) finiscono in rate limit. Per questo il plugin legge `paseo usage ls --json`, che ha anche le icone (campo `icon`, SVG 24x24 `currentColor`) e `lastSuccessful` quando la lettura attuale è in errore. Il percorso del binario `paseo` è cercato in `~/.local/bin`, `/opt/homebrew/bin`, `/usr/local/bin`; il PATH reale del subprocess del daemon non è verificato.
- PERCENTUALE CHE OSCILLA (15 novembre 2026). SINTOMO: la riga in fondo mostra a volte 22% e a volte 20% per la stessa finestra. CAUSA: quando Paseo non riesce a leggere un provider (limite di richieste di Claude) l'output di `paseo usage ls` torna su `lastSuccessful`, che può essere più vecchio di una lettura già vista. RIMEDIO in `server/usage.ts` (`mergeMonotonic`): per ogni finestra (stesso reset, tolleranza 2 minuti) si tiene in memoria il massimo già visto e non si mostra mai un valore più basso. Il provider di default della riga è scelto con ordine fisso per nome, per non cambiare da solo.
- BARRA CHE SI SVUOTA (richiesta di Matteo, 15 novembre 2026): la barra mostra il RIMANENTE, parte piena e va verso lo zero; il testo dice "N% rimasto" (schermata) o "N% 5h" (riga in fondo, N = rimanente). La lineetta sta a 100 meno il tempo trascorso. Vantaggio (più rimanente della lineetta) in verde chiaro, mancanza (meno rimanente della lineetta) in arancione fino a 10 punti e rosso oltre. `PaceBar` riceve ancora `usedPct` e `elapsedPct` e fa la conversione dentro.
- COLORE DEL MARGINE (vale per il vantaggio): il margine (tratto fra il consumo e la lineetta, sotto ritmo) è grigio neutro, mai arancione o rosso. SINTOMO provato il 15 novembre 2026: con il margine arancione una barra al 10% sembrava quasi finita e Matteo ha creduto di aver consumato quasi tutta la finestra. L'arancione e il rosso significano solo "oltre il ritmo" (tratto dalla lineetta al consumo).
- RIGA IN FONDO: `SidebarRow` con `trailing` NON allarga il contenuto. SINTOMO: barra corta, lineetta staccata, testo "20% 5h" tagliato sul bordo destro. Il footer usa quindi un `Pressable` proprio a tutta larghezza.
- ICONE: mai emoji o caratteri come icona (il "✳" diventa un quadratino verde su iOS). Si usa il componente `Icon` di `@getpaseo/plugin/client/ui`, con `name` (Lucide) o `icon={{ svg }}` (SVG dei provider).
- AUDIT MOBILE: `rg -n "document\.|window\.|localStorage|navigator\.|<[a-z]+[ >]|className=|onClick=" client/` può dare falsi positivi (`choice.window.id`, stringa SVG in `claudeIcon.ts`).
- Il giallo fluo non va usato come riempimento di micro-elementi; spaziature solo dalla scala 4/8/12/16/24.
- Nessun commit con Co-Authored-By.

## Stato (15 novembre 2026)
Plugin installato sul daemon del Mac, `running`. Non ancora pubblicato nel registro Paseo (Matteo vuole aspettare). Resa grafica verificata solo da screenshot di Matteo, non da prove automatiche.
