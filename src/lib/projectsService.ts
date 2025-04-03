import { supabase } from './supabase';
import { ImageObject, UserObject, PaginatedProjects } from './projectsService.d'; // Import new types
import { uploadImage } from './storage'; // Corrected import path and function name

// Helper function to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};


// Removed unused geminiService object

export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
  console.log('Fetched projects with fields:', data?.map(p => ({
    id: p.id,
    hasViewType: !!p.view_type,
    hasColorTone: !!p.color_tone
  })));
  return data;
}

export async function getProjectsByUser(userId: string, page: number = 1, perPage: number = 6) {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from('projects')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    projects: data,
    total: count || 0,
    page,
    perPage
  } as PaginatedProjects;
}

export async function createProject(
  userId: string,
  originalImageUrl: string,
  generatedImageUrl: string,
  style: string,
  roomType: string,
  description: string | null = null,
  viewType: string | null = null,
  colorTone: string | null = null
) {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      original_image_url: originalImageUrl,
      generated_image_url: generatedImageUrl,
      style,
      room_type: roomType,
      description,
      view_type: viewType,
      color_tone: colorTone
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(projectId: string) {
  console.log('Deleting project:', projectId);
  
  const { data, error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .select();

  if (error) {
    console.error('Delete failed:', { projectId, error });
    throw error;
  }

  console.log('Delete result:', { 
    projectId, 
    deletedCount: data?.length || 0 
  });
}

// --- Functions for Image Objects (Recognized by AI) ---

export async function getImageObjects(projectId: string): Promise<ImageObject[]> {
  const { data, error } = await supabase
    .from('image_objects')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching image objects:', error);
    throw error;
  }
  return data || [];
}

// Saves the names returned by the recognition service
export async function saveImageObjects(projectId: string, userId: string, objectNames: string[]): Promise<ImageObject[]> {
  const objectsToInsert = objectNames.map(name => ({
    project_id: projectId,
    user_id: userId, // Ensure user_id is passed correctly
    object_name: name,
  }));

  const { data, error } = await supabase
    .from('image_objects')
    .insert(objectsToInsert)
    .select();

  if (error) {
    console.error('Error saving image objects:', error);
    // Consider if we should delete previously inserted ones on partial failure?
    throw error;
  }
  return data || [];
}

// Function to save recognized objects (modified from recognizeAndSaveObjects)
export async function saveDetectedObjects(projectId: string, userId: string, detectedObjects: string[]): Promise<ImageObject[]> {
  // Clear existing objects for this project first
  const { error: deleteError } = await supabase
    .from('image_objects')
    .delete()
    .eq('project_id', projectId);

  if (deleteError) {
    console.error('Error deleting old image objects:', deleteError);
    throw deleteError;
  }

  try {
    // Directly use the passed-in detectedObjects
    console.log('Saving detected objects:', detectedObjects);
    
    if (detectedObjects && detectedObjects.length > 0) {
      // Call saveImageObjects with the provided list
      return await saveImageObjects(projectId, userId, detectedObjects);
    }
    console.log('No detected objects provided to save.');
    return []; // Return empty array if no objects were detected/provided
  } catch (error) {
    console.error('Error saving detected objects:', error);
    throw error;
  }
}


// --- Functions for User Objects (Uploaded Library) ---

export async function getUserObjects(userId: string): Promise<UserObject[]> {
  const { data, error } = await supabase
    .from('user_objects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user objects:', error);
    throw error;
  }
  return data || [];
}

// Add a new object to the user's library
export async function addUserObject(
  userId: string,
  objectName: string,
  objectType: string,
  file: File,
  dimensions?: string
): Promise<UserObject> {

  // 1. Convert file to base64
  const base64Data = await fileToBase64(file);

  // 2. Generate a unique path for the object in storage
  // Example path: user_objects/user-uuid/timestamp-filename.ext
  const fileExtension = file.name.split('.').pop() || 'png'; // Default to png if no extension
  const uniqueFileName = `${Date.now()}-${file.name}`;
  const storagePath = `user_objects/${userId}/${uniqueFileName}`;

  // 3. Upload image using storage service
  const assetUrl = await uploadImage(base64Data, storagePath);

  // 4. Insert metadata into the user_objects table
  const { data, error } = await supabase
    .from('user_objects')
    .insert({
      user_id: userId,
      object_name: objectName,
      object_type: objectType,
      asset_url: assetUrl,
      // thumbnail_url: null, // Generate later?
      dimensions: dimensions,
    })
    .select()
    .single(); // Expecting a single row back

  if (error) {
    console.error('Error inserting user object metadata:', error);
    // Consider deleting the uploaded file if DB insert fails
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create user object: No data returned.');
  }

  return data;
}

// --- Function for Regeneration ---

export async function regenerateImageWithSubstitution(
  originalImageUrl: string,
  replacementObject: UserObject | null,
  objectNameToReplace: string | null,
  viewType?: string | null,
  renderingType?: string | null,
  colorTone?: string | null
): Promise<string> {

  if (replacementObject && objectNameToReplace) {
    // Object replacement flow
    if (!replacementObject.asset_url) {
      throw new Error('Replacement object is missing asset URL.');
    }
    console.log('Replacing object with params:', {
      objectNameToReplace,
      replacementObject,
      viewType,
      renderingType,
      colorTone
    });
  } else {
    // Generate new variant with different parameters
    console.log('Generating new variant with params:', {
      viewType,
      renderingType, 
      colorTone
    });
  }

  // TODO: Implement actual regeneration logic
  console.warn('Regeneration logic not fully implemented yet');
  const newImageUrl = 'https://via.placeholder.com/1024x768.png?text=Regeneration+Not+Implemented';

  return newImageUrl;
}
