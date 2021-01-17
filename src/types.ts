import { Notif } from './notif'

export type OPT = {
    dynamic: boolean
    idle: number
    interval: number
    sendFile: boolean
    session: string
    silent: boolean
    tags: string[]
    to?: string
    token?: string
    _notif: Notif
    _start: number
    _version: string
}

export type TGResponse = {
    ok: boolean
    error_code?: number
    description?: string
    result?: TGResult
}

export type TGResult = {
    message_id: number
    from: TGFrom
    chat: TGChat
    date: number
    text?: string
    entities?: object[]
}

export type TGFrom = {}
export type TGChat = {}
