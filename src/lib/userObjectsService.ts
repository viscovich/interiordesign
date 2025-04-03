import { supabase } from './supabase';

export interface UserObject {
  id: string;
  user_id: string;
  object_name: string;
  object_type: string;
  asset_url: string;
  thumbnail_url?: string;
  dimensions?: string;
  created_at: string;
}

export const getUserObjects = async (userId: string): Promise<UserObject[]> => {
  const { data, error } = await supabase
    .from('user_objects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const addUserObject = async (object: Omit<UserObject, 'id'|'created_at'>): Promise<UserObject> => {
  const { data, error } = await supabase
    .from('user_objects')
    .insert(object)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteUserObject = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('user_objects')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
