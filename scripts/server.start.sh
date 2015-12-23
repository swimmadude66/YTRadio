#!/bin/bash
# Server start script

echo "Starting server with PM2..."
pm2 start processes.json

echo "DONE!"
echo "visit: 'http://192.168.33.10:8080/' for Lifeboat"
echo "type: 'vagrant ssh' for SSH access."