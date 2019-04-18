#!/bin/bash

echo "staging any existing changes"
git add -A

echo "clean useless files in src/"
rm src/config* src/order* src/trans* src/local*

echo "copy over package.json"
cp utils/package.json .

echo "cleanup modules and locks"
rm -fr node_modules package-lock.json
