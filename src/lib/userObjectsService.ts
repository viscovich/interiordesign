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

  if (error) {
    console.error('Error fetching user objects:', error); // Keep basic error log
    throw error;
  }
  return data || [];
};

export const searchObjects = async (
  userId: string,
  query: string = '',
  category: string = '',
  page: number = 1,
  pageSize: number = 10
): Promise<{data: UserObject[], count: number}> => {
  // First get total count of matching objects
  let countRequest = supabase
    .from('user_objects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (query) {
    countRequest = countRequest.or(`object_name.ilike.%${query}%,object_type.ilike.%${query}%`);
  }

  if (category) {
    countRequest = countRequest.eq('object_type', category);
  }

  const { count } = await countRequest;

  // Then get paginated results
  let dataRequest = supabase
    .from('user_objects')
    .select('*')
    .eq('user_id', userId);

  if (query) {
    dataRequest = dataRequest.or(`object_name.ilike.%${query}%,object_type.ilike.%${query}%`);
  }

  if (category) {
    dataRequest = dataRequest.eq('object_type', category);
  }

  const { data, error } = await dataRequest
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw error;
  return { data: data || [], count: count || 0 };
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
