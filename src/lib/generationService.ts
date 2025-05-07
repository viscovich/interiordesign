import { supabase } from './supabase';
import type { Project, UserObject } from './projectsService.d';
import { getNewGenerationPrompt } from './gemini';
import { useCredit } from './userService';

export async function regenerateImageWithSubstitution(
  project: Project,
  originalImageUrl: string,
  replacementObject: UserObject | null,
  objectToReplaceIdentifier: string | null,
  viewType?: string | null,
  renderingType?: string | null,
  colorTone?: string | null
): Promise<{ imageData: string; detectedObjects: string[] }> {
  if (!project.user_id) {
    throw new Error('Project data is required for regeneration.');
  }
  if (replacementObject && !objectToReplaceIdentifier) {
    throw new Error('Object identifier to replace is required when providing a replacement object.');
  }

  await useCredit(project.user_id, 5);

  const isObjectReplacement = !!(replacementObject && objectToReplaceIdentifier);
  let replacementObjectDescription: string | null = null;
  let actualObjectToReplaceDescription: string | null = null;
  let replacementObjectImageUrl: string | null = null;

  if (isObjectReplacement) {
    replacementObjectDescription = replacementObject.description ?? null;
    console.log(`[regenerateImageWithSubstitution] Replacement object description: "${replacementObjectDescription}"`);

    try {
      console.log(`[regenerateImageWithSubstitution] Finding description for object identifier: "${objectToReplaceIdentifier}" in project ${project.id}`);
      const { data: foundObjects, error: findError } = await supabase
        .from('image_objects')
        .select('object_name')
        .eq('project_id', project.id)
        .like('object_name', `${objectToReplaceIdentifier}%`)
        .limit(1);

      if (findError) throw findError;

      if (foundObjects && foundObjects.length > 0) {
        actualObjectToReplaceDescription = foundObjects[0].object_name;
        console.log(`[regenerateImageWithSubstitution] Found description for object to replace: "${actualObjectToReplaceDescription}"`);
      } else {
        console.warn(`[regenerateImageWithSubstitution] Could not find object matching identifier "${objectToReplaceIdentifier}" in image_objects for project ${project.id}. Using identifier as description.`);
        actualObjectToReplaceDescription = objectToReplaceIdentifier;
      }
    } catch (dbError) {
      console.error(`[regenerateImageWithSubstitution] Error fetching object description from DB:`, dbError);
      actualObjectToReplaceDescription = objectToReplaceIdentifier;
      console.warn(`[regenerateImageWithSubstitution] Using identifier "${actualObjectToReplaceDescription}" as description due to DB error.`);
    }

    replacementObjectImageUrl = replacementObject.thumbnail_url || replacementObject.asset_url;
    if (!replacementObjectImageUrl) {
      console.warn(`[regenerateImageWithSubstitution] Replacement object ${replacementObject.id} is missing asset/thumbnail URL. Cannot include its image.`);
    } else {
      console.log(`[regenerateImageWithSubstitution] Using replacement image URL: ${replacementObjectImageUrl}`);
    }

    console.log('[regenerate] Replacing object with params:', {
      objectToReplaceDescription: actualObjectToReplaceDescription,
      replacementObjectId: replacementObject.id,
      replacementObjectDescription,
      newViewType: viewType,
      newRenderingType: renderingType,
      newColorTone: colorTone
    });
  } else {
    console.log('[regenerate] Generating new variant (no object replacement) with params:', {
      newViewType: viewType,
      newRenderingType: renderingType,
      newColorTone: colorTone
    });
  }

  try {
    const prompt = getNewGenerationPrompt(
      project.style,
      renderingType || '3d',
      project.room_type,
      (colorTone || project.color_tone) ?? undefined,
      (viewType || project.view_type) ?? undefined,
      isObjectReplacement,
      isObjectReplacement ? actualObjectToReplaceDescription : null,
      isObjectReplacement ? replacementObjectDescription : null
    );

    console.log('===== FULL PROMPT SENT TO GEMINI =====');
    console.log(prompt);
    console.log('===== END PROMPT =====');

    console.log(`[regenerate] Calling Netlify function '/.netlify/functions/gemini-call'`);
    const response = await fetch('/.netlify/functions/gemini-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        mainImageUrl: originalImageUrl,
        objectImageUrls: replacementObjectImageUrl ? [replacementObjectImageUrl] : [],
      }),
    });

    console.log(`[regenerate] Netlify function response status: ${response.status}`);
    const result = await response.json();

    if (!response.ok) {
      console.error(`[regenerate] Netlify function error: ${response.statusText}`, result);
      throw new Error(result.error || `Failed to regenerate image (${response.status})`);
    }

    if (typeof result.description !== 'string' || typeof result.imageData !== 'string' || !Array.isArray(result.detectedObjects)) {
      console.error('[regenerate] Invalid data structure received from Netlify function:', result);
      throw new Error('Invalid response format from regeneration service.');
    }

    console.log('[regenerate] Successfully generated new image variant via Netlify function.');
    return {
      imageData: result.imageData,
      detectedObjects: result.detectedObjects
    };
  } catch (error) {
    console.error('Error generating new image variant:', error);
    throw new Error(`Failed to generate new image variant: ${error instanceof Error ? error.message : String(error)}`);
  }
}

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
  model: string;
  size: string;
  quality: string;
}

export async function createProjectForAsyncGeneration(params: AsyncGenerationParams): Promise<string> {
  console.log('[createProjectForAsyncGeneration] Initiating async generation with params:', params);

  let newProjectId: string | null = null;
  try {
    const { data: newProject, error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: params.userId,
        original_image_url: params.originalImageUrl,
        style: params.style,
        room_type: params.roomType,
        rendering_type: params.renderingType,
        color_tone: params.colorTone,
        view_type: params.view,
        prompt: params.prompt,
        input_user_object_ids: params.inputUserObjectIds,
        model: params.model,
        size: params.size,
        quality: params.quality,
        stato_generazione: 'pending',
        generated_image_url: null,
        thumbnail_url: null,
        generation_error: null,
      })
      .select('id')
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
    throw error instanceof Error ? error : new Error('Failed to create project record.');
  }

  if (typeof newProjectId !== 'string') {
    console.error('[createProjectForAsyncGeneration] Critical error: newProjectId is not a string after successful insertion.');
    throw new Error('Failed to get project ID after creation.');
  }
  const projectIdToInvoke: string = newProjectId;

  try {
    const { error: invokeError } = await supabase.functions.invoke('generate-image-async', {
      body: { projectId: projectIdToInvoke },
    });

    if (invokeError) {
      console.error(`[createProjectForAsyncGeneration] Error invoking function for project ${projectIdToInvoke}:`, invokeError);
      await supabase
        .from('projects')
        .update({ stato_generazione: 'failed', generation_error: `Function invocation failed: ${invokeError.message}` })
        .eq('id', projectIdToInvoke);
      throw new Error(`Failed to invoke generation function: ${typeof invokeError.message === 'string' ? invokeError.message : JSON.stringify(invokeError)}`);
    }

    console.log(`[createProjectForAsyncGeneration] Successfully invoked function for project ${projectIdToInvoke}`);
    return projectIdToInvoke;

  } catch (error) {
    console.error('[createProjectForAsyncGeneration] Error during function invocation:', error);
    await supabase
      .from('projects')
      .update({ stato_generazione: 'failed', generation_error: `Function invocation failed unexpectedly.` })
      .eq('id', projectIdToInvoke);
    // Ensure a string message is thrown
    const errorMessage = error instanceof Error ? (typeof error.message === 'string' ? error.message : JSON.stringify(error)) : 'Failed to invoke generation function.';
    throw new Error(errorMessage);
  }
}
