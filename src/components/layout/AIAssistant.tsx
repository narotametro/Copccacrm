import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI assistant powered by OpenAI. I can help you analyze data, suggest actions, answer questions about your CRM, and provide insights. How can I help you today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Fetch OpenAI API key from Supabase
      const { data: settings } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'openai_api_key')
        .single();

      const apiKey = settings?.value;
      
      if (!apiKey) {
        // Fallback to intelligent demo mode
        const demoResponse = generateDemoResponse(input);
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: demoResponse,
          sender: 'ai',
          timestamp: new Date(),
        };
        setTimeout(() => {
          setMessages((prev) => [...prev, aiResponse]);
          setIsLoading(false);
        }, 1500);
        return;
      }

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant for COPCCA CRM system. You help users with customer relationship management, sales tracking, data analysis, and business insights. Provide clear, actionable advice. Keep responses concise and professional.'
            },
            ...messages.filter(m => m.sender === 'user' || m.sender === 'ai').slice(-5).map(m => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text
            })),
            {
              role: 'user',
              content: input
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const aiText = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI Assistant error:', error);
      toast.error('Failed to get AI response. Using demo mode.');
      
      // Fallback to demo response
      const demoResponse = generateDemoResponse(input);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: demoResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDemoResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('sales') || lowerInput.includes('revenue')) {
      return "Based on your CRM data, your sales pipeline shows strong momentum. I recommend focusing on the top 20% of leads in your pipeline as they represent 80% of potential revenue. Would you like me to analyze specific deals or suggest follow-up strategies?";
    }
    
    if (lowerInput.includes('customer') || lowerInput.includes('client')) {
      return "I can help you analyze customer data! Your CRM shows several high-value customers who haven't been contacted recently. I recommend setting up automated follow-ups for customers inactive for 30+ days. Would you like me to generate a customer engagement report?";
    }
    
    if (lowerInput.includes('report') || lowerInput.includes('analytics')) {
      return "I can help generate various reports: Sales Performance, Customer Engagement, Revenue Forecasting, Pipeline Analysis, and Activity Tracking. Which would you like to explore? I can also create custom reports based on specific metrics.";
    }
    
    if (lowerInput.includes('help') || lowerInput.includes('what can you do')) {
      return "I can help you with:\n• Sales pipeline analysis and forecasting\n• Customer engagement insights\n• Data analysis and reporting\n• Task and follow-up recommendations\n• Performance metrics tracking\n• Business strategy suggestions\n\nWhat would you like to explore?";
    }
    
    return `I understand you're asking about "${userInput}". While I'm in demo mode (OpenAI API key not configured), I can still help with CRM tasks, data analysis, and provide general business insights. For full AI capabilities, please configure your OpenAI API key in the .env file. How else can I assist you?`;
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 flex items-center justify-center z-50 animate-scale-in"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] z-50 animate-scale-in">
          <Card className="h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">AI Assistant</h3>
                <p className="text-xs text-slate-600">Always here to help</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === 'user'
                          ? 'text-primary-100'
                          : 'text-slate-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-lg px-4 py-3 flex items-center gap-2">
                    <Loader2 className="animate-spin text-primary-600" size={16} />
                    <p className="text-sm text-slate-600">AI is thinking...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="input flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <Button 
                  onClick={handleSend} 
                  size="sm" 
                  icon={isLoading ? Loader2 : Send}
                  disabled={isLoading || !input.trim()}
                  className={isLoading ? 'animate-pulse' : ''}
                >
                  {isLoading ? 'Sending' : 'Send'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};
