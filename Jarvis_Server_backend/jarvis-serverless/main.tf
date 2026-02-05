# --- 1. CONFIGURAÇÃO DE BACKEND E PROVIDER ---

terraform {
  # O estado será armazenado no seu bucket existente
  backend "s3" {
    bucket = "jarvis-terraform-state-bruno"
    key    = "jarvis/server/terraform.tfstate"
    region = "us-east-1"
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0" # ATUALIZADO: Para alinhar com a versão 6.27.0 do seu ambiente
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# --- 2. VARIÁVEIS ---

variable "aws_region" { default = "us-east-1" }
variable "my_ip" { description = "Seu IP Público (x.x.x.x/32)" }
variable "ssh_key_name" { default = "jarvis-key" }
variable "n8n_user" { default = "admin" }
variable "n8n_pass" { sensitive = true }
variable "admin_setup_key" { sensitive = true }

# --- 3. DATA SOURCES (MAPEAR FOTOGRAFIA ATUAL DA AWS) ---

# VPC Identificada: vpc-0f43147f2f69aad12
data "aws_vpc" "existing_vpc" {
  id = "vpc-0f43147f2f69aad12"
}

# Subnet Pública: subnet-070c4e0af2d70dc80 (Onde o n8n vai morar)
data "aws_subnet" "public_subnet" {
  id = "subnet-070c4e0af2d70dc80"
}

# Subnet Privada: subnet-0693a8835e5c46571 (Referência para segurança)
data "aws_subnet" "private_subnet" {
  id = "subnet-0693a8835e5c46571"
}

# Security Group Atual: sg-098b15ea36d6387bc
data "aws_security_group" "existing_sg" {
  id = "sg-098b15ea36d6387bc"
}

# Busca a imagem Ubuntu 22.04 mais recente
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# --- 4. NOVOS RECURSOS (ORQUESTRADOR N8N) ---

# Criar um novo SG para o n8n para não poluir o antigo
resource "aws_security_group" "n8n_sg" {
  name        = "jarvis-n8n-sg"
  description = "Security Group para o orquestrador n8n"
  vpc_id      = data.aws_vpc.existing_vpc.id

  # SSH (Apenas para o seu IP)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
  }

  # Porta do n8n (Webhooks e Interface)
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

# CONEXÃO COM O BANCO: Permite que o n8n fale com o RDS no SG antigo
resource "aws_security_group_rule" "allow_n8n_to_rds" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.n8n_sg.id
  security_group_id        = data.aws_security_group.existing_sg.id
  description              = "Acesso do n8n ao banco legado"
}

# IAM Role para a Instância EC2 do n8n
resource "aws_iam_role" "n8n_ec2_role" {
  name = "jarvis-n8n-ec2-role"
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
  name = "jarvis-n8n-profile"
  role = aws_iam_role.n8n_ec2_role.name
}

# Instância EC2 do n8n
resource "aws_instance" "n8n_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  subnet_id     = data.aws_subnet.public_subnet.id

  vpc_security_group_ids = [aws_security_group.n8n_sg.id]
  key_name               = var.ssh_key_name
  iam_instance_profile   = aws_iam_instance_profile.n8n_profile.name

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
                  volumes:
                    - n8n_data:/home/node/.n8n
                  restart: always
              volumes:
                n8n_data:
              EOT

              cd /home/ubuntu/n8n
              docker compose up -d
              EOF

  tags = { Name = "jarvis-n8n-server" }
}

# Elastic IP para manter a URL fixa
resource "aws_eip" "n8n_eip" {
  instance = aws_instance.n8n_server.id
  domain   = "vpc"
}

# --- 5. OUTPUTS ---

output "n8n_url" {
  value = "http://${aws_eip.n8n_eip.public_ip}:5678"
}