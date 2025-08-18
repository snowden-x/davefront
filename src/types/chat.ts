export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  chat_history: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  sources?: Array<{
    source?: string;
    content?: string;
    [key: string]: any;
  }>;
}

export interface ApiError {
  detail: string;
  status: number;
}
