#!/bin/sh
for file in *.$1; do mv "$file" "${file%.$1}.$2" || true; done