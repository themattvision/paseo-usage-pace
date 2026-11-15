Ritmo consumo mostra quanto del limite di Claude hai già usato e se stai andando più piano o più veloce del ritmo uniforme.

In fondo alla sidebar di Paseo c'è una riga compatta, al posto del misuratore integrato: a sinistra l'icona di Claude, poi una barra con la finestra da 5 ore, a destra la percentuale usata e la scritta "5h". Sulla barra una lineetta scura segna dove dovresti essere se consumassi in modo uniforme nelle 5 ore. Se la barra arriva prima della lineetta vai più veloce del previsto, se resta dietro vai più piano. Toccando la riga si apre la schermata completa.

La schermata completa "Ritmo consumo" mostra le barre Session, Weekly e Weekly · Fable, ciascuna con la sua lineetta del ritmo, il tempo mancante al reset e un messaggio su quanto sei sopra o sotto il ritmo. Si trova anche nel Command Center con la voce "Apri Ritmo consumo".

I dati si aggiornano da soli ogni minuto. Se non sono disponibili la riga mostra "n/d" e la schermata spiega cosa fare.

Il plugin legge i consumi di tutti i provider configurati su questo Mac (Claude, Codex e gli altri che Paseo conosce) dalla stessa fonte che usa Paseo per il suo pannello Usage. Non usa nessuna chiave o token e non chiama direttamente Anthropic, quindi non dovrebbe più finire in limite di richieste. I dati restano in memoria per 30 secondi, così più richieste ravvicinate usano la stessa lettura. Se una lettura fallisce, il plugin mostra l'ultimo risultato buono, segnalato come dato vecchio, con il motivo in parole semplici.

La scelta del footer (quale provider e quale finestra mostrare) si salva in un piccolo file di configurazione sul Mac, sotto la cartella dati del plugin in ~/.paseo. Se il file non c'è, il footer usa la finestra più corta del primo provider.
