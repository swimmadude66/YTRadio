#!/bin/sh

set -e
cd /app

echo "Cleaning Old Installs"
rm -rf node_modules dist

echo "Installing App Dependencies"
npm install

echo "Running Dev Build"
npm run dev
