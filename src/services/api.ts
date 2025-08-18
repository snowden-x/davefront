import axios from 'axios';
import type { ChatRequest, ChatResponse, ApiError } from '@/types/chat';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
