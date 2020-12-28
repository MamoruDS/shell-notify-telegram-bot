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

export { randStr, safeMDv2, wait }
