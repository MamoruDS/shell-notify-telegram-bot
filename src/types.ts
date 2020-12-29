export type OPT = {
    debug: boolean
    initMsgId?: number
    interval: number
    notifyFreq: number
    sendFile: boolean
    session: string
    silent: boolean
    tags: string[]
    to?: string
    token?: string
    _end?: number
    _exit?: boolean
    _start: number
    _output: string[]
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
