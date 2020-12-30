# shell notification telegram bot

> Pushing notification to your telegram

## Usage

```shell
python train.py |& notify
```

### arguments

|                    | description                                        | default                                       |
| ------------------ | -------------------------------------------------- | --------------------------------------------- |
| `--version`/`-V`   | display version                                    |                                               |
| `--help`/`-h`      | 🚧 not available yet                               |                                               |
| `--token`          | token of your bot (Telegram)                       | using environment variable `BOT_NOTIFY_TOKEN` |
| `--token`          | id of target chat (Telegram)                       | using environment variable `BOT_NOTIFY_CHAT`  |
| `--tags`/`-t`      | hashtag append to notification                     | null                                          |
| `--session`/`-s`   | session name of notification                       | random 4 bits length `hex`                    |
| `--interval`/`-i`  | interval of pushing outputs regardless `frequency` | `30` (in seconds)                             |
| `--frequency`/`-f` | frequency of pushing outputs                       | `10`                                          |
| `--silent`         | bot will only notify you at start and end          | false                                         |
| `--send-file`      | send output as txt documents instead of text       | false                                         |
| `--debug`          |                                                    | false                                         |

## Build

download from [release page](https://github.com/MamoruDS/shell-notify-telegram-bot/releases)

```shell
tar -zvxf notify_0.1.4_linux_x64.tar.gz
sudo mv notify /usr/local/bin
```

or build from source:

```shell
git clone https://github.com/MamoruDS/shell-notify-telegram-bot.git
cd shell-notify-telegram-bot

# typescript is required
npm i

# build by using `pkg`
pkg dist/main.js --output bin/notify \
    && sudo mv bin/notify /usr/local/bin

```

## Changelog

[link](https://github.com/MamoruDS/shell-notify-telegram-bot/blob/ts/CHANGELOG.md) of changelogs.

## License

MIT © MamoruDS
