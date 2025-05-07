import { supabase } from './supabase';
import { ImageObject, UserObject, PaginatedProjects, Project } from './projectsService.d'; // Import all types
import { uploadImage } from './storage'; // Corrected import path and function name
// Import necessary functions & generateObjectDescription - REMOVED _callGeminiApi
import { getNewGenerationPrompt, urlToInlineDataPart, generateObjectDescription } from './gemini';
import { useCredit } from './userService'; // Import useCredit
// Removed InlineDataPart import as it's no longer needed here

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
    object_name: name, // This now holds the detailed description
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
    // Directly use the passed-in detectedObjects (which are detailed descriptions)
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
  // Validate file format - only PNG allowed
  if (file.type !== 'image/png') {
    throw new Error(`Unsupported file format: ${file.type}. Only PNG files are accepted.`);
  }

  // 1. Convert file to base64
  const base64Data = await fileToBase64(file);

  // 2. Generate a unique path for the object in storage
  // Example path: user_objects/user-uuid/timestamp-filename.ext
  const fileExtension = file.name.split('.').pop() || 'png'; // Default to png if no extension
  const uniqueFileName = `${Date.now()}-${file.name}`;
  const storagePath = `user_objects/${userId}/${uniqueFileName}`;

  // 3. Upload image using storage service
  const assetUrl = await uploadImage(base64Data, storagePath);

  // 3.5 Generate description from the uploaded image URL
  let description = 'Description generation failed or skipped'; // Default description
  try {
    console.log(`[addUserObject] Attempting to generate description for asset: ${assetUrl}`); // Log before call
    description = await generateObjectDescription(assetUrl);
    console.log(`[addUserObject] generateObjectDescription returned: "${description}"`); // Log after call
  } catch (descError) {
    // This logs if generateObjectDescription throws an error that bubbles up
    console.error(`[addUserObject] Error caught calling generateObjectDescription for ${objectName} at ${assetUrl}`, descError);
    // Keep the default error description
  }


  // 4. Insert metadata into the user_objects table
  const { data, error } = await supabase
    .from('user_objects')
    .insert({
      user_id: userId,
      object_name: objectName,
      object_type: objectType,
      asset_url: assetUrl,
      description: description, // Add the generated description
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
  project: Project,
  originalImageUrl: string, // Image containing the object to replace
  replacementObject: UserObject | null, // The new object to insert (contains its description)
  objectToReplaceIdentifier: string | null, // Identifier (e.g., 'sofa') of the object type to replace - CORRECTED PARAM NAME
  viewType?: string | null,
  renderingType?: string | null,
  colorTone?: string | null
): Promise<{ imageData: string; detectedObjects: string[] }> {
  if (!project.user_id) {
    throw new Error('Project data is required for regeneration.');
  }
  // Check: if replacing, both replacement object and identifier are needed
  if (replacementObject && !objectToReplaceIdentifier) { // CORRECTED CHECK
    throw new Error('Object identifier to replace is required when providing a replacement object.');
  }

  // Deduct credits for this generation attempt
  await useCredit(project.user_id, 5);

  // Determine if it's an object replacement based on provided parameters
  const isObjectReplacement = !!(replacementObject && objectToReplaceIdentifier); // CORRECTED CHECK
  // let objectImageParts: InlineDataPart[] = []; // Removed - we pass URLs now
  let replacementObjectDescription: string | null = null; // Description of the NEW object
  let actualObjectToReplaceDescription: string | null = null; // Detailed description of the object TO REPLACE (from DB)
  let replacementObjectImageUrl: string | null = null; // URL of the replacement object

  if (isObjectReplacement) {
    // 1. Get description of the NEW object
    replacementObjectDescription = replacementObject.description ?? null; 
    console.log(`[regenerateImageWithSubstitution] Replacement object description: "${replacementObjectDescription}"`);

    // 2. Find the detailed description of the object TO REPLACE from image_objects using the identifier
    try {
      console.log(`[regenerateImageWithSubstitution] Finding description for object identifier: "${objectToReplaceIdentifier}" in project ${project.id}`);
      const { data: foundObjects, error: findError } = await supabase
        .from('image_objects')
        .select('object_name') // object_name contains the detailed description
        .eq('project_id', project.id)
        // Use 'like' to match if the saved description starts with the identifier
        .like('object_name', `${objectToReplaceIdentifier}%`) 
        .limit(1); // Take the first match

      if (findError) {
        throw findError;
      }

      if (foundObjects && foundObjects.length > 0) {
        actualObjectToReplaceDescription = foundObjects[0].object_name;
        console.log(`[regenerateImageWithSubstitution] Found description for object to replace: "${actualObjectToReplaceDescription}"`);
      } else {
        console.warn(`[regenerateImageWithSubstitution] Could not find object matching identifier "${objectToReplaceIdentifier}" in image_objects for project ${project.id}. Using identifier as description.`);
        // Fallback: use the identifier itself if no detailed description found
        actualObjectToReplaceDescription = objectToReplaceIdentifier; 
      }
    } catch (dbError) {
       console.error(`[regenerateImageWithSubstitution] Error fetching object description from DB:`, dbError);
       // Fallback in case of DB error
       actualObjectToReplaceDescription = objectToReplaceIdentifier; 
       console.warn(`[regenerateImageWithSubstitution] Using identifier "${actualObjectToReplaceDescription}" as description due to DB error.`);
    }

    // 3. Get image URL for the NEW object
    replacementObjectImageUrl = replacementObject.thumbnail_url || replacementObject.asset_url;
    if (!replacementObjectImageUrl) {
       console.warn(`[regenerateImageWithSubstitution] Replacement object ${replacementObject.id} is missing asset/thumbnail URL. Cannot include its image.`);
    } else {
       console.log(`[regenerateImageWithSubstitution] Using replacement image URL: ${replacementObjectImageUrl}`);
    }
    // No conversion needed here anymore, just pass the URL

    console.log('[regenerate] Replacing object with params:', {
      objectToReplaceDescription: actualObjectToReplaceDescription, // Log the description found/used
      replacementObjectId: replacementObject.id,
      replacementObjectDescription, 
      newViewType: viewType,
      newRenderingType: renderingType,
      newColorTone: colorTone
    });

  } else {
    // Not an object replacement, just generating a variant
    console.log('[regenerate] Generating new variant (no object replacement) with params:', {
      newViewType: viewType,
      newRenderingType: renderingType,
      newColorTone: colorTone
    });
  }

  // 4. Generate the prompt and call the API
  try {
    // Removed the intermediate objectsToReplace array

    const prompt = getNewGenerationPrompt(
      project.style,
      renderingType || '3d', // Default to 3d if not provided
      project.room_type,
      (colorTone || project.color_tone) ?? undefined, // Use new or existing color tone
      (viewType || project.view_type) ?? undefined, // Use new or existing view type
      isObjectReplacement,
      // Pass the descriptions directly as separate arguments
      isObjectReplacement ? actualObjectToReplaceDescription : null,
      isObjectReplacement ? replacementObjectDescription : null
    );

    console.log('===== FULL PROMPT SENT TO GEMINI =====');
    console.log(prompt);
    console.log('===== END PROMPT =====');

    // Call the Netlify function instead of _callGeminiApi
    console.log(`[regenerate] Calling Netlify function '/.netlify/functions/gemini-call'`);
    const response = await fetch('/.netlify/functions/gemini-call', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: prompt,
            mainImageUrl: originalImageUrl, // Pass the main image URL
            // Pass replacement image URL in an array if it exists, otherwise empty array
            objectImageUrls: replacementObjectImageUrl ? [replacementObjectImageUrl] : [],
        }),
    });

    console.log(`[regenerate] Netlify function response status: ${response.status}`);
    const result = await response.json();

    if (!response.ok) {
        console.error(`[regenerate] Netlify function error: ${response.statusText}`, result);
        throw new Error(result.error || `Failed to regenerate image (${response.status})`);
    }

     // Validate the expected fields exist
    if (typeof result.description !== 'string' || typeof result.imageData !== 'string' || !Array.isArray(result.detectedObjects)) {
        console.error('[regenerate] Invalid data structure received from Netlify function:', result);
        throw new Error('Invalid response format from regeneration service.');
    }
    // Note: The Netlify function returns description, but we might not need it here.
    // We primarily need imageData and detectedObjects.

    console.log('[regenerate] Successfully generated new image variant via Netlify function.');
    return {
        imageData: result.imageData,
        detectedObjects: result.detectedObjects
    };
  } catch (error) {
    console.error('Error generating new image variant:', error);
    // Rethrow or handle specific errors
    throw new Error(`Failed to generate new image variant: ${error instanceof Error ? error.message : String(error)}`);
  }
}


// --- Function to Initiate Asynchronous Generation ---

// Define the type for the parameters object
interface AsyncGenerationParams {
  userId: string;
  originalImageUrl: string;
  style: string;
  roomType: string;
  renderingType: string;
  colorTone: string | null;
  view: string | null;
  prompt: string;
  inputUserObjectIds: string[] | null;
  model: string; // e.g., 'dall-e-3'
  size: string; // e.g., '1024x1024'
  quality: string; // e.g., 'standard'
}

export async function createProjectForAsyncGeneration(params: AsyncGenerationParams): Promise<string> {
  console.log('[createProjectForAsyncGeneration] Initiating async generation with params:', params);

  // 1. Insert project record with 'pending' status
  let newProjectId: string | null = null;
  try {
    const { data: newProject, error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: params.userId,
        original_image_url: params.originalImageUrl, // Make sure this is the final URL if uploaded separately
        style: params.style,
        room_type: params.roomType,
        rendering_type: params.renderingType,
        color_tone: params.colorTone,
        view_type: params.view, // Changed from view to view_type to match database column
        prompt: params.prompt,
        input_user_object_ids: params.inputUserObjectIds,
        model: params.model,
        size: params.size,
        quality: params.quality,
        stato_generazione: 'pending', // Set initial status
        generated_image_url: null, // Ensure these are null initially
        thumbnail_url: null,
        generation_error: null,
      })
      .select('id') // Select only the ID
      .single();

    if (insertError) {
      console.error('Error inserting pending project:', insertError);
      throw new Error(`Failed to create project record: ${insertError.message}`);
    }

    if (!newProject || !newProject.id) {
      throw new Error('Failed to create project record: No ID returned.');
    }
    newProjectId = newProject.id;
    console.log(`[createProjectForAsyncGeneration] Pending project created with ID: ${newProjectId}`);

  } catch (error) {
    console.error('[createProjectForAsyncGeneration] Error during project insertion:', error);
    // Rethrow the specific error or a generic one
    throw error instanceof Error ? error : new Error('Failed to create project record.');
  }

  // Ensure newProjectId is a string before proceeding
  if (typeof newProjectId !== 'string') {
      // This case should theoretically not be reached if insertion succeeded without error
      console.error('[createProjectForAsyncGeneration] Critical error: newProjectId is not a string after successful insertion.');
      throw new Error('Failed to get project ID after creation.');
  }
  // Use a new const with the guaranteed string type for clarity and type safety
  const projectIdToInvoke: string = newProjectId;


  // 2. Invoke the Edge Function asynchronously
  try {
    const { error: invokeError } = await supabase.functions.invoke('generate-image-async', {
      body: { projectId: projectIdToInvoke }, // Pass the guaranteed string ID
    });

    if (invokeError) {
      console.error(`[createProjectForAsyncGeneration] Error invoking function for project ${projectIdToInvoke}:`, invokeError);
      // Attempt to update the project status to 'failed' if invocation fails
      await supabase
        .from('projects')
        .update({ stato_generazione: 'failed', generation_error: `Function invocation failed: ${invokeError.message}` })
        .eq('id', projectIdToInvoke); // Use guaranteed string ID
      throw new Error(`Failed to invoke generation function: ${invokeError.message}`);
    }

    console.log(`[createProjectForAsyncGeneration] Successfully invoked function for project ${projectIdToInvoke}`);
    return projectIdToInvoke; // Return the guaranteed string ID

  } catch (error) {
    console.error('[createProjectForAsyncGeneration] Error during function invocation:', error);
    // Ensure project status reflects failure if invocation step fails after insertion
     await supabase
        .from('projects')
        .update({ stato_generazione: 'failed', generation_error: `Function invocation failed unexpectedly.` })
        .eq('id', projectIdToInvoke); // Use guaranteed string ID
    throw error instanceof Error ? error : new Error('Failed to invoke generation function.');
  }
}
