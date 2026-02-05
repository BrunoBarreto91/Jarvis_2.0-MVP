# --- 1. CONFIGURAÇÃO DE BACKEND E PROVIDER ---
terraform {
  # O backend S3 usa as credenciais do ambiente ($env:AWS_ACCESS_KEY_ID), não as do tfvars.
  backend "s3" {
    bucket = "jarvis-terraform-state-bruno"
    key    = "jarvis/server/terraform.tfstate"
    region = "us-east-1"
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

# --- 2. VARIÁVEIS ---

variable "aws_access_key" {
  type      = string
  sensitive = true
}

variable "aws_secret_key" {
  type      = string
  sensitive = true
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "my_ip" {
  type        = string
  description = "Seu IP Público no formato x.x.x.x/32"
}

variable "ssh_key_name" {
  type        = string
  description = "Nome exato do par de chaves SSH na AWS (definido no terraform.tfvars)"
  # REMOVIDO 'default' para garantir leitura do tfvars
}

variable "n8n_user" {
  type    = string
  default = "admin"
}

variable "n8n_pass" {
  type      = string
  sensitive = true
}

variable "admin_setup_key" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

# --- 3. DATA SOURCES (LEITURA DA INFRA EXISTENTE) ---

data "aws_vpc" "existing_vpc" {
  id = "vpc-0f43147f2f69aad12"
}

data "aws_subnet" "public_subnet" {
  id = "subnet-070c4e0af2d70dc80"
}

data "aws_security_group" "existing_sg" {
  id = "sg-098b15ea36d6387bc"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# RDS como Data Source (Apenas Leitura - Proteção contra destruição)
data "aws_db_instance" "jarvis_db" {
  db_instance_identifier = "terraform-20251229185442948200000001"
}

# --- 4. NOVOS RECURSOS (ORQUESTRADOR N8N) ---

# Security Group do n8n
resource "aws_security_group" "n8n_sg" {
  name        = "jarvis-n8n-sg-v6" # v6 para forçar atualização limpa se necessário
  description = "Security Group para o orquestrador n8n"
  vpc_id      = data.aws_vpc.existing_vpc.id

  # SSH (Restrito ao seu IP)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
  }

  # Porta do n8n
  ingress {
    from_port   = 5678
    to_port     = 5678
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Regra de Acesso ao Banco (Injetada no SG Legado)
resource "aws_security_group_rule" "allow_n8n_to_rds" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.n8n_sg.id
  security_group_id        = data.aws_security_group.existing_sg.id
  description              = "Acesso do n8n ao banco legado"
}

# IAM Role e Profile
resource "aws_iam_role" "n8n_ec2_role" {
  name = "jarvis-n8n-ec2-role-v3"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_instance_profile" "n8n_profile" {
  name = "jarvis-n8n-profile-v3"
  role = aws_iam_role.n8n_ec2_role.name
}

# Instância n8n
resource "aws_instance" "n8n_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  subnet_id     = data.aws_subnet.public_subnet.id

  vpc_security_group_ids = [aws_security_group.n8n_sg.id]
  key_name               = var.ssh_key_name # Lê do tfvars: "bruno-terraform-deployer"
  iam_instance_profile   = aws_iam_instance_profile.n8n_profile.name

  # User Data para instalação e boot
  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y docker.io docker-compose-plugin
              systemctl start docker
              systemctl enable docker

              TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
              PUBLIC_IP=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/public-ipv4)

              mkdir -p /home/ubuntu/n8n
              cat <<EOT >> /home/ubuntu/n8n/docker-compose.yml
              version: '3.8'
              services:
                n8n:
                  image: n8nio/n8n:latest
                  ports:
                    - "5678:5678"
                  environment:
                    - N8N_BASIC_AUTH_ACTIVE=true
                    - N8N_BASIC_AUTH_USER=${var.n8n_user}
                    - N8N_BASIC_AUTH_PASSWORD=${var.n8n_pass}
                    - WEBHOOK_URL=http://\$PUBLIC_IP:5678/
                    - DB_TYPE=mysqldb
                    - DB_MYSQLDB_DATABASE=jarvis_db
                    - DB_MYSQLDB_HOST=${data.aws_db_instance.jarvis_db.address}
                    - DB_MYSQLDB_PORT=${data.aws_db_instance.jarvis_db.port}
                    - DB_MYSQLDB_USER=admin
                    - DB_MYSQLDB_PASSWORD=${var.db_password}
                    - GENERIC_TIMEZONE=America/Sao_Paulo
                  volumes:
                    - n8n_data:/home/node/.n8n
                  restart: always
              volumes:
                n8n_data:
              EOT

              chown -R ubuntu:ubuntu /home/ubuntu/n8n
              cd /home/ubuntu/n8n
              docker compose up -d
              EOF

  tags = { Name = "jarvis-n8n-server" }
}

resource "aws_eip" "n8n_eip" {
  instance = aws_instance.n8n_server.id
  domain   = "vpc"
}

# --- 5. OUTPUTS ---
output "n8n_url" {
  value = "http://${aws_eip.n8n_eip.public_ip}:5678"
}

output "ssh_command" {
  value = "ssh -i ${var.ssh_key_name}.pem ubuntu@${aws_eip.n8n_eip.public_ip}"
}