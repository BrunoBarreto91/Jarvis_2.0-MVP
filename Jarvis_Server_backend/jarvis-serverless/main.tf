# ==============================================================================
# PROJETO: JARVIS - ASSISTENTE INTELIGENTE (SERVERLESS)
# IaC: TERRAFORM - VERSÃO FINAL BLINDADA (ESTÁGIO FINAL)
# ==============================================================================

# --- CONTROLE DE ESTADO ---
terraform {
  backend "s3" {
    bucket = "jarvis-terraform-state-bruno"
    key    = "backend/terraform.tfstate"
    region = "us-east-1"
  }
}

# --- 0. VARIÁVEIS SENSÍVEIS ---
variable "db_password" {
  type      = string
  sensitive = true
}

variable "admin_setup_key" {
  type      = string
  sensitive = true
}

# --- 1. PROVEDOR E TAGS GLOBAIS ---
provider "aws" {
  region = "us-east-1"
  default_tags {
    tags = {
      Project   = "Jarvis"
      ManagedBy = "Terraform"
      Owner     = "Bruno Barreto"
    }
  }
}

# --- 2. CRIPTOGRAFIA E SEGREDOS ---
resource "aws_kms_key" "jarvis_kms" {
  description             = "Chave mestra para os segredos do Bunker Jarvis"
  enable_key_rotation     = true
  lifecycle { prevent_destroy = true }
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name       = "jarvis/rds/credentials-final-v3"
  kms_key_id = aws_kms_key.jarvis_kms.arn
  lifecycle {
    prevent_destroy = true
    ignore_changes  = all
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials_val" {
  secret_id     = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "admin"
    password = var.db_password
  })
}

# --- 3. REDE (VPC E CONECTIVIDADE) ---
resource "aws_vpc" "jarvis_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  lifecycle { prevent_destroy = true }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.jarvis_vpc.id
}

resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.jarvis_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "us-east-1a"
}

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.jarvis_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1a"
  lifecycle { prevent_destroy = true }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.jarvis_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-east-1b"
  lifecycle { prevent_destroy = true }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.jarvis_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public_rt.id
}

# --- 4. SEGURANÇA (SGs) ---
resource "aws_security_group" "lambda_sg_v2" {
  name   = "jarvis-lambda-sg-v2"
  vpc_id = aws_vpc.jarvis_vpc.id
  lifecycle { ignore_changes = all }
}

resource "aws_security_group" "rds_sg" {
  name   = "jarvis-rds-sg"
  vpc_id = aws_vpc.jarvis_vpc.id
  lifecycle { ignore_changes = all }
}

# --- 6. BANCO DE DADOS (RDS) ---
resource "aws_db_subnet_group" "jarvis_db_group" {
  name       = "jarvis-db-group-v2"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]
  lifecycle { ignore_changes = all }
}

resource "aws_db_instance" "jarvis_db" {
  allocated_storage      = 20
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  db_name                = "jarvis_db"
  username               = "admin"
  password               = var.db_password
  parameter_group_name   = "default.mysql8.0"
  skip_final_snapshot    = true
  db_subnet_group_name   = aws_db_subnet_group.jarvis_db_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  lifecycle {
    prevent_destroy = true
    ignore_changes  = all
  }
}

# --- 7. COGNITO ---
resource "aws_cognito_user_pool" "jarvis_user_pool" {
  name                     = "User pool - Jarvis - Vercel"
  lifecycle { ignore_changes = all }
}

resource "aws_cognito_user_pool_client" "jarvis_client" {
  name                = "jarvis-client"
  user_pool_id        = aws_cognito_user_pool.jarvis_user_pool.id
}

# --- 8. IAM ---
resource "aws_iam_role" "lambda_exec_role" {
  name = "jarvis-lambda-exec-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  lifecycle { ignore_changes = all }
}

resource "aws_iam_policy" "jarvis_combined_policy" {
  name = "JarvisCombinedPolicy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Action = "bedrock:InvokeModel", Effect = "Allow", Resource = "*" },
      { Action = "lambda:InvokeFunction", Effect = "Allow", Resource = "*" },
      { Action = ["secretsmanager:GetSecretValue", "kms:Decrypt"], Effect = "Allow", Resource = "*" }
    ]
  })
  lifecycle { ignore_changes = all }
}

# --- 9. LAMBDAS NODE.JS ---
data "archive_file" "common_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/src/lambdas/common"
  output_path = "${path.module}/common_layer.zip"
}

resource "aws_lambda_layer_version" "jarvis_utils" {
  filename            = data.archive_file.common_layer_zip.output_path
  layer_name          = "jarvis-utils"
  compatible_runtimes = ["nodejs18.x"]
}

locals {
  functions = {
    health = { dir = "system/health", timeout = 15, memory = 256 }
    setup  = { dir = "system/setup",  timeout = 30, memory = 512 }
    create = { dir = "tasks/create",  timeout = 29, memory = 512 }
    get    = { dir = "tasks/get",     timeout = 20, memory = 256 }
    update = { dir = "tasks/update",  timeout = 15, memory = 256 }
  }
}

resource "aws_lambda_function" "jarvis_functions" {
  for_each      = local.functions
  function_name = "jarvis-${each.key}"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = each.value.timeout
  memory_size   = each.value.memory
  filename      = "${path.module}/${each.key}_lambda.zip"
  layers        = [aws_lambda_layer_version.jarvis_utils.arn]

  vpc_config {
    subnet_ids         = [aws_subnet.public_1.id]
    security_group_ids = [aws_security_group.lambda_sg_v2.id]
  }

  environment {
    variables = {
      DB_HOST             = aws_db_instance.jarvis_db.address
      DB_NAME             = "jarvis_db"
      DB_SECRET_ARN       = aws_secretsmanager_secret.db_credentials.arn
      ADMIN_SETUP_KEY     = var.admin_setup_key
      BRAIN_FUNCTION_NAME = "jarvis-brain"
    }
  }
}

# --- 10. JARVIS BRAIN (PYTHON) ---
resource "aws_lambda_function" "jarvis_brain" {
  function_name = "jarvis-brain"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.12"
  timeout       = 90
  memory_size   = 512

  # Removido filename e zip local para não travar o deploy se o arquivo não estiver pronto
  # Em produção, o GitHub Actions cuidará do deploy do código
  s3_bucket = "jarvis-terraform-state-bruno"
  s3_key    = "lambdas/brain.zip"

  vpc_config {
    subnet_ids         = [aws_subnet.private_1.id]
    security_group_ids = [aws_security_group.lambda_sg_v2.id]
  }
}

# --- 11. API GATEWAY ---
resource "aws_apigatewayv2_api" "jarvis_api" {
  name          = "jarvis-api-production"
  protocol_type = "HTTP"
  lifecycle { ignore_changes = all }
}

resource "aws_apigatewayv2_stage" "jarvis_stage" {
  api_id      = aws_apigatewayv2_api.jarvis_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_authorizer" "cognito_auth" {
  api_id           = aws_apigatewayv2_api.jarvis_api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "jarvis-auth"
  jwt_configuration {
    audience = [aws_cognito_user_pool_client.jarvis_client.id]
    issuer   = "https://${aws_cognito_user_pool.jarvis_user_pool.endpoint}"
  }
}

resource "aws_apigatewayv2_integration" "jarvis_integrations" {
  for_each               = local.functions
  api_id                 = aws_apigatewayv2_api.jarvis_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.jarvis_functions[each.key].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "routes" {
  for_each = {
    health = "GET /health"
    setup  = "GET /setup"
    create = "POST /tasks"
    get    = "GET /tasks"
    update = "PATCH /tasks"
  }
  api_id             = aws_apigatewayv2_api.jarvis_api.id
  route_key          = each.value
  target             = "integrations/${aws_apigatewayv2_integration.jarvis_integrations[each.key].id}"
  authorization_type = contains(["POST /tasks", "GET /tasks", "PATCH /tasks"], each.value) ? "JWT" : "NONE"
  authorizer_id      = contains(["POST /tasks", "GET /tasks", "PATCH /tasks"], each.value) ? aws_apigatewayv2_authorizer.cognito_auth.id : null
}

resource "aws_lambda_permission" "apigw_lambda" {
  for_each      = local.functions
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.jarvis_functions[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.jarvis_api.execution_arn}/*/*"
}

output "base_url" {
  value = aws_apigatewayv2_api.jarvis_api.api_endpoint
}