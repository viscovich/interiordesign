import { supabase } from './supabase';
import { ImageObject, UserObject } from './projectsService.d'; // Import new types
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


// Placeholder for Gemini service interaction
// Replace with actual calls to your gemini.ts functions
const geminiService = {
  recognizeObjects: async (imageUrl: string): Promise<string[]> => {
    console.log(`Calling Gemini to recognize objects in: ${imageUrl}`);
    // Simulate API call delay and response
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Example response based on user prompt
    // In reality, this would parse the JSON response from the prompt
    // "give me the list of furniture or electric devices on this image in json format"
    if (imageUrl.includes('kitchen')) { // Dummy check
        return ["Refrigerator", "Kitchen island", "Range", "Sink", "Cabinet"];
    }
    return ["Chair", "Table", "Lamp"];
  },
  regenerateWithSubstitution: async (
    originalImageUrl: string,
    replacementObjectImageUrl: string,
    objectNameToReplace: string
  ): Promise<string> => {
    console.log(`Calling Gemini to replace ${objectNameToReplace}`);
    console.log(`Original: ${originalImageUrl}`);
    console.log(`Replacement Object Image: ${replacementObjectImageUrl}`);
    // Simulate API call delay and response
    await new Promise(resolve => setTimeout(resolve, 3000));
    // Return a placeholder URL for the new image
    return 'https://via.placeholder.com/1024x768.png?text=Generated+Image+Placeholder';
  }
};

export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getProjectsByUser(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createProject(
  userId: string,
  originalImageUrl: string,
  generatedImageUrl: string,
  style: string,
  roomType: string
) {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      original_image_url: originalImageUrl,
      generated_image_url: generatedImageUrl,
      style,
      room_type: roomType
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(projectId: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
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

// Function to trigger recognition and save results
export async function recognizeAndSaveObjects(projectId: string, userId: string, imageUrl: string): Promise<ImageObject[]> {
  // Clear existing objects for this project first? Or assume it's only called once?
  // For simplicity, let's assume we clear existing ones first.
  const { error: deleteError } = await supabase
    .from('image_objects')
    .delete()
    .eq('project_id', projectId);

   if (deleteError) {
     console.error('Error deleting old image objects:', deleteError);
     // Decide if we should proceed or throw
   }

  const recognizedNames = await geminiService.recognizeObjects(imageUrl);
  if (recognizedNames && recognizedNames.length > 0) {
    return await saveImageObjects(projectId, userId, recognizedNames);
  }
  return []; // Return empty if nothing was recognized
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
  originalImageUrl: string, // URL of the image to modify
  replacementObject: UserObject, // The user object selected for replacement
  objectNameToReplace: string // The name of the object identified in the original image
): Promise<string> { // Returns the URL of the newly generated image

  if (!replacementObject.asset_url) {
    throw new Error('Replacement object is missing asset URL.');
  }

  // Call the Gemini service placeholder
  const newImageUrl = await geminiService.regenerateWithSubstitution(
    originalImageUrl,
    replacementObject.asset_url, // Pass the URL of the replacement object's image
    objectNameToReplace
  );

  // Potentially save the new image URL back to the project?
  // This depends on how projects track their generated images.
  // For now, just return the new URL.
  return newImageUrl;
}
