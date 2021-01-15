import { panic } from './utils'

type TypeConv<T> = T extends 'string'
    ? string
    : T extends 'boolean'
    ? boolean
    : T extends 'number'
    ? number
    : T extends 'array'
    ? string[]
    : never

type Option<T extends 'string' | 'boolean' | 'number' | 'array'> = {
    type: T
    alias?: string
    default?: TypeConv<T>
    optional?: boolean
    about?: string
    fn?: (value: TypeConv<T>) => Promise<void>
}

type Options = {
    [key: string]:
        | Option<'string'>
        | Option<'boolean'>
        | Option<'number'>
        | Option<'array'>
}

type OptionsVal<T extends Options> = {
    [key in keyof T]: TypeConv<T[key]['type']>
}

const parser = <T extends Options>(
    args: string[],
    options: T
): OptionsVal<T> => {
    let _k: string | undefined
    const _args = {} as { [key: string]: any }
    const _opts = {} as { [key: string]: string }
    for (const key of Object.keys(options)) {
        _opts[key] = key
        _opts[options[key].alias] = key
    }
    delete _opts['undefined']

    const _add = (key: string, val?: string) => {
        if (!key) {
            // key undefined
            panic({ description: `No such subcommand '${val}'` })
        }
        const _key = _opts[key]
        const type = options[_key]?.type
        if (!type) {
            // key not defined
            panic({ description: `Unknown option '${key}'` })
        }
        if (!val) {
            // init
            if (type != 'boolean') {
                _k = _key
                _args[_key] = null
            } else {
                _args[_key] = true
            }
        } else {
            // add new val
            if (type == 'string') {
                _args[_key] = val
            }
            if (type == 'number') {
                _args[_key] = parseInt(val)
            }
            if (type == 'boolean') {
                _args[_key] = val == 'true' ? true : false
            }
            if (type == 'array') {
                if (!_args[_key]) _args[_key] = []
                _args[_key].push(val)
            }
        }
    }

    for (let a of args) {
        const r = new RegExp(/^([-]{1,2})([^\s|=]+)=?([^$]{0,})/)
        const m = r.exec(a)
        if (m == null) {
            _add(_k, a)
        } else {
            if (m[1].length == 1) {
                // -
                _k = undefined
                const _keys = m[2].split('')
                if (_keys.length > 1) {
                    for (const _key of _keys) {
                        _add(_key)
                    }
                    _k = undefined
                } else {
                    _add(m[2], m[3])
                }
            } else {
                // --
                if (m[2].substr(0, 3) == 'no-') {
                    _add(m[2].substr(3), 'false')
                } else {
                    _add(m[2], m[3])
                }
            }
        }
    }
    for (const key of Object.keys(options)) {
        const opt = options[key] as Option<'string'>
        if (typeof _args[key] == 'undefined') {
            if (!opt.optional) {
                panic({ description: `Missing required argument: ${key}` })
            }
            _args[key] = opt.default
        }
        if (opt.fn) {
            opt.fn(_args[key])
        }
    }
    return _args as OptionsVal<T>
}

export { parser }
