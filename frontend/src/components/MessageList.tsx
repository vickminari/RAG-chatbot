import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: number | string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  isStreaming?: boolean;
  streamedContent?: string;
}

interface MessageListProps {
  messages: Message[];
}

const LoadingDots: React.FC = () => {
  return (
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h2 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Como posso ajudar você hoje?
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Digite sua mensagem abaixo para começar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((message) => {
          // Determinar o conteúdo a exibir
          const displayContent = message.isStreaming && message.streamedContent !== undefined
            ? message.streamedContent
            : message.content;
          
          const isLoading = message.role === 'assistant' && !message.content && !message.isStreaming;
          
          return (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 
                  flex-shrink-0 flex items-center justify-center text-white font-semibold">
                  AI
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {isLoading ? (
                  <div className="py-2">
                    <LoadingDots />
                  </div>
                ) : (
                  <>
                    <div className={`break-words ${message.role === 'assistant' ? 'markdown-content' : 'whitespace-pre-wrap'}`}>
                      {message.role === 'assistant' ? (
                        <ReactMarkdown>{displayContent}</ReactMarkdown>
                      ) : (
                        displayContent
                      )}
                      {message.isStreaming && (
                        <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse"></span>
                      )}
                    </div>
                    {!isLoading && message.created_at && (
                      <div
                        className={`text-xs mt-2 ${
                          message.role === 'user'
                            ? 'text-blue-100'
                            : isDark
                            ? 'text-gray-400'
                            : 'text-gray-500'
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {message.role === 'user' && (
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold
                  ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-300 text-gray-700'} uppercase`}>
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
