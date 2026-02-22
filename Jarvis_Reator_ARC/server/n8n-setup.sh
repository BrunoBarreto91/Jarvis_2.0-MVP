#!/bin/bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

mkdir -p /home/ubuntu/n8n
cat << 'EOT' > /home/ubuntu/n8n/docker-compose.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=PLACEHOLDER_PASS
      - N8N_SECURE_COOKIE=false
      - WEBHOOK_URL=http://54.235.133.99:5678/
      - DB_TYPE=mysqldb
      - DB_MYSQLDB_DATABASE=jarvis_db
      - DB_MYSQLDB_HOST=terraform-20251229185442948200000001.c4v2kmo8kksg.us-east-1.rds.amazonaws.com
      - DB_MYSQLDB_PORT=3306
      - DB_MYSQLDB_USER=admin
      - DB_MYSQLDB_PASSWORD=Stark.2026.db
      - GENERIC_TIMEZONE=America/Sao_Paulo
    volumes:
      - n8n_data:/home/node/.n8n
    restart: always
volumes:
  n8n_data:
EOT

cd /home/ubuntu/n8n
sudo docker compose up -d
