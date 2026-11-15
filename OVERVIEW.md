# Usage Pace

Usage Pace shows how much of each AI provider usage limit you have left, and whether you are using it faster or slower than an even pace until the reset.

## How it works

Paseo already collects usage data for each provider. Usage Pace reads the same data. It does not use any tokens and does not call the providers directly. It reads the data by running the `paseo usage ls` command. It reuses the last reading for 30 seconds, and if a new reading fails it keeps the last good one.

## What it shows

- A bar for each usage window. The bar starts full and empties as you use the limit. The filled part is what remains.
- A pace marker: a thin line on the bar. It marks where the remaining usage would be if you used the limit at an even pace until the reset.
- The time until the reset, and the exact reset time when you tap the line.
- A full screen with every provider and every usage window, each with its own bar, pace marker and reset countdown.
- A line at the bottom of the sidebar with the usage window you choose, its remaining percentage and the time until the reset.

Colors: the remaining part of the bar is green. When you are ahead of the pace, the marker area stays neutral grey. When you are behind the pace, the marker area turns orange if you are up to 10 points behind, and red if you are more than 10 points behind.

## Languages

English, Italian, Spanish, French, German, Portuguese, Japanese, Simplified Chinese, Korean, Russian, Dutch, Polish and Turkish.

## Requirements

- Paseo 0.13.0 or later.
- The `paseo` command with the `usage ls` subcommand must be found on the PATH, or in `~/.local/bin`, `/opt/homebrew/bin` or `/usr/local/bin`.
- The built-in usage line in the sidebar shows the same information. To avoid two lines, turn off "Summary in sidebar" in Settings > Usage.

## Known limits

- The translations have not been reviewed by native speakers.
- If the `paseo` command cannot be run, the plugin shows an error instead of usage data.

## How it differs from the built-in meter

- The built-in meter shows the percentage used, which rises. It does not show whether you are ahead or behind the pace.
- Usage Pace shows the remaining usage, which falls, with a pace marker that shows whether you are ahead or behind an even pace.
- Usage Pace shows the time until the reset next to the bar.
- Usage Pace shows all providers in one place.
