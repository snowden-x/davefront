import { useState, useEffect, useRef } from 'react';
import type { ChatMessage, Message as ConversationMessage, Source } from '@/types/chat';
import { Message } from './Message';
import { ChatInput } from './ChatInput';
import { chatApi } from '../services/api';
import { Bot, AlertCircle, Trash2, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string>('New Chat');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string>('');
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

  const addMessage = (role: 'user' | 'assistant', content: string, sources?: Source[]) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      sources,
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

      // Add assistant response with sources
      console.log('Chat response:', response);
      console.log('Sources:', response.sources);
      addMessage('assistant', response.response, response.sources);

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

  // Conversation management functions
  const handleDeleteConversation = async () => {
    if (!currentConversationId) return;
    
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      await chatApi.deleteConversation(currentConversationId);
      // Start a new chat after deletion
      startNewChat();
      // Notify sidebar to refresh conversations
      window.dispatchEvent(new CustomEvent('conversation-deleted'));
    } catch (err: any) {
      setError(err.detail || 'Failed to delete conversation');
      console.error('Error deleting conversation:', err);
    }
  };

  const handleStartEditTitle = () => {
    setIsEditingTitle(true);
    setEditingTitle(conversationTitle);
  };

  const handleSaveTitle = async () => {
    if (!currentConversationId || !editingTitle.trim()) return;

    try {
      const updatedConversation = await chatApi.renameConversation(currentConversationId, editingTitle.trim());
      setConversationTitle(updatedConversation.title);
      setIsEditingTitle(false);
      // Notify sidebar to refresh conversations
      window.dispatchEvent(new CustomEvent('conversation-updated', {
        detail: { conversationId: currentConversationId, title: updatedConversation.title }
      }));
    } catch (err: any) {
      setError(err.detail || 'Failed to rename conversation');
      console.error('Error renaming conversation:', err);
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="text-xl font-semibold text-gray-900 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 text-green-600 hover:text-green-800 transition-colors"
                    title="Save title"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEditTitle}
                    className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                    title="Cancel edit"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h1 className="text-xl font-semibold text-gray-900">{conversationTitle}</h1>
              )}
              <p className="text-sm text-gray-500">
                {currentConversationId ? 'Continuing conversation' : 'Start a new conversation'}
              </p>
            </div>
          </div>
          
          {/* Conversation management buttons */}
          {currentConversationId && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartEditTitle}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Rename conversation"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteConversation}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                title="Delete conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
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
          <Message key={message.id} message={message} sources={message.sources} />
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
