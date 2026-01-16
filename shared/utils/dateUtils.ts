/**
 * Utility functions for date formatting and grouping
 */

export interface GroupedChats {
    today: Array<{ chat_id: string; chat_title: string; created_at: string }>;
    yesterday: Array<{ chat_id: string; chat_title: string; created_at: string }>;
    previous7Days: Array<{ chat_id: string; chat_title: string; created_at: string }>;
    older: Array<{ chat_id: string; chat_title: string; created_at: string }>;
}

/**
 * Groups chats by date into Today, Yesterday, Previous 7 Days, and Older
 */
export const groupChatsByDate = (
    chats: Array<{ chat_id: string; chat_title: string; created_at: string }>
): GroupedChats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const grouped: GroupedChats = {
        today: [],
        yesterday: [],
        previous7Days: [],
        older: [],
    };

    chats.forEach((chat) => {
        const chatDate = new Date(chat.created_at);
        const chatDateOnly = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());

        if (chatDateOnly.getTime() === today.getTime()) {
            grouped.today.push(chat);
        } else if (chatDateOnly.getTime() === yesterday.getTime()) {
            grouped.yesterday.push(chat);
        } else if (chatDate >= sevenDaysAgo) {
            grouped.previous7Days.push(chat);
        } else {
            grouped.older.push(chat);
        }
    });

    return grouped;
};

