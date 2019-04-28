#!/bin/bash

echo "staging any existing changes"
git add -A

echo "clean useless files in src/"
rm src/*

echo "copy over package.json"
cp utils/package.json .
cp utils/utils.js src/

echo "cleanup modules and locks"
rm -fr node_modules package-lock.json
