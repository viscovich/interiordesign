import { supabase } from './supabase';
// Import the shared type definition
import type { UserObject } from './projectsService.d';
// Re-export the type so components can import it from here
export type { UserObject };
import { uploadImage } from './storage';
import { generateObjectDescription } from './gemini';

// Helper function to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

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

// Add a new object to the user's library
export async function addUserObject(
  userId: string,
  objectName: string,
  objectType: string,
  file: File,
  dimensions?: string
): Promise<UserObject> {
  // Validate file format - only PNG allowed
  if (file.type !== 'image/png') {
    throw new Error(`Unsupported file format: ${file.type}. Only PNG files are accepted.`);
  }

  // 1. Convert file to base64
  const base64Data = await fileToBase64(file);

  // 2. Generate a unique path for the object in storage
  const fileExtension = file.name.split('.').pop() || 'png';
  const uniqueFileName = `${Date.now()}-${file.name}`;
  const storagePath = `user_objects/${userId}/${uniqueFileName}`;

  // 3. Upload image using storage service
  const assetUrl = await uploadImage(base64Data, storagePath);

  // 3.5 Generate description from the uploaded image URL
  let description = 'Description generation failed or skipped';
  try {
    console.log(`[addUserObject] Attempting to generate description for asset: ${assetUrl}`);
    description = await generateObjectDescription(assetUrl);
    console.log(`[addUserObject] generateObjectDescription returned: "${description}"`);
  } catch (descError) {
    console.error(`[addUserObject] Error caught calling generateObjectDescription for ${objectName} at ${assetUrl}`, descError);
  }

  // 4. Insert metadata into the user_objects table
  const { data, error } = await supabase
    .from('user_objects')
    .insert({
      user_id: userId,
      object_name: objectName,
      object_type: objectType,
      asset_url: assetUrl,
      description: description,
      dimensions: dimensions,
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting user object metadata:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create user object: No data returned.');
  }

  return data;
}

export const deleteUserObject = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('user_objects')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
