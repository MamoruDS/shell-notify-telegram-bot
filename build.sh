#!/bin/sh
mkdir dist || echo '' > /dev/null

cd src
deno compile --unstable main.ts
mv src ../dist/notify
