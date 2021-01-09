# Changelog

## 0.2.1

### Added

-   length safe mode: trim outputs which length larger than 4096 (single Telegram text message's capacity), sending last 4096 length part as text, and rest part as file (regardless send-as-file mode is enabled)
-   new option `--length-safe`/`--no-length-safe` to enable/disable length safe mode (enabled by default)

### Fixed

-   wrong execution time displayed in notifications

## 0.2.0

### Improved

-   added ANSI escape code handle
-   improved respond speed of exit or interrupt

## 0.1.5

### Added

-   new option `--dynamic`/`--no-dynamic` to enable/disable message dynamic updating

### Improved

-   promised messages (handle bot api error code `429`)
-   every block (separated by interval) could be update respectively

### Modified

-   rewrote core code to improve compatibility
-   removed options `frequency` and `debug`
-   default value of argument `--interval` has been set to 10(seconds)

## 0.1.4

### Added

-   `\r` and `\n` now handled properly
-   notification message updating
    <p align="center">
    <img width="550px" src="https://github.com/MamoruDS/shell-notify-telegram-bot/raw/ts-dev/screenshots/preview_20BU0959.gif">
    </p>

### Improved

-   real execution time
-   validation of bot token and chat id
-   preventing panic on empty input

### Modified

-   argument `--interval`/`-i` now indicating the interval of pushing notification regardless notify frequency
-   default value of argument `--interval` has been set to 30(seconds)

## 0.1.3

### Added

-   support of argument `--send-file`
    sending all message in text file `$session_$ts.txt`
-   support of argument `--debug`
-   support of argument `--silent`
    only sending _started_ and _ended_ message to chat

### Modified

-   using `axios` instead `fetch`

## 0.1.2

### Modified

-   rewrote from `deno` to `node`
-   rewrote argument parser

## 0.1.1

### Added

-   support of flag `--version` / `-V`
-   support of argument `--session` / `-s`
-   support of argument `--interval` / `-i`
-   support of argument `--tags` / `-t`
-   support of argument `--frequency` / `-f`
-   support of argument `--chat`
-   support of argument `--token`

### Improved

-   handle of interrupt

## 0.1.0
