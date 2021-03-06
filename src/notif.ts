import * as fs from 'fs'
import { EventEmitter } from 'events'

import { humanizeDuration, safeMDv2, safeTag, wait } from './utils'
import { editMessageText, sendDocument, sendMessage } from './request'
import { TGResponse } from './types'

const MAX_MSG_LEN = 4096

const errHijack = (err: any): TGResponse => {
    const r: TGResponse = err?.response?.data
    if (r?.error_code == 429) {
        return {
            ok: false,
            result: {
                from: {},
                chat: {},
                date: -1,
                message_id: undefined,
            },
        }
    }
    if (r?.error_code == 400) {
        return {
            ok: false,
            result: {
                from: {},
                chat: {},
                date: -1,
                message_id: -1,
            },
        }
    }
    return undefined
}

class Notif {
    readonly dynamic: boolean
    readonly interval: number
    readonly session: string
    readonly sendAsFile: boolean
    readonly silent: boolean
    readonly startAt: number
    private _endAt: number
    private _initMsgID: number
    private _alertMsgID: number
    private _event: EventEmitter
    private _output: string[]
    private _uID: number
    private _sent: [number, number, number, boolean][] // start, end, msgID, mut
    private _reqMsgLock: boolean
    private _reqIDALock: boolean
    private _isInterrupted: boolean
    private _lastUpdate: number
    private _lengthSafe: boolean
    private _idleAlert: number
    constructor(
        dynamic: boolean,
        interval: number,
        sendAsFile: boolean,
        session: string,
        silent: boolean,
        tags: string[],
        idleAlert: number = Infinity
    ) {
        this.startAt = Date.now()
        this.dynamic = dynamic
        this.interval = interval
        this.sendAsFile = sendAsFile
        this.session = session
        this.silent = silent
        this._event = new EventEmitter()
        this._output = ['']
        this._sent = []
        this._reqMsgLock = false
        this._reqIDALock = false
        this._lastUpdate = Date.now()
        this._lengthSafe = false
        this._idleAlert = idleAlert
        this._init(tags)
        this._checker()
        this._event.on('update', () => {
            if (this.dynamic) this._setPendingMut(this._uID)
        })
        this._event.on('sent', () => {
            this._presend()
        })
        this._event.on('exit', async () => {
            await this.ready()
            this._pending()
        })
        this._event.on('close', () => {
            if (this._isInterrupted) {
                process.exit(1)
            } else {
                process.exit(0)
            }
        })
    }
    set lengthSafe(val: boolean) {
        this._lengthSafe = val
    }
    get lengthSafe(): boolean {
        return this._lengthSafe
    }
    end(interrupted?: boolean): void {
        this._isInterrupted = interrupted || this._isInterrupted
        this._endAt = Date.now()
        this._event.emit('exit')
    }
    private async _init(tags: string[]): Promise<void> {
        const res = await sendMessage(
            '*\\[ NOTIFY \\]* session `' +
                this.session +
                '` _started_\\.' +
                (this.silent ? ' 🔇' : '') +
                (tags.length
                    ? '\n' +
                      tags
                          .map((t) => {
                              return safeTag(t, true)
                          })
                          .join(' ')
                    : ''),
            undefined,
            false
        )
        this._initMsgID = res.result?.message_id || -1
        this._event.emit('ready')
    }
    private async _end(interrupted?: boolean): Promise<void> {
        const eType: string = interrupted ? 'has been _interrupted_' : '_ended_'
        const dt = (this._endAt || Date.now()) - this.startAt
        const execTime: [string, string] = humanizeDuration(dt)
        this._reqMsgLock = true
        await sendMessage(
            '*\\[ NOTIFY \\]* session `' +
                this.session +
                '` ' +
                eType +
                '\\.\nExecution time: `' +
                safeMDv2(execTime[0]) +
                '`' +
                execTime[1],
            this._initMsgID,
            false
        )
        this._reqMsgLock = false
        this._event.emit('close')
    }
    private async _alert(): Promise<void> {
        if (this._reqIDALock) return
        this._reqIDALock = true
        const idleTime: [string, string] = humanizeDuration(
            Date.now() - this._lastUpdate
        )
        let res: TGResponse
        const msg = `*\\[ NOTIFY \\]*\n💭 Idle since \`${safeMDv2(
            idleTime[0]
        )}\`${idleTime[1]} ago`
        if (!this._alertMsgID) {
            res = await sendMessage(msg, this._initMsgID, false, errHijack)
        } else {
            res = await editMessageText(msg, this._alertMsgID, errHijack)
        }
        this._alertMsgID = Number.isNaN(this._alertMsgID)
            ? undefined
            : res.ok
            ? res.result?.message_id
            : undefined
        this._reqIDALock = false
    }
    async ready(): Promise<void> {
        return new Promise((resolve) => {
            if (typeof this._initMsgID == 'number') {
                resolve()
            }
            this._event.once('ready', () => {
                resolve()
            })
        })
    }
    private _setPendingMut(id: number): void {
        id -= 1
        for (const s of this._sent) {
            if (id >= s[0] && id <= s[1]) {
                s[3] = true
            }
        }
    }
    private async _checker(): Promise<void> {
        while (true) {
            this._pending()
            if (Date.now() - this._lastUpdate > this._idleAlert) {
                this._alert()
            }
            if (typeof this._endAt == 'number') {
                break
            } else {
                await wait(this.interval)
            }
        }
    }
    private async _pending(): Promise<void> {
        let msgs: string[]
        if (this.silent) {
            msgs = []
        } else {
            if (this._output[0] && this.dynamic) {
                msgs = this._output.slice(0, this._uID && -this._uID)
            } else {
                msgs = this._output.slice(1, this._uID && -this._uID)
            }
        }
        if (msgs.length) {
            const _start = this._uID ?? 0
            const _end = _start + msgs.length - 1
            if (!this._uID) {
                this._uID = msgs.length
            } else {
                this._uID += msgs.length
            }
            this._sent.push([_start, _end, undefined, false])
        }
        if (typeof this._initMsgID == 'number' && !this._reqMsgLock) {
            this._presend()
        }
    }
    private async _presend(): Promise<void> {
        const _sent = this._sent.filter((s) => {
            return typeof s[2] == 'undefined' || s[3]
        })
        if (!_sent.length) {
            if (this._endAt) {
                this._end(this._isInterrupted)
            }
        } else {
            const _su = _sent[0][3]
            _sent[0][3] = false
            const msgID = await this._send(
                this._output
                    .slice(-_sent[0][1] - 1, -_sent[0][0] || undefined)
                    .reverse()
                    .join('\n'),
                _sent[0][2]
            )
            if (msgID) {
                _sent[0][2] = msgID
                if (this._endAt) {
                    this._event.emit('sent')
                }
            } else {
                _sent[0][3] = _su
            }
        }
    }
    private async _send(
        msg: string,
        messageID?: number,
        sendAsFile?: boolean
    ): Promise<number> {
        sendAsFile = sendAsFile ?? this.sendAsFile
        if (this._reqMsgLock) return
        this._reqMsgLock = true
        let res: TGResponse
        if (this._lengthSafe && msg.length > MAX_MSG_LEN && !sendAsFile) {
            if (!messageID) {
                const _f = msg.substr(0, msg.length - MAX_MSG_LEN)
                this._send(_f, undefined, true)
                await wait(10)
            }
            const _s = msg.substr(-MAX_MSG_LEN)
            return await this._send(_s, messageID)
        }
        if (sendAsFile) {
            const filename = `${this.session}_${Date.now()
                .toString(16)
                .toLocaleUpperCase()}.txt`
            fs.writeFileSync(filename, msg)
            res = await sendDocument(filename, this._initMsgID, true, errHijack)
            fs.unlinkSync(filename)
        } else if (messageID) {
            res = await editMessageText(
                '```\n' + safeMDv2(msg) + '\n```',
                messageID,
                errHijack
            )
        } else {
            res = await sendMessage(
                '```\n' + safeMDv2(msg) + '\n```',
                this._initMsgID,
                true,
                errHijack
            )
        }
        this._reqMsgLock = false
        return res.result.message_id || messageID
    }
    private _append(input: string): void {
        if (this._output[0]) {
            this._event.emit('update')
        }
        this._output[0] = (this._output[0] + input).replace(/[^\r]*\r/g, '')
    }
    append(input: string): void {
        this._lastUpdate = Date.now()
        this._alertMsgID = this._reqIDALock ? NaN : undefined
        const _inputs = input
            .replace(/[\s|\u001b|\u009b]\[[0-9;]{1,}[a-z]?/gim, '')
            .split('\n')
        this._append(_inputs.shift())
        for (const i of _inputs) {
            this.newline()
            this._append(i)
        }
    }
    newline(): void {
        this._output.unshift('')
        this._event.emit('newline')
    }
}

export { Notif }
