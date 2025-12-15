import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Minimize2, Maximize2, Sparkles, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DraggableAdminAI({ user }) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: window.innerHeight - 600 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleMove = (e) => {
      if (dragging) {
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        setPosition({
          x: clientX - dragOffset.x,
          y: clientY - dragOffset.y
        });
      }
    };

    const handleEnd = () => {
      setDragging(false);
    };

    if (dragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [dragging, dragOffset]);

  const handleStart = (e) => {
    const rect = dragRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
    setDragging(true);
  };

  const createConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: 'admin_assistant',
      metadata: {
        name: 'Admin AI Session',
        admin_id: user.email,
        admin_name: user.full_name
      }
    });
    setConversationId(conv.id);
    setMessages([]);
    return conv;
  };

  const handleOpen = async () => {
    setOpen(true);
    if (!conversationId) {
      await createConversation();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      let conv;
      if (!conversationId) {
        conv = await createConversation();
      } else {
        const conversations = await base44.agents.listConversations({
          agent_name: 'admin_assistant'
        });
        conv = conversations.find(c => c.id === conversationId);
      }

      // Add context about current page and admin
      const contextMessage = `[CONTEXT: Admin ${user.full_name} (${user.email}) is viewing page: ${window.location.pathname}]\n\nUser request: ${userMessage}`;

      await base44.agents.addMessage(conv, {
        role: 'user',
        content: contextMessage
      });

    } catch (error) {
      console.error('Error sending message:', error);
      // Show error to user
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to send message. Please try again.'}`,
        tool_calls: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
    });

    return () => unsubscribe();
  }, [conversationId]);

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all hover:scale-110"
        style={{ zIndex: 9999 }}
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      ref={dragRef}
      className="fixed bg-white dark:bg-stone-900 rounded-lg shadow-2xl border border-stone-200 dark:border-stone-700"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: minimized ? '300px' : '360px',
        height: minimized ? '56px' : '500px',
        zIndex: 9999,
        cursor: dragging ? 'grabbing' : 'auto'
      }}
    >
      <div
        className="flex items-center justify-between p-3 border-b border-stone-200 dark:border-stone-700 bg-blue-600 text-white rounded-t-lg cursor-grab active:cursor-grabbing"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4" />
          <Sparkles className="w-4 h-4" />
          <span className="font-semibold text-sm">Admin AI</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMinimized(!minimized)}
            className="h-6 w-6 p-0 hover:bg-blue-700 text-white"
          >
            {minimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="h-6 w-6 p-0 hover:bg-blue-700 text-white"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {!minimized && (
        <>
          <ScrollArea className="h-[380px] p-3" ref={scrollRef}>
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8 text-stone-500 dark:text-stone-400 text-sm">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-medium">Admin AI Assistant</p>
                  <p className="text-xs mt-1">Ask me to perform any admin task</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'rounded-lg p-2 text-sm',
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white ml-8'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 mr-8'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.tool_calls && msg.tool_calls.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.tool_calls.map((call, i) => (
                        <div key={i} className="text-xs opacity-75 border-t border-white/20 pt-1">
                          <p className="font-medium">{call.name}</p>
                          {call.status && (
                            <p className="capitalize">{call.status}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="bg-stone-100 dark:bg-stone-800 rounded-lg p-2 mr-8">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-stone-200 dark:border-stone-700">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask me anything..."
                className="min-h-[60px] text-sm resize-none"
                disabled={loading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700 h-[60px] px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}