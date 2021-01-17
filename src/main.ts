import { randStr, panic } from './utils'
import { CLIARGS } from './args'
import { OPT } from './types'
import { Notif } from './notif'

const OPT = {
    _start: Date.now(),
    _version: '0.2.2',
} as OPT

const _interruptHandle = () => {
    process.on('SIGINT', async () => {
        OPT._notif.end(true)
    })
}

const run = async (): Promise<void> => {
    const args = new CLIARGS({
        token: {
            type: 'string',
            default: process.env['BOT_NOTIFY_TOKEN'],
            optional: true,
            about: 'Specify token of notify-bot',
        },
        chat: {
            type: 'string',
            default: process.env['BOT_NOTIFY_CHAT'],
            optional: true,
            about: 'Specify chat_id where notification will sending to',
        },
        tags: {
            alias: 't',
            type: 'array',
            default: [],
            optional: true,
            about: 'Hashtag of session',
        },
        session: {
            alias: 's',
            type: 'string',
            optional: true,
            about: 'Sepcify session name',
        },
        interval: {
            alias: 'i',
            type: 'number',
            default: 10,
            optional: true,
            about: 'Interval of pushing notification',
        },
        dynamic: {
            alias: 'd',
            type: 'boolean',
            default: true,
            optional: true,
            about: 'Enable/Disable message dynamic updating',
        },
        silent: {
            type: 'boolean',
            default: false,
            optional: true,
            about: 'Enable/Disable silent mode',
        },
        'send-file': {
            type: 'boolean',
            default: false,
            optional: true,
            about:
                'Enable/Disable sending output as txt documents instead of text',
        },
        'length-safe': {
            type: 'boolean',
            default: true,
            optional: true,
            about: 'Enable/Disable length safe mode',
        },
        'idle-alert': {
            type: 'number',
            default: Infinity,
            optional: true,
            about: 'Specify idle alert time',
        },
    })
        .version(OPT._version)
        .name('shell-notify-bot')
        .about('Pushing notification to your telegram')
        .parse(process.argv.slice(2))
    OPT.idle = args['idle-alert'] * 1000
    OPT.interval = args.interval * 1000
    OPT.dynamic = args.dynamic
    OPT.sendFile = args['send-file']
    OPT.session = args.session || randStr(4).toLocaleUpperCase()
    OPT.silent = args.silent
    OPT.tags = args.tags
    OPT.to = args.chat
    OPT.token = args.token
    //
    if (!OPT.token) {
        panic({
            ok: false,
            description: 'No bot token specified',
        })
    } else if (!OPT.token.match(/[\d]{4,}:/)) {
        panic({
            ok: false,
            description: 'Invalid bot token format',
        })
    }
    if (!OPT.to) {
        panic({
            ok: false,
            description: 'No chat ID specified',
        })
    }
    _interruptHandle()
    OPT._notif = new Notif(
        OPT.dynamic,
        OPT.interval,
        OPT.sendFile,
        OPT.session,
        OPT.silent,
        OPT.tags,
        OPT.idle
    )
    OPT._notif.lengthSafe = args['length-safe']
    process.stdin.on('data', (buf) => {
        const o = buf.toString()
        process.stdout.write(o)
        OPT._notif.append(o)
    })
    process.stdin.on('end', () => {
        OPT._notif.end()
    })
}

export { OPT }

run()
