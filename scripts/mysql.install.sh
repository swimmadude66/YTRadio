#!/bin/bash
# MySQL install script

set -e # Exit script immediately on first error.
set -x # Print commands and their arguments as they are executed.

apt-get update

# automate setting root password
export DEBIAN_FRONTEND=noninteractive
debconf-set-selections <<< 'mysql-server mysql-server/root_password password abc123'
debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password abc123'

echo "Installing MySQL..."
apt-get install mysql-server -y

echo "Setting up quick access to MySQL DB..."
echo "[client]" >> /etc/mysql/my.cnf
echo "user=root" >> /etc/mysql/my.cnf
echo "password=abc123" >> /etc/mysql/my.cnf