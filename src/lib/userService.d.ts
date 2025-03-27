export interface UserProfile {
  id: string;
  email: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export declare function getUserProfile(userId: string): Promise<UserProfile>;
export declare function updateUserCredits(userId: string, creditChange: number): Promise<UserProfile>;
export declare function hasEnoughCredits(currentCredits: number, required: number): boolean;
export declare function useCredit(userId: string, amount: number): Promise<UserProfile>;
export declare function createUserProfile(userId: string, email: string): Promise<UserProfile>;
