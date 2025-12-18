export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatHistoryItem {
    id: number | string;
    title: string;
    date: string;
}

export interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

export interface EmptyStateProps {
    onSuggestionClick: (suggestion: string) => void;
}

export interface ChatAreaProps {
    messages: Message[];
    isLoading?: boolean;
}

export interface OptimizationResponse {
    user_id: string;
    response: {
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
