# shell notification telegram bot

> Pushing notification to your telegram

## Usage

Set your bot API `token` and `chat_id` in environment variables, or specify in command

-   How to get a `token` or a `bot`: apply from [@BotFather](tg://resolve?domain=BotFather)
-   How to get `chat_id`:
    _PS_. `chat_id` of private chat is your `user_id` (not your `username`)

    **by using bot API**

    noticed this method will not working when your bot deployed in kinds of listening mode, like `polling`enabled in `node-telegram-bot-api`

    -   send something in chat
    -   open `https://api.telegram.org/bot<your token here>/getUpdates` with your browser (replace with your own token)
    -   your `chat_id` should be `response.result[?].message.chat.id`

    **by using other bot** _may have security issue_

```shell
# set env in your .bash_profile or .zshrc
BOT_NOTIFY_TOKEN="bot token here"
BOT_NOTIFY_CHAT="chat id here"
```

voilà

```shell
python train.py |& notify

# or specify(or overwrite env var) in command options
python train.py |& notify --token "bot token here" --chat "chat id here"
```

### Arguments

|                   | description                                                                                                                                                                                  | default                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `--version`/`-V`  | display version                                                                                                                                                                              |                                               |
| `--help`/`-h`     | 🚧 not available yet                                                                                                                                                                         |                                               |
| `--token`         | token of your bot (Telegram)                                                                                                                                                                 | using environment variable `BOT_NOTIFY_TOKEN` |
| `--chat`          | id of target chat (Telegram)                                                                                                                                                                 | using environment variable `BOT_NOTIFY_CHAT`  |
| `--tags`/`-t`     | hashtag append to notification                                                                                                                                                               | null                                          |
| `--session`/`-s`  | session name of notification                                                                                                                                                                 | random 4 bits length `hex`                    |
| `--interval`/`-i` | interval of pushing outputs regardless `frequency`                                                                                                                                           | `30` (in seconds)                             |
| `--dynamic`       | dynamic update output                                                                                                                                                                        | `true`                                        |
| `--silent`        | bot will only notify you at start and end                                                                                                                                                    | false                                         |
| `--send-file`     | send output as txt documents instead of text                                                                                                                                                 | false                                         |
| `--length-safe`   | trim outputs which length larger than 4096 (single Telegram text message's capacity), sending last 4096 length part as text, and rest part as file (regardless send-as-file mode is enabled) | true                                          |

## Build

download prebuilt binaries from [release page](https://github.com/MamoruDS/shell-notify-telegram-bot/releases)

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
