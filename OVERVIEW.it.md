# Ritmo consumo

Ritmo consumo mostra quanto resta di ogni limite di consumo dei provider AI e se stai usando il limite più in fretta o più piano del ritmo uniforme fino al rinnovo.

## Come funziona

Paseo raccoglie già i dati di consumo per ogni provider. Ritmo consumo legge gli stessi dati. Non usa token e non chiama direttamente i provider. Legge i dati eseguendo il comando `paseo usage ls`. Riusa l'ultima lettura per 30 secondi e, se una nuova lettura fallisce, mantiene l'ultima lettura valida.

## Cosa mostra

- Una barra per ogni finestra di consumo. La barra parte piena e si svuota man mano che usi il limite. La parte piena è ciò che resta.
- La lineetta del ritmo: un segno sottile sulla barra. Indica dove sarebbe il rimanente se consumassi il limite a ritmo uniforme fino al rinnovo.
- Il tempo al rinnovo, e l'orario esatto quando tocchi la riga.
- Una schermata completa con tutti i provider e tutte le finestre, ognuna con la sua barra, la sua lineetta e il suo conto alla rovescia.
- Una riga in fondo alla sidebar con la finestra che scegli, la percentuale rimasta e il tempo al rinnovo.

Colori: la parte rimasta della barra è verde. Quando sei in vantaggio sul ritmo, il tratto del margine resta grigio neutro. Quando sei in svantaggio, il tratto diventa arancione se il ritardo è fino a 10 punti, e rosso se supera i 10 punti.

## Lingue

Inglese, italiano, spagnolo, francese, tedesco, portoghese, giapponese, cinese semplificato, coreano, russo, olandese, polacco e turco.

## Requisiti

- Paseo 0.13.0 o successivo.
- Il comando `paseo` con il sottocomando `usage ls` deve essere nel PATH, oppure in `~/.local/bin`, `/opt/homebrew/bin` o `/usr/local/bin`.
- La riga integrata di consumo in sidebar mostra le stesse informazioni. Per evitare due righe, disattiva "Summary in sidebar" in Settings > Usage.

## Limiti noti

- Le traduzioni non sono state riviste da madrelingua.
- Se il comando `paseo` non può essere eseguito, il plugin mostra un errore al posto dei dati di consumo.

## Come si differenzia da quello integrato

- Il misuratore integrato mostra la percentuale consumata, che sale. Non dice se sei in anticipo o in ritardo sul ritmo.
- Ritmo consumo mostra il rimanente, che scende, con una lineetta del ritmo che indica se sei in anticipo o in ritardo rispetto al ritmo uniforme.
- Ritmo consumo mostra il tempo al rinnovo accanto alla barra.
- Ritmo consumo mostra tutti i provider in un posto solo.
