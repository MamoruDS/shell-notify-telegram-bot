const parser = (args: string[]): { [key: string]: string[] } => {
    let key: string = ''
    const _args = {} as { [key: string]: string[] }
    for (let arg of args) {
        const re = new RegExp(/[-]{1,2}([^\s|=]+)=?([^$]{0,})/)
        const match = re.exec(arg)
        if (match == null) {
            if (!key) {
                console.error(`unknown argument ${arg}`)
                Deno.exit(1)
            } else {
                _args[key].push(arg)
            }
        } else {
            key = match[1]
            arg = match[2]
            _args[key] = []
            if (arg) _args[key].push(arg)
        }
    }
    return _args
}

export { parser }
