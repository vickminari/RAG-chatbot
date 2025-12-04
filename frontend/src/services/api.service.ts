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

  // Documents endpoints
  async uploadDocument(conversationId: number, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('conversation_id', conversationId.toString());
    formData.append('file', file);

    const url = `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.UPLOAD}`;
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData, // Não adicionar Content-Type, o browser define automaticamente
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(JSON.stringify(errorData));
      error.name = 'ApiError';
      throw error;
    }

    return await response.json();
  }

  async getDocumentsByConversation(conversationId: number): Promise<any[]> {
    const response = await this.request<{ documents: any[], total: number }>(
      API_ENDPOINTS.DOCUMENTS.BY_CONVERSATION(conversationId),
      { method: 'GET' }
    );
    // A API retorna { documents: [], total: number }, extrair apenas documents
    return response.documents || [];
  }

  async getDocumentDownloadUrl(documentId: number): Promise<{ download_url: string; expires_in: number; message: string }> {
    return this.request(API_ENDPOINTS.DOCUMENTS.DOWNLOAD(documentId), {
      method: 'GET',
    });
  }

  // User Profile endpoints
  async updateUserProfile(data: Partial<{ nome: string; username: string; imagem_perfil: string; descricao: string }>): Promise<User> {
    return this.request<User>(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateUserPassword(data: { old_password: string; new_password: string }): Promise<User> {
    return this.request<User>(API_ENDPOINTS.AUTH.UPDATE_PASSWORD, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async uploadProfilePicture(file: File): Promise<{ message: string; image_url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}${API_ENDPOINTS.AUTH.UPLOAD_PROFILE_PICTURE}`;
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData, // Não adicionar Content-Type, o browser define automaticamente
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(JSON.stringify(errorData));
      error.name = 'ApiError';
      throw error;
    }

    return await response.json();
  }
}

export const apiService = new ApiService();
