import apiClient from "./client";

export interface UserData {
    user_id: string;
    email: string;
    name?: string;
}

export const syncUser = async (userData: UserData): Promise<void> => {
    await apiClient.post("/users", userData);
};
