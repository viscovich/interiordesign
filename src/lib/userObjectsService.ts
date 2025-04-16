import { supabase } from './supabase';
// Import the shared type definition
import type { UserObject } from './projectsService.d'; 
// Re-export the type so components can import it from here
export type { UserObject }; 


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
  // Ensure the return type matches Promise<UserObject[]>
  return (data as UserObject[]) || []; 
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
  return { data: (data as UserObject[]) || [], count: count || 0 };
};

// REMOVED the duplicate addUserObject function definition from this file.
// The correct version (handling file upload and description generation) is in projectsService.ts
// and is imported by UploadObjectModal.tsx.


export const deleteUserObject = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('user_objects')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
