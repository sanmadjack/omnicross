#!/bin/sh
jq --tab -j '.|=sort_by(.title)' data.json > data.tmp
mv data.tmp data.json