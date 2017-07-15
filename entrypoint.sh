#!/bin/sh

set -e
cd /app

echo "Installing App Dependencies"
npm install

echo "Running Dev Build"
npm run dev
