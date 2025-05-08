import { supabase } from './supabase';
// Import the shared type definition
import imageCompression from 'browser-image-compression'; // Import compression library
import type { UserObject } from './projectsService.d';
// Re-export the type so components can import it from here
export type { UserObject };
import { uploadImage } from './storage';
import { generateObjectDescription } from './gemini';

// REMOVED fileToBase64 helper function as it's no longer needed

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
  // Validate file format - only PNG allowed for initial upload
  if (file.type !== 'image/png') {
    throw new Error(`Unsupported file format: ${file.type}. Only PNG files are accepted for initial upload.`);
  }

  // 1. Compress the image
    console.log(`[addUserObject] Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    const options = {
      maxSizeMB: 0.3, // Target max size 300KB
      maxWidthOrHeight: 1024, // Limit dimensions for objects
      useWebWorker: true,
      // Do not specify fileType to keep original PNG format,
      // but still apply compression based on maxSizeMB.
      // initialQuality is less relevant for lossless PNG compression.
    };
    let compressedFile: File;
    try {
      console.log('[addUserObject] Compressing object image...');
      compressedFile = await imageCompression(file, options);
      console.log(`[addUserObject] Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (compressionError) {
      console.error('[addUserObject] Error compressing object image:', compressionError);
      throw new Error('Failed to compress object image.');
    }

    // 2. Generate a unique path for the compressed object in storage
    const fileExtension = 'png'; // Keep png extension
    const uniqueFileName = `${Date.now()}-${file.name.split('.').slice(0, -1).join('.')}.${fileExtension}`;
    const storagePath = `user_objects/${userId}/${uniqueFileName}`;

    // 3. Upload compressed image using storage service
    const assetUrl = await uploadImage(compressedFile, storagePath); // Pass the compressed File

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
  // Ensure the function closing brace is present
} 

export const deleteUserObject = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('user_objects')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
