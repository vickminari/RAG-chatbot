/**
 * Tipo de erro de validação do FastAPI/Pydantic
 */
interface ValidationError {
  type: string;
  loc: (string | number)[];
  msg: string;
  input?: any;
  ctx?: Record<string, any>;
}

/**
 * Tipo de resposta de erro do FastAPI
 */
interface FastAPIError {
  detail: string | ValidationError[];
}

/**
 * Extrai mensagens de erro de respostas do FastAPI/Pydantic
 * @param error Erro capturado do fetch
 * @returns Mensagem de erro formatada para o usuário
 */
export function extractErrorMessage(error: unknown): string {
  // Se for um Error com mensagem, usa a mensagem
  if (error instanceof Error) {
    try {
      // Tenta parsear a mensagem como JSON (caso seja um erro do backend)
      const parsed = JSON.parse(error.message);
      return formatFastAPIError(parsed);
    } catch {
      // Se não for JSON, retorna a mensagem como está
      return error.message;
    }
  }

  // Se for um objeto com detail
  if (typeof error === 'object' && error !== null && 'detail' in error) {
    return formatFastAPIError(error as FastAPIError);
  }

  // Fallback genérico
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

/**
 * Formata erros do FastAPI para mensagens legíveis
 */
function formatFastAPIError(error: FastAPIError): string {
  const { detail } = error;

  // Se detail é uma string, retorna diretamente
  if (typeof detail === 'string') {
    return detail;
  }

  // Se detail é um array de erros de validação
  if (Array.isArray(detail)) {
    // Agrupa erros por campo
    const errorsByField = new Map<string, string[]>();

    detail.forEach((validationError) => {
      const field = getFieldName(validationError.loc);
      const message = cleanErrorMessage(validationError.msg);
      
      if (!errorsByField.has(field)) {
        errorsByField.set(field, []);
      }
      errorsByField.get(field)!.push(message);
    });

    // Formata as mensagens
    const messages: string[] = [];
    errorsByField.forEach((errors, field) => {
      const fieldLabel = translateFieldName(field);
      if (errors.length === 1) {
        messages.push(`${fieldLabel}: ${errors[0]}`);
      } else {
        messages.push(`${fieldLabel}:\n${errors.map(e => `  • ${e}`).join('\n')}`);
      }
    });

    return messages.join('\n');
  }

  return 'Erro de validação. Verifique os dados e tente novamente.';
}

/**
 * Extrai o nome do campo do array de localização
 */
function getFieldName(loc: (string | number)[]): string {
  // loc geralmente é ["body", "campo"], então pegamos o último elemento
  const fieldName = loc[loc.length - 1];
  return typeof fieldName === 'string' ? fieldName : 'campo';
}

/**
 * Limpa mensagens de erro do Pydantic para algo mais legível
 */
function cleanErrorMessage(msg: string): string {
  // Remove prefixos comuns do Pydantic
  return msg
    .replace(/^Value error,\s*/i, '')
    .replace(/^Assertion failed,\s*/i, '')
    .replace(/^String should\s*/i, 'Deve ')
    .replace(/^Input should\s*/i, 'Deve ')
    .trim();
}

/**
 * Traduz nomes de campos para português
 */
function translateFieldName(field: string): string {
  const translations: Record<string, string> = {
    email: 'Email',
    password: 'Senha',
    name: 'Nome',
    confirmPassword: 'Confirmação de senha',
    message: 'Mensagem',
    conversation_id: 'Conversa',
    title: 'Título',
    // Adicione mais conforme necessário
  };

  return translations[field] || field.charAt(0).toUpperCase() + field.slice(1);
}

/**
 * Função principal para lidar com erros
 * Exibe o erro no console e retorna a mensagem formatada
 */
export function handleError(error: unknown): string {
  const message = extractErrorMessage(error);
  console.error('Error:', message);
  return message;
}
