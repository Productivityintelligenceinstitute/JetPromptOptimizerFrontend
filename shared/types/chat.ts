export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    messageId?: string; // Backend message_id for sharing
    isShared?: boolean; // Whether this message is already in the library
}

export interface ChatHistoryItem {
    id: number | string;
    title: string;
    date: string;
}

export interface Chat {
    id: string;
    chat_title: string;
    user_id: string;
    created_at: string;
}

export interface ChatListResponse {
    chats: Chat[];
}

export interface ChatMessage {
    role: string;
    content: string;
    message_id?: string;
}

export interface PaginatedChatMessages {
    items: ChatMessage[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

export interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

export interface EmptyStateProps {
    onSuggestionClick: (suggestion: string, level?: string) => void;
}

export interface ChatAreaProps {
    messages: Message[];
    isLoading?: boolean;
}

export interface OptimizationResponse {
    user_id: string;
    message_id?: string; // backend llm message id for sharing
    response: {
        message_id?: string; // sometimes nested
        optimized_prompt: string;
        changes_made: string[];
        share_message: string;
    };
    chat_id: string;
}

export interface OptimizationRequest {
    user_prompt: string;
    chat_id?: string;
    user_id: string;
}
