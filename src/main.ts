import * as fs from 'fs'

import { randStr, safeMDv2, wait } from './utils'
import { parser } from './args'
import { sendMessage, sendDocument } from './request'
import { OPT } from './types'

const OPT = {
    _start: Date.now(),
    _output: [],
    _version: '0.1.3',
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

const init = async (): Promise<number> => {
    const tags: string[] = OPT.tags
    const res = await sendMessage(
        '*\\[ NOTIFY \\]* session `' +
            OPT.session +
            '` _started_\\.' +
            (OPT.silent ? ' 🔇' : '') +
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
    await sendMessage(
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
    const text: string = OPT._output.splice(0, count).join('\n')
    if (OPT.silent) return
    if (OPT.sendFile) {
        const filename = `${OPT.session}_${Date.now()
            .toString(16)
            .toLocaleUpperCase()}.txt`
        fs.writeFileSync(filename, text)
        await sendDocument(filename, OPT.initMsgId)
        fs.unlinkSync(filename)
    } else {
        await sendMessage('```\n' + safeMDv2(text) + '\n```', OPT.initMsgId)
    }
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
                    console.log('shell-notify-bot ' + OPT._version)
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
        silent: {
            type: 'boolean',
            default: false,
            optional: true,
            description: '',
        },
        'send-file': {
            type: 'boolean',
            default: false,
            optional: true,
            description: '',
        },
        debug: {
            type: 'boolean',
            default: false,
            optional: true,
            description: '',
        },
    })
    OPT.debug = args.debug
    OPT.interval = Math.round(args.interval * 1000)
    OPT.notifyFreq = args.frequency
    OPT.sendFile = args['send-file']
    OPT.session = args.session
    OPT.silent = args.silent
    OPT.tags = args.tags
    OPT.to = args.chat
    OPT.token = args.token
    //
    OPT.initMsgId = await init()
    _checker()
    _interruptHandle()
    if (OPT.debug) {
        console.log(OPT)
    }
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

export { OPT }

run()
