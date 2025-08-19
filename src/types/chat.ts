export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  chat_history: ChatMessage[];
  conversation_id?: string;
}

export interface ChatResponse {
  response: string;
  sources?: Array<{
    source?: string;
    content?: string;
    [key: string]: any;
  }>;
  conversation_id?: string;
}

export interface ApiError {
  detail: string;
  status: number;
}

// Authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Conversation types
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationCreate {
  title: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  role: string;
  timestamp: string;
}
