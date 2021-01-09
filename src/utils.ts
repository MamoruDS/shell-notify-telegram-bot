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

const panic = (message: object): never => {
    console.error(message)
    process.exit(1)
}

/**
 * @param {numer} duration duration in millisecond
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

export { randStr, safeMDv2, wait, panic, humanizeDuration }
