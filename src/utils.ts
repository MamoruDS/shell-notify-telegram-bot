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

const safeTag = (input: string, safeMD?: boolean): string => {
    input =
        '#' +
        input
            .replace(/[\ |\.|\-|\|:|：]/gm, '_')
            .replace(/[\uff00-\uffff|\u0000-\u00ff]/g, (m: string) => {
                return /\w/.exec(m) == null ? '' : m
            })
    return safeMD ? safeMDv2(input) : input
}

const wait = async (interval: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, interval)
    })
}

const panic = (message: {
    ok?: boolean
    description?: string
    error?: Error
}): never => {
    console.error({ ok: false, ...message })
    process.exit(1)
}

/**
 * @param {number} duration duration in millisecond
 */
const humanizeDuration = (duration: number): [string, string] => {
    let t: [string, string]
    let d = Math.abs(duration)
    if (d < 500) {
        t = [d.toString(), 'ms']
    } else if (d < 300000) {
        t = [(d / 1000).toFixed(2), 'secs']
    } else if (d < 7200000) {
        t = [(d / 1000 / 60).toFixed(1), 'mins']
    } else {
        t = [(d / 1000 / 60 / 60).toFixed(1), 'hours']
    }
    return t
}

const copy = <T>(source: T): T => {
    if (source == null) return source
    if (Array.isArray(source)) {
        const _t = [] as any[]
        source.forEach((v) => {
            _t.push(copy(v))
        })
        return _t as any
    }
    if (typeof source === 'object') {
        if (source.constructor.name !== 'Object') {
            return source
        }
        const _t = {} as T
        for (const key of Object.keys(source)) {
            _t[key] = copy(source[key])
        }
        return _t
    }
    return source
}

const compObjCopy = <T extends object>(source: object): T => {
    if (typeof source != 'object' || source === null || Array.isArray(source)) {
        throw new TypeError()
    }
    if (source == {}) {
        return {} as T
    }
    const _t = {} as T
    for (const key of Object.keys(source)) {
        _t[key] = copy(source[key])
    }
    return _t
}

export {
    randStr,
    safeMDv2,
    safeTag,
    wait,
    panic,
    humanizeDuration,
    compObjCopy,
}
