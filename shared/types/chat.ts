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
}
