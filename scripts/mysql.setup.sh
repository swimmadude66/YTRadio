#!/bin/bash
# MySQL setup script

set -e # Exit script immediately on first error.
set -x # Print commands and their arguments as they are executed.

echo "Running setup scripts for MySQL..."
bash /home/vagrant/scripts/db-setup.sh