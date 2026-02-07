import json
import boto3
import os
import time
import logging
from botocore.config import Config
from botocore.exceptions import ClientError
from typing import Dict, Any, Optional

# --- 1. CONFIGURAÇÃO DE LOGGING ---
# Configura o logger de forma segura para evitar duplicidade no CloudWatch
logger = logging.getLogger()
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)
logger.setLevel(logging.INFO)


# --- 2. SERVIÇO BEDROCK (SINGLETON) ---
class BedrockService:
    """
    Gerencia a conexão com a AWS de forma eficiente.
    Usa padrão Singleton para reaproveitar a conexão TCP entre invocações quentes.
    """
    _client = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            region = os.environ.get('REGION_NAME', 'us-east-1')

            # Configuração agressiva de retries e timeout de leitura
            config = Config(
                read_timeout=60,  # Tempo máximo esperando o modelo gerar tokens
                connect_timeout=10,
                retries={'max_attempts': 2, 'mode': 'adaptive'}
            )

            try:
                cls._client = boto3.client(
                    'bedrock-runtime',
                    region_name=region,
                    config=config
                )
                logger.info(f"✅ Cliente Bedrock conectado na região {region}")
            except Exception as e:
                logger.error(f"❌ Falha crítica ao criar cliente AWS: {str(e)}")
                raise e

        return cls._client


# --- 3. HANDLER PRINCIPAL ---
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Ponto de entrada da Lambda.
    """
    start_time = time.time()

    # Tratamento seguro para execução local vs AWS
    request_id = getattr(context, 'aws_request_id', 'local-debug-id')

    # Função segura para obter tempo restante
    get_remaining_time = getattr(context, 'get_remaining_time_in_millis', lambda: 90000)

    logger.info(f"🚀 INÍCIO - Request ID: {request_id}")

    try:
        # 1. Parsing do Evento
        body = parse_event_body(event)

        task_title = body.get('title', 'Tarefa Sem Título')
        task_description = body.get('description', '')

        logger.info(f"📋 Processando Tarefa: {task_title}")

        # 2. Proteção contra Timeout (Fail-Fast)
        remaining_ms = get_remaining_time()
        if remaining_ms < 15000:  # Se sobrar menos de 15s, não arrisca chamar a IA
            logger.warning(f"⚠️ Timeout iminente ({remaining_ms}ms). Abortando inferência.")
            raise TimeoutError("Tempo insuficiente para processamento cognitivo.")

        # 3. Chamada ao Cérebro (Bedrock)
        analysis_result = invoke_claude(task_title, task_description)

        # 4. Finalização
        total_time = time.time() - start_time
        logger.info(f"✅ SUCESSO - Duração Total: {total_time:.2f}s")

        return format_response(200, {
            'task': task_title,
            'analysis': analysis_result,
            'metadata': {
                'duration_seconds': round(total_time, 2),
                'request_id': request_id,
                'model': os.environ.get('MODEL_ID', 'unknown')
            }
        })

    except Exception as e:
        logger.error(f"❌ ERRO DE EXECUÇÃO: {str(e)}", exc_info=True)

        # Retorna erro formatado mas não derruba a Lambda (Soft Fail)
        return format_response(500, {
            'error': str(e),
            'type': type(e).__name__,
            'request_id': request_id
        })


# --- 4. FUNÇÕES AUXILIARES ---

def parse_event_body(event: Dict[str, Any]) -> Dict[str, Any]:
    """Extrai o payload, tratando casos onde vem como string JSON (API Gateway)."""
    if 'body' in event:
        if isinstance(event['body'], str):
            try:
                return json.loads(event['body'])
            except json.JSONDecodeError:
                logger.warning("Não foi possível decodificar o body como JSON")
                return {}
        return event['body']
    return event


def invoke_claude(title: str, description: str) -> str:
    """Monta o payload específico para Claude 3 e executa a inferência."""
    client = BedrockService.get_client()
    model_id = os.environ.get('MODEL_ID', 'anthropic.claude-3-5-haiku-20241022-v1:0')

    # System Prompt: DNA do Jarvis
    system_prompt = (
        "Você é o Jarvis. Personalidade: 50% Lógico (Spock), 50% Coach Proativo.\n"
        "Objetivo: Mitigar TDAH via estimativa de tempo (+20% buffer) e quebra de tarefas.\n"
        "Regra de Saída: Responda com texto limpo, sem markdown excessivo."
    )

    # Prompt do Usuário
    user_content = f"Analise esta tarefa: '{title}'.\nContexto: {description}"

    # Payload Claude 3 (Messages API)
    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "system": system_prompt,
        "messages": [
            {
                "role": "user",
                "content": user_content
            }
        ],
        "temperature": 0,  # Equilíbrio entre criatividade e determinismo
    }

    logger.info(f"🧠 Invocando Modelo: {model_id}")

    # Chamada Boto3
    response = client.invoke_model(
        modelId=model_id,
        body=json.dumps(payload),
        contentType='application/json',
        accept='application/json'
    )

    # Processamento da Resposta
    response_body = json.loads(response['body'].read())

    if 'content' in response_body and len(response_body['content']) > 0:
        return response_body['content'][0]['text']
    else:
        raise ValueError("Resposta do modelo veio vazia ou mal formatada.")


def format_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """Padroniza a resposta HTTP para API Gateway."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'  # CORS
        },
        'body': json.dumps(body, ensure_ascii=False)
    }


# --- 5. EXECUÇÃO LOCAL (DEBUG) ---
if __name__ == "__main__":
    # Mock para testar no seu PC antes de subir
    os.environ['REGION_NAME'] = 'us-east-1'
    os.environ['MODEL_ID'] = 'anthropic.claude-3-5-haiku-20241022-v1:0'

    test_event = {
        "title": "Teste Local Jarvis",
        "description": "Verificando integridade do código Python."
    }


    class MockContext:
        aws_request_id = "local-dev-123"

        def get_remaining_time_in_millis(self):
            return 30000


    print("--- INICIANDO TESTE LOCAL ---")
    res = lambda_handler(test_event, MockContext())
    print(json.dumps(json.loads(res['body']), indent=2, ensure_ascii=False))