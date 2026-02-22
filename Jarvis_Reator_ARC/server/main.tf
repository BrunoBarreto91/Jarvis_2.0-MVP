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
  id = "sg-0d72c1703f93e5e5c"
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
  db_instance_identifier = "terraform-20260128204747981300000004"
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

# A regra de acesso ao banco já existe no security group do RDS.

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

resource "aws_iam_role_policy_attachment" "n8n_ssm_policy" {
  role       = aws_iam_role.n8n_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
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

  root_block_device {
    volume_size = 20 # Aumentando para 20GB para suportar Swap
    volume_type = "gp3"
  }

  # User Data removido para configuração manual via SSH
  # user_data = ...

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

# --- 6. COGNITO RESOURCES ---

resource "aws_cognito_user_pool" "jarvis_pool" {
  name = "jarvis-user-pool"

  # Permitir login com email
  alias_attributes = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
  }

  tags = {
    Name = "jarvis-user-pool"
  }
}

resource "aws_cognito_user_pool_client" "jarvis_client" {
  name = "jarvis-client"

  user_pool_id = aws_cognito_user_pool.jarvis_pool.id

  generate_secret = false
  
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH"
  ]

  # Configurações de Token (Opcional, mas recomendado)
  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 30
  
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "jarvis_domain" {
  domain       = "jarvis-auth-bunker" # Deve ser único globalmente
  user_pool_id = aws_cognito_user_pool.jarvis_pool.id
}

# --- 7. NOVOS OUTPUTS (COGNITO) ---

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.jarvis_pool.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.jarvis_client.id
}

output "cognito_domain" {
  value = aws_cognito_user_pool_domain.jarvis_domain.domain
}

output "cognito_region" {
  value = var.aws_region
}