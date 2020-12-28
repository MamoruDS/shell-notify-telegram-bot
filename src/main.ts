#!/usr/bin/env deno --allow-env --allow-net
import { randStr, safeMDv2, wait } from './utils.ts'
import { parser } from './args.ts'

const VERSION = '0.1.1'

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

const _listener = async (): Promise<string> => {
    const buf = new Uint8Array(1024)
    const _n = <number>await Deno.stdin.read(buf)
    const output = new TextDecoder().decode(buf.subarray(0, _n))
    return output.trim()
}

const _interruptHandle = async () => {
    for await (const _ of Deno.signal(Deno.Signal.SIGINT)) {
        if (!OPT._exit) {
            OPT._exit = true
            await send(Infinity)
            await end(true)
            Deno.exit(0)
        }
    }
}

const _checker = async () => {
    while (true) {
        if (typeof OPT._end == 'number' && !OPT._exit) {
            OPT._exit = true
            await send(Infinity)
            await end()
            Deno.exit(0)
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
            // `https://`,
            `https://api.telegram.org/bot${OPT.token}/sendMessage`,
            {
                method: 'GET',
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
            console.log(res.description)
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
    // console.log(OPT)
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
    const args = parser(Deno.args) as {
        [key in Argument]: string[]
    }
    const token = Deno.env.get('BOT_NOTIFY')
    const chat = Deno.env.get('BOT_NOTIFY_TO')

    if (args.version || args.V) {
        console.log('shell-notify-bot ' + VERSION)
        Deno.exit(0)
    }
    if (args.help || args.h) {
        // TODO: help
        Deno.exit(0)
    }

    OPT.session = args.session?.[0] || args.s?.[0] || OPT.session
    OPT.token = args.token?.[0] || token
    OPT.to = args.chat?.[0] || chat
    OPT.tags = args.tags || args.t || []
    OPT.notifyFreq =
        parseInt(args.frequency?.[0]) || parseInt(args.f?.[0]) || OPT.notifyFreq
    OPT.interval = parseInt(args.interval?.[0]) || OPT.interval
    OPT.initMsgId = await init()
    _checker()
    _interruptHandle()

    while (typeof OPT._end == 'undefined') {
        const output = await _listener()
        if (output == '') {
            OPT._end = Date.now()
        }
        OPT._output.push(
            output.replaceAll(/[\s|\u001b|\u009b]\[[0-9;]{1,}[a-z]?/gim, '')
        )
        console.log(output)
    }
}

export {}

run()
