#!/usr/bin/env deno --allow-env --allow-net

const randStr = (length: number): string => {
    return new Array(length)
        .fill(0)
        .map((_) => {
            return Math.round(Math.random() * 15).toString(16)
        })
        .join('')
}

const safeMDv2 = (input: string): string => {
    // https://core.telegram.org/bots/api#markdownv2-style
    return input.replace(
        /(?<!\\)[\_\*\[\]\(\)\~\`\>\#\+\-\=\|\{\}\.\!]/gm,
        (match, ...M) => {
            return '\\' + match
        }
    )
}

const wait = async (interval: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, interval)
    })
}

type OPT = {
    token?: string
    to?: string
    initMsgId?: number
    notifyStep: number
    interval: number
    session: string
    _output: string[]
    _start: number
    _end?: number
}
// TODO: hash tag support

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

const OPT = {
    notifyStep: 10,
    interval: 1000,
    session: randStr(4).toLocaleUpperCase(),
    _output: [],
    _start: Date.now(),
} as OPT

const listener = async (): Promise<string> => {
    const buf = new Uint8Array(1024)
    const _n = <number>await Deno.stdin.read(buf)
    const output = new TextDecoder().decode(buf.subarray(0, _n))
    return output.trim()
}

const checker = async () => {
    while (true) {
        if (typeof OPT._end == 'number') {
            await send(Infinity)
            await end()
            Deno.exit(0)
        } else {
            if (OPT._output.length >= OPT.notifyStep) {
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
    const tags: string[] = []
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

const end = async (): Promise<void> => {
    // console.log(OPT)
    const dt = ((OPT._end || Date.now()) - OPT._start) / 1000
    const res = await _send(
        '*\\[ NOTIFY \\]* session `' +
            OPT.session +
            '` _ended_\\.\nExecution time: `' +
            dt.toFixed(1) +
            '`sec',
        OPT.initMsgId,
        false
    )
}

const send = async (count: number = OPT.notifyStep): Promise<void> => {
    const _pend: string[] = OPT._output.splice(0, count)
    await _send('```\n' + safeMDv2(_pend.join('\n')) + '\n```', OPT.initMsgId)
}

const run = async (): Promise<void> => {
    const token = Deno.env.get('BOT_NOTIFY')
    const to = Deno.env.get('BOT_NOTIFY_TO')
    OPT.token = token
    OPT.to = to
    OPT.initMsgId = await init()
    checker()

    while (typeof OPT._end == 'undefined') {
        const output = await listener()
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
