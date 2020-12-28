#!/bin/sh

_VERSION=$(jq -r ".version" package.json)

rm -rf dist ; tsc

# platform freebsd, linux, alpine, macos, win
# arch x64, x86, armv6, armv7

# linux_64
pkg dist/main.js --target node14-linux-x64 --output notify \
    && tar zvcf release/notify_${_VERSION}_linux_x64.tar.gz notify > /dev/null \
    && rm notify \
    && echo "> build complete: notify_${_VERSION}_linux_x64.tar.gz"

# macos_64
pkg dist/main.js --target node14-macos-x64 --output notify \
    && tar zvcf release/notify_${_VERSION}_macos_x64.tar.gz notify > /dev/null \
    && rm notify \
    && echo "> build complete: notify_${_VERSION}_macos_x64.tar.gz"

# win_64
pkg dist/main.js --target node14-win-x64 --output notify.exe \
    && zip release/notify_${_VERSION}_win_x64.zip notify.exe > /dev/null \
    && rm notify.exe \
    && echo "> build complete: notify_${_VERSION}_win_x64.zip"
