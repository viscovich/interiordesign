import { supabase } from './supabase';
import { ImageObject, UserObject, PaginatedProjects, Project } from './projectsService.d'; // Import all types
import { uploadImage } from './storage'; // Corrected import path and function name
import { getNewGenerationPrompt, _callGeminiApi } from './gemini'; // Import necessary functions
import { useCredit } from './userService'; // Import useCredit

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

// Function to get all projects (for community view)
export const getAllProjects = async (page: number = 1, perPage: number = 6): Promise<PaginatedProjects> => {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from('projects')
    .select('*', { count: 'exact' })
    // No user filter here
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching all projects:', error);
    throw error;
  }

  return {
    projects: data || [],
    total: count || 0,
    page,
    perPage
  };
};


export async function createProject(
  userId: string,
  originalImageUrl: string,
  generatedImageUrl: string,
  style: string,
  roomType: string,
  description: string | null = null,
  viewType: string | null = null,
  colorTone: string | null = null,
  thumbnailUrl: string, // Added thumbnail URL parameter
  inputImageUrlForVariant?: string | null // New optional parameter
) {
  // Determine the correct URL to save as the "original" for this record
  const urlToSaveAsOriginal = inputImageUrlForVariant ?? originalImageUrl;

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      original_image_url: urlToSaveAsOriginal, // Use the determined URL
      generated_image_url: generatedImageUrl,
      style,
      room_type: roomType,
      description,
      view_type: viewType,
      color_tone: colorTone,
      thumbnail_url: thumbnailUrl // Added thumbnail URL to insert
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
  project: Project, // Moved project parameter first
  originalImageUrl: string,
  replacementObject: UserObject | null,
  objectNameToReplace: string | null,
  viewType?: string | null,
  renderingType?: string | null,
  colorTone?: string | null
): Promise<{ imageData: string; detectedObjects: string[] }> { // <-- Changed return type

  // Project is now guaranteed by the signature, removed the null check below
  // if (!project) {
  //     throw new Error('Project data is required for regeneration.');
  // }
  if (!project.user_id) {
      throw new Error('Project data is required for regeneration.');
  }
  if (!project.user_id) {
      throw new Error('User ID is missing from project data.');
  }

  // Deduct credits for this generation attempt
  await useCredit(project.user_id, 5); // Assuming 5 credits per variant/replacement

  const isObjectReplacement = !!(replacementObject && objectNameToReplace);
  const objectImageUrls: string[] = [];

  if (isObjectReplacement) {
    // Object replacement flow
    const replacementUrl = replacementObject.thumbnail_url || replacementObject.asset_url;
    if (!replacementUrl) {
      console.warn(`Replacement object ${replacementObject.id} is missing asset/thumbnail URL.`);
      // Decide if this is an error or just proceed without the image
      // throw new Error('Replacement object is missing image URL.');
    } else {
        objectImageUrls.push(replacementUrl);
    }
    console.log('[regenerate] Replacing object with params:', {
      objectNameToReplace,
      replacementObjectId: replacementObject.id,
      newViewType: viewType,
      newRenderingType: renderingType,
      newColorTone: colorTone
    });
  } else {
    // Generate new variant with different parameters (no object replacement)
    console.log('[regenerate] Generating new variant with params:', {
      newViewType: viewType,
      newRenderingType: renderingType,
      newColorTone: colorTone
    });
  }

  try {
    // 1. Generate the specific prompt for regeneration/variant
    const prompt = getNewGenerationPrompt(
      project.style, // Base style from the original project
      renderingType || '3d', // New rendering type (default to 3d if null)
      project.room_type, // Room type from the original project
      (colorTone || project.color_tone) ?? undefined, // Convert null to undefined
      (viewType || project.view_type) ?? undefined,   // Convert null to undefined
      isObjectReplacement // Include object instruction if replacing
    );

    console.log(`[regenerate] Generated prompt: "${prompt.substring(0, 100)}..."`);

    // 2. Call the Gemini API using the internal function
    // Pass the *original* image URL as the base
    // Capture the full result including detectedObjects
    const { imageData, detectedObjects } = await _callGeminiApi(
        prompt,
        originalImageUrl, // Use the current image URL passed to the function
        objectImageUrls   // Pass only the replacement object URL if applicable
    );

    if (!imageData) {
      throw new Error('Image generation failed - no image data returned from _callGeminiApi');
    }

    console.log('[regenerate] Successfully generated new image variant.');
    // Return both image data and detected objects
    return { imageData, detectedObjects };

  } catch (error) {
    console.error('Error generating new image variant:', error);
    // Rethrow or handle specific errors
    throw new Error(`Failed to generate new image variant: ${error instanceof Error ? error.message : String(error)}`);
  }
}
