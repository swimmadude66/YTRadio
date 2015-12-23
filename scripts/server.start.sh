#!/bin/bash
# Server start script

echo "Starting server..."
pm2 start processes.json

echo "DONE!"
echo "type: 'vagrant ssh' for SSH access."