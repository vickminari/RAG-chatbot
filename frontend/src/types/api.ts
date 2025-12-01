export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: number;
    email: string;
  };
}

export interface ApiError {
  detail: string;
}

// Chat types
export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface ChatRequest {
  conversation_id: number;
  message: string;
}

export interface ChatResponse {
  user_message: Message;
  assistant_message: Message;
}

export interface ConversationCreate {
  title: string;
}
