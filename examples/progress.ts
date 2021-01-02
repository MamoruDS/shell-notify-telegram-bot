#!/usr/bin/env -S deno run

const TARGET = 100
const INTERVAL = 100
const BAR_LEN = 20

const encoder = new TextEncoder()

const print = (cur: number): void => {
    const _prog = Math.round((cur / TARGET) * BAR_LEN)
    let _bl = BAR_LEN - _prog
    _bl = _bl < 0 ? 0 : _bl
    const bar = `\r[${'■'.repeat(_prog)}${'-'.repeat(_bl)}]`
    Deno.stdout.write(encoder.encode(`${bar} ${cur.toFixed(2)}/${TARGET}`))
}

const next = (cur: number, step: number) => {
    if (cur >= TARGET) {
        print(TARGET)
        Deno.stdout.write(encoder.encode('\ndone.\n'))
        return
    }
    cur += Math.random() * step
    print(cur)
    setTimeout(() => {
        next(cur, step)
    }, INTERVAL)
}

console.log('some progress:')

next(0, 5)
