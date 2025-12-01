import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import type { 
  LoginCredentials, 
  RegisterData, 
  LoginResponse, 
  User,
  Conversation,
  ConversationWithMessages,
  ChatResponse
} from '../types/api';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      credentials: 'include', // Importante para enviar cookies HttpOnly
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        // Lança o erro com o objeto completo para ser processado depois
        const error = new Error(JSON.stringify(errorData));
        error.name = 'ApiError';
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro desconhecido ao conectar com o servidor');
    }
  }

  // Auth endpoints
  async register(data: RegisterData): Promise<User> {
    return this.request<User>(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return this.request<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>(API_ENDPOINTS.AUTH.ME, {
      method: 'GET',
    });
  }

  // Conversations endpoints
  async createConversation(title: string): Promise<Conversation> {
    return this.request<Conversation>(API_ENDPOINTS.CONVERSATIONS, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>(API_ENDPOINTS.CONVERSATIONS, {
      method: 'GET',
    });
  }

  async getConversation(id: number): Promise<ConversationWithMessages> {
    return this.request<ConversationWithMessages>(`${API_ENDPOINTS.CONVERSATIONS}/${id}`, {
      method: 'GET',
    });
  }

  async deleteConversation(id: number): Promise<void> {
    await this.request<void>(`${API_ENDPOINTS.CONVERSATIONS}/${id}`, {
      method: 'DELETE',
    });
  }

  // Chat endpoints
  async sendMessage(conversationId: number, message: string): Promise<ChatResponse> {
    return this.request<ChatResponse>(API_ENDPOINTS.CHAT, {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId, message }),
    });
  }
}

export const apiService = new ApiService();
