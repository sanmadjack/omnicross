#!/bin/sh
jq --tab -j '.compilations|=sort_by(.title)' data.json > data.tmp
if [ $? -eq 0 ]; then
    mv data.tmp data.json
fi
