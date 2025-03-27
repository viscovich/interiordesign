import { supabase } from './supabase';

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserCredits(userId: string, creditChange: number) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ 
      credits: creditChange,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function hasEnoughCredits(currentCredits: number, required: number): boolean {
  return currentCredits >= required;
}

export async function useCredit(userId: string, amount: number) {
  const profile = await getUserProfile(userId);
  if (!hasEnoughCredits(profile.credits, amount)) {
    throw new Error('Insufficient credits');
  }
  return await updateUserCredits(userId, profile.credits - amount);
}

export async function createUserProfile(userId: string, email: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      email,
      credits: 3 // Default credits
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
