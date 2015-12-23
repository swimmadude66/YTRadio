#!/bin/bash
# General setup script
#   Brings in the project files and installs server dependencies

set -e # Exit script immediately on first error.

echo "Updating..."
sudo apt-get update

echo "Installing GIT..."
sudo apt-get install -y git libkrb5-dev 

echo "Installing Nodejs and NPM..."
curl --silent --location https://deb.nodesource.com/setup_5.x | sudo bash -
sudo apt-get install -y build-essential g++ nodejs

echo "Installing grunt-cli..."
sudo npm install -g grunt-cli

echo "Installing PM2 server manager..."
sudo npm install pm2 -g

echo "rsyncing synced folder to vagrant user..."
rsync -a /vagrant/ /home/vagrant

echo "Installing dependencies..."
npm install