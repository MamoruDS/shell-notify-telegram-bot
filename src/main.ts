import { randStr, safeMDv2, wait } from './utils'
import { parser } from './args'
import fetch from 'node-fetch'

const VERSION = '0.1.2'

type OPT = {
    token?: string
    to?: string
    initMsgId?: number
    notifyFreq: number
    interval: number
    session: string
    tags: string[]
    _output: string[]
    _start: number
    _end?: number
    _exit?: boolean
}

type TGResponse = {
    ok: boolean
    error_code?: number
    description?: string
    result?: TGResult
}

type TGResult = {
    message_id: number
    from: TGFrom
    chat: TGChat
    date: number
    text?: string
    entities?: object[]
}

type TGFrom = {}
type TGChat = {}

type Argument =
    | 'h'
    | 'help'
    | 'V'
    | 'version'
    | 's'
    | 'session'
    | 'interval'
    | 'o'
    | 'output'
    | 't'
    | 'tags'
    | 'f'
    | 'frequency'
    | 'chat'
    | 'token'

const OPT = {
    notifyFreq: 10,
    interval: 1000,
    session: randStr(4).toLocaleUpperCase(),
    tags: [],
    _output: [],
    _start: Date.now(),
} as OPT

const _interruptHandle = () => {
    process.on('SIGINT', async () => {
        if (!OPT._exit) {
            OPT._exit = true
            await send(Infinity)
            await end(true)
            process.exit(0)
        }
    })
}

const _checker = async () => {
    while (true) {
        if (typeof OPT._end == 'number' && !OPT._exit) {
            OPT._exit = true
            await send(Infinity)
            await end()
            process.exit(0)
        } else {
            if (OPT._output.length >= OPT.notifyFreq) {
                send()
            }
            await wait(OPT.interval)
        }
    }
}

const _send = async (
    text: string,
    reply?: number,
    silent: boolean = true
): Promise<TGResponse> => {
    try {
        const _res = await fetch(
            `https://api.telegram.org/bot${OPT.token}/sendMessage`,
            {
                method: 'POST',
                body: JSON.stringify({
                    chat_id: OPT.to,
                    text: text,
                    parse_mode: 'MarkdownV2',
                    reply_to_message_id: reply,
                    disable_notification: silent,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
        const res: TGResponse = await _res.json()
        if (res.ok) {
        } else {
            // TODO: handle api error
            if (res.error_code == 401) {
                // handle Unauthorized
                throw new Error('Unauthorized')
            }
        }
        return res
    } catch (e) {
        // TODO: handle error
        throw new Error(e)
    }
}

const init = async (): Promise<number> => {
    const tags: string[] = OPT.tags
    const res = await _send(
        '*\\[ NOTIFY \\]* session `' +
            OPT.session +
            '` _started_\\.' +
            (tags.length
                ? '\n' +
                  tags
                      .map((t) => {
                          return `\\#${t}`
                      })
                      .join(' ')
                : ''),
        undefined,
        false
    )
    return res.result?.message_id || -1
}

const end = async (interrupted?: boolean): Promise<void> => {
    const eType: string = interrupted ? 'has been _interrupted_' : '_ended_'
    const dt = ((OPT._end || Date.now()) - OPT._start) / 1000
    await _send(
        '*\\[ NOTIFY \\]* session `' +
            OPT.session +
            '` ' +
            eType +
            '\\.\nExecution time: `' +
            dt.toFixed(1) +
            '`sec',
        OPT.initMsgId,
        false
    )
}

const send = async (count: number = OPT.notifyFreq): Promise<void> => {
    const _pend: string[] = OPT._output.splice(0, count)
    await _send('```\n' + safeMDv2(_pend.join('\n')) + '\n```', OPT.initMsgId)
}

const run = async (): Promise<void> => {
    const args = parser(process.argv.slice(2), {
        version: {
            type: 'boolean',
            alias: 'V',
            default: false,
            optional: true,
            description: 'Show version',
            fn: async (val) => {
                if (val) {
                    console.log('shell-notify-bot ' + VERSION)
                    process.exit(0)
                }
            },
        },
        help: {
            type: 'boolean',
            alias: 'h',
            default: false,
            optional: true,
            description: 'Show version',
            fn: async (val) => {
                if (val) {
                    // TODO:
                    process.exit(0)
                }
            },
        },
        token: {
            type: 'string',
            default: process.env['BOT_NOTIFY_TOKEN'],
            optional: true,
            description: 'Specify token of notify-bot',
        },
        chat: {
            type: 'string',
            default: process.env['BOT_NOTIFY_CHAT'],
            optional: true,
            description: 'Specify chat_id where notification will sending to',
        },
        tags: {
            alias: 't',
            type: 'array',
            default: [],
            optional: true,
            description: 'Hashtag of session',
        },
        session: {
            alias: 's',
            type: 'string',
            default: randStr(4).toLocaleUpperCase(),
            optional: true,
            description: 'Sepcify session name',
        },
        interval: {
            alias: 'i',
            type: 'number',
            default: 5,
            optional: true,
            description: '',
        },
        frequency: {
            alias: 'f',
            type: 'number',
            default: 10,
            optional: true,
            description: '',
        },
        output: {
            alias: 'o',
            type: 'string',
            optional: true,
            description: '',
        },
    })
    OPT.session = args.session
    OPT.token = args.token
    OPT.to = args.chat
    OPT.tags = args.tags
    OPT.notifyFreq = args.frequency
    OPT.interval = Math.round(args.interval * 1000)
    OPT.initMsgId = await init()
    _checker()
    _interruptHandle()

    process.stdin.on('data', (buf) => {
        const output = buf.toString().trim()
        OPT._output.push(
            output.replace(/[\s|\u001b|\u009b]\[[0-9;]{1,}[a-z]?/gim, '')
        )
        console.log(output)
    })
    process.stdin.on('end', () => {
        OPT._end = Date.now()
    })
}

export {}

run()
