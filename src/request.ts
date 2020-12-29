import * as fs from 'fs'
import * as FormData from 'form-data'
import axios from 'axios'

import { OPT } from './main'
import { TGResponse } from './types'

const _error = (err: any) => {
    const res: TGResponse = err?.response?.data
    if (res) {
        console.error(res)
        process.exit(1)
    } else {
        console.error({
            ok: false,
            description: 'other unknown error',
            error: err,
        })
        process.exit(1)
    }
}

const sendMessage = async (
    text: string,
    reply?: number,
    silent: boolean = true
): Promise<TGResponse> => {
    try {
        const res = await axios.post(
            `https://api.telegram.org/bot${OPT.token}/sendMessage`,
            {
                chat_id: OPT.to,
                text: text,
                parse_mode: 'MarkdownV2',
                reply_to_message_id: reply,
                disable_notification: silent,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
        return res.data as TGResponse
    } catch (e) {
        _error(e)
    }
}

const sendDocument = async (
    path: string,
    reply?: number,
    silent: boolean = true
): Promise<TGResponse> => {
    try {
        const form = new FormData()
        form.append('chat_id', OPT.to)
        form.append('document', fs.createReadStream(path))
        if (reply) {
            form.append('reply_to_message_id', reply)
        }
        if (silent) {
            form.append('disable_notification', silent ? 'true' : 'false')
        }
        const res = await axios.post(
            `https://api.telegram.org/bot${OPT.token}/sendDocument`,
            form,
            {
                headers: form.getHeaders(),
            }
        )
        return res.data as TGResponse
    } catch (e) {
        _error(e)
    }
}

export { sendDocument, sendMessage }
