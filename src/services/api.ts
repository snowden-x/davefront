import axios from 'axios';
import type { 
  ChatRequest, 
  ChatResponse, 
  ApiError, 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  Conversation,
  ConversationCreate,
  Message
} from '@/types/chat';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/login', request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiError: ApiError = {
          detail: error.response?.data?.detail || 'Login failed',
          status: error.response?.status || 500,
        };
        throw apiError;
      }
      throw new Error('An unexpected error occurred');
    }
  },

  async register(request: RegisterRequest): Promise<User> {
    try {
      const response = await api.post<User>('/register', request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiError: ApiError = {
          detail: error.response?.data?.detail || 'Registration failed',
          status: error.response?.status || 500,
        };
        throw apiError;
      }
      throw new Error('An unexpected error occurred');
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<User>('/me');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiError: ApiError = {
          detail: error.response?.data?.detail || 'Failed to get user info',
          status: error.response?.status || 500,
        };
        throw apiError;
      }
      throw new Error('An unexpected error occurred');
    }
  },
};

export const chatApi = {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await api.post<ChatResponse>('/chat', request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiError: ApiError = {
          detail: error.response?.data?.detail || 'An error occurred',
          status: error.response?.status || 500,
        };
        throw apiError;
      }
      throw new Error('An unexpected error occurred');
    }
  },

  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await api.get<Conversation[]>('/conversations');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiError: ApiError = {
          detail: error.response?.data?.detail || 'Failed to get conversations',
          status: error.response?.status || 500,
        };
        throw apiError;
      }
      throw new Error('An unexpected error occurred');
    }
  },

  async createConversation(request: ConversationCreate): Promise<Conversation> {
    try {
      const response = await api.post<Conversation>('/conversations', request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiError: ApiError = {
          detail: error.response?.data?.detail || 'Failed to create conversation',
          status: error.response?.status || 500,
        };
        throw apiError;
      }
      throw new Error('An unexpected error occurred');
    }
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const response = await api.get<Message[]>(`/conversations/${conversationId}/messages`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiError: ApiError = {
          detail: error.response?.data?.detail || 'Failed to get messages',
          status: error.response?.status || 500,
        };
        throw apiError;
      }
      throw new Error('An unexpected error occurred');
    }
  },

  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Backend is not available');
    }
  },
};

export default api;
