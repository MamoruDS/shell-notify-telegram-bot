#!/bin/sh

_PLAT=$1
_ARCH=$2

rm -rf dist ; tsc
# platform freebsd, linux, alpine, macos, win
# arch x64, x86, armv6, armv7
pkg dist/main.js --target node14-$_PLAT-$_ARCH --output notify.temp

cp notify.temp notify
