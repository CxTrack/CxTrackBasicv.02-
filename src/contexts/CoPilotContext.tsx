import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useCustomerStore } from '@/stores/customerStore';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ContextData {
  page?: string;
  data?: any;
}

interface CoPilotConfig {
  provider: 'internal' | 'openai' | 'anthropic' | 'ollama' | 'custom';
  apiKey?: string;
  model?: string;
  endpoint?: string;
}

interface CoPilotContextType {
  isOpen: boolean;
  panelSide: 'left' | 'right';
  messages: Message[];
  isLoading: boolean;
  currentContext: ContextData | null;
  config: CoPilotConfig;
  openPanel: () => void;
  closePanel: () => void;
  setPanelSide: (side: 'left' | 'right') => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setContext: (context: ContextData) => void;
  setConfig: (config: CoPilotConfig) => void;
}

const CoPilotContext = createContext<CoPilotContextType | undefined>(undefined);

export const CoPilotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [panelSide, setPanelSide] = useState<'left' | 'right'>('right');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentContext, setCurrentContext] = useState<ContextData | null>(null);
  const [config, setConfig] = useState<CoPilotConfig>({
    provider: 'internal',
    model: 'internal-assistant',
  });

  const openPanel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const setContext = useCallback((context: ContextData) => {
    setCurrentContext(context);
  }, []);

  const { customers, addNote, fetchCustomers } = useCustomerStore();

  const generateResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();

    // HANDLED IN SEND_MESSAGE FOR ACTIONS
    if (lowerMessage.includes('add a note') || lowerMessage.includes('add note') || lowerMessage.includes('put a note') || lowerMessage.includes('create a note')) {
      return "Thinking..."; // Placeholder, actual logic in sendMessage
    }

    if (lowerMessage.includes('customer') || lowerMessage.includes('clients')) {
      return "I can help you analyze your customer data. Based on your CRM, I see you have multiple customers with various engagement levels. Would you like me to:\n\n• Show top customers by revenue\n• Identify customers needing follow-up\n• Generate a customer health report\n\nWhat would be most helpful?";
    }

    if (lowerMessage.includes('revenue') || lowerMessage.includes('sales')) {
      return "I can analyze your revenue trends. To provide the most relevant insights, I'd need to know:\n\n• Time period (this month, quarter, year?)\n• Comparison basis (vs last period, year-over-year?)\n• Specific metrics (total revenue, average deal size, growth rate?)\n\nLet me know what you'd like to focus on!";
    }

    if (lowerMessage.includes('task') || lowerMessage.includes('overdue')) {
      return "I'll help you manage your tasks. Here's what I can do:\n\n• List overdue tasks by priority\n• Show tasks due this week\n• Suggest task prioritization\n• Create task summaries by customer\n\nWhich would help you most right now?";
    }

    if (lowerMessage.includes('report') || lowerMessage.includes('summary')) {
      return "I can generate various reports for you:\n\n• Customer activity summary\n• Revenue and pipeline analysis\n• Task completion metrics\n• Appointment and calendar overview\n\nWhich report would you like me to create?";
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('what can you')) {
      return "I'm your CxTrack CoPilot! Here's what I can help with:\n\n**Data Analysis**\n• Customer insights and segmentation\n• Revenue trends and forecasting\n• Pipeline health checks\n\n**Task Management**\n• Overdue task identification\n• Priority recommendations\n• Task summaries by customer\n\n**Reporting**\n• Custom report generation\n• Data visualization suggestions\n• Export data summaries\n\n**Navigation**\n• Quick access to customer profiles\n• Search across all data\n• Contextual suggestions\n\nWhat would you like to explore?";
    }

    return "I understand you're asking about that. While I'm still learning the specifics of your request, I can help with:\n\n• Customer data analysis\n• Revenue and sales insights\n• Task and appointment management\n• Report generation\n\nCould you rephrase your question or choose one of these areas?";
  };

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const lowerContent = content.toLowerCase();

      // LOGIC FOR ACTIONS
      if (lowerContent.includes('add a note') || lowerContent.includes('add note') || lowerContent.includes('put a note') || lowerContent.includes('create a note')) {
        // Ensure customers are loaded
        if (customers.length === 0) {
          await fetchCustomers();
        }

        // Simple name extraction (e.g., "add a note on Manik Sharma's profile...")
        let customer = null;

        // Try to find a matching customer name in the query
        for (const c of useCustomerStore.getState().customers) {
          if (content.toLowerCase().includes(c.name.toLowerCase())) {
            customer = c;
            break;
          }
        }

        if (customer) {
          // Extract note content - everything after "that " or "note "
          let noteContent = "";
          if (content.includes("that ")) {
            noteContent = content.split("that ").slice(1).join("that ").trim();
          } else if (content.includes("note ")) {
            noteContent = content.split("note ").slice(1).join("note ").trim();
          } else {
            noteContent = "Update from CoPilot";
          }

          if (noteContent) {
            await addNote({
              customer_id: customer.id,
              content: noteContent
            });

            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `✅ Done! I've added that note to **${customer.name}'s** profile.\n\n**Note:** "${noteContent}"`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
            toast.success('Note added successfully');
            return;
          }
        } else {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "I couldn't find a customer matching that name in your CRM. Could you please double-check the name or navigate to their profile so I can help?",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
          return;
        }
      }

      // Default response generation
      const responseContent = await generateResponse(content);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error in CoPilot sendMessage:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error processing your request. Please try again or rephrase your question.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [customers, addNote, fetchCustomers]);

  return (
    <CoPilotContext.Provider
      value={{
        isOpen,
        panelSide,
        messages,
        isLoading,
        currentContext,
        config,
        openPanel,
        closePanel,
        setPanelSide,
        sendMessage,
        clearMessages,
        setContext,
        setConfig,
      }}
    >
      {children}
    </CoPilotContext.Provider>
  );
};

export const useCoPilot = () => {
  const context = useContext(CoPilotContext);
  if (!context) {
    throw new Error('useCoPilot must be used within CoPilotProvider');
  }
  return context;
};
