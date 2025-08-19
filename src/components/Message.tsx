import type { ChatMessage, Source } from '@/types/chat';
import { User, Bot, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface MessageProps {
  message: ChatMessage;
  sources?: Source[];
}

export function Message({ message, sources }: MessageProps) {
  const isUser = message.role === 'user';
  const [showSources, setShowSources] = useState(false);
  
  // Debug logging
  console.log('Message component - sources:', sources);
  console.log('Message role:', message.role);
  console.log('Sources length:', sources?.length);
  
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-500' : 'bg-gray-500'
        }`}>
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>
        
        <div className={`rounded-lg px-4 py-2 ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          
          {/* Sources section for assistant messages */}
          {!isUser && sources && sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <FileText className="w-3 h-3" />
                {showSources ? 'Hide Sources' : `Show Sources (${sources.length})`}
                {showSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              
              {showSources && (
                <div className="mt-2 space-y-2">
                  {sources.map((source, index) => (
                    <div key={index} className="bg-blue-50 rounded p-2 text-xs">
                      <div className="font-medium text-blue-900">
                        Document {source.document_id.slice(0, 8)}...
                      </div>
                      <div className="text-blue-700 mt-1">
                        {source.content_excerpt}
                      </div>
                      <div className="text-blue-600 mt-1">
                        Type: {source.owner_type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <p className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {message.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
