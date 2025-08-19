import { useState, useEffect, useRef } from 'react';
import type { ChatMessage, Message as ConversationMessage } from '@/types/chat';
import { Message } from './Message';
import { ChatInput } from './ChatInput';
import { chatApi } from '../services/api';
import { Bot, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string>('New Chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for conversation selection from sidebar
  useEffect(() => {
    const handleConversationSelect = (event: CustomEvent) => {
      const { conversationId, title } = event.detail;
      loadConversation(conversationId, title);
    };

    window.addEventListener('conversation-selected', handleConversationSelect as EventListener);
    
    return () => {
      window.removeEventListener('conversation-selected', handleConversationSelect as EventListener);
    };
  }, []);

  // Listen for new chat request
  useEffect(() => {
    const handleNewChat = () => {
      startNewChat();
    };

    window.addEventListener('new-chat-requested', handleNewChat as EventListener);
    
    return () => {
      window.removeEventListener('new-chat-requested', handleNewChat as EventListener);
    };
  }, []);

  const loadConversation = async (conversationId: string, title: string) => {
    if (conversationId === currentConversationId) return;
    
    setIsLoading(true);
    setError(null);
    setCurrentConversationId(conversationId);
    setConversationTitle(title);

    try {
      const conversationMessages = await chatApi.getMessages(conversationId);
      
      // Convert conversation messages to chat messages
      const chatMessages: ChatMessage[] = conversationMessages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.timestamp),
      }));
      
      setMessages(chatMessages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation';
      setError(errorMessage);
      console.error('Error loading conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setConversationTitle('New Chat');
    setError(null);
  };

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message immediately
    addMessage('user', content);
    setIsLoading(true);
    setError(null);

    try {
      // Prepare chat history for the API
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await chatApi.sendMessage({
        message: content,
        chat_history: chatHistory as unknown as ChatMessage[],
        conversation_id: currentConversationId || undefined, // Fix type issue
      });

      // Add assistant response
      addMessage('assistant', response.response);

      // Update conversation ID if this was a new chat
      if (!currentConversationId && response.conversation_id) {
        setCurrentConversationId(response.conversation_id);
        // Update the conversation title with the first message
        setConversationTitle(content.length > 50 ? content.substring(0, 50) + '...' : content);
        
        // Notify sidebar to refresh conversations
        window.dispatchEvent(new CustomEvent('conversation-created', {
          detail: { conversationId: response.conversation_id, title: conversationTitle }
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{conversationTitle}</h1>
            <p className="text-sm text-gray-500">
              {currentConversationId ? 'Continuing conversation' : 'Start a new conversation'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 mt-20">
            <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Welcome to Agentic RAG</h3>
            <p className="text-sm">Start a conversation by typing a message below.</p>
          </div>
        )}

        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
