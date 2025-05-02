import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("generate-image-async function booting up");

// Define expected request body structure
interface RequestPayload {
  projectId: string;
}

// Define structure for project data fetched from DB
// (Should match the columns we added/use)
interface ProjectData {
  id: string;
  user_id: string;
  original_image_url: string;
  prompt: string;
  model: string; // e.g., 'dall-e-3'
  size: string; // e.g., '1024x1024'
  quality: string; // e.g., 'standard'
  input_user_object_ids?: string[] | null; // Array of UUIDs
  // Add other fields if needed by the function logic
}

// Define structure for user object data
interface UserObjectData {
  id: string;
  asset_url: string;
  thumbnail_url?: string | null;
}

serve(async (req) => {
  const origin = req.headers.get("Origin");

  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  let projectId: string | null = null;
  let supabaseClient: any; // Define Supabase client variable

  try {
    // --- 0. Initialize Supabase Client ---
    // Use environment variables for Supabase URL and Anon Key
    // Use Service Role Key for admin operations within the function
    supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Use Service Role Key
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    console.log("Supabase client initialized.");

    // --- 1. Extract Project ID from Request ---
    const payload: RequestPayload = await req.json();
    projectId = payload.projectId;
    if (!projectId) {
      throw new Error("Missing projectId in request body");
    }
    console.log(`Processing request for projectId: ${projectId}`);

    // --- 2. Fetch Project Data from Database ---
    console.log("Fetching project data...");
    const { data: projectData, error: projectError } = await supabaseClient
      .from("projects")
      .select(
        "id, user_id, original_image_url, prompt, model, size, quality, input_user_object_ids"
      )
      .eq("id", projectId)
      .single();

    if (projectError) throw projectError;
    if (!projectData) throw new Error(`Project not found: ${projectId}`);
    console.log("Project data fetched successfully.");

    // Type assertion after check
    const project = projectData as ProjectData;

    // --- 3. Fetch Input User Object URLs (if any) ---
    let userObjectUrls: string[] = [];
    if (project.input_user_object_ids && project.input_user_object_ids.length > 0) {
      console.log("Fetching user object URLs...");
      const { data: userObjects, error: objectsError } = await supabaseClient
        .from("user_objects")
        .select("id, asset_url, thumbnail_url")
        .in("id", project.input_user_object_ids);

      if (objectsError) throw objectsError;

      userObjectUrls = (userObjects as UserObjectData[])
        .map(obj => obj.thumbnail_url || obj.asset_url) // Prefer thumbnail if available
        .filter(url => !!url); // Filter out any null/empty URLs
      console.log(`Fetched ${userObjectUrls.length} user object URLs.`);
    }

    // --- 4. Download Image Blobs from Storage ---
    console.log("Downloading image blobs...");
    const imageFetchPromises = [
        fetch(project.original_image_url).then(res => res.blob()),
        ...userObjectUrls.map(url => fetch(url).then(res => res.blob()))
    ];
    const imageBlobs = await Promise.all(imageFetchPromises);
    const mainImageBlob = imageBlobs[0];
    const userObjectBlobs = imageBlobs.slice(1);
    console.log(`Downloaded ${imageBlobs.length} image blobs.`);

    // --- 5. Get Target API Key (e.g., OpenAI) ---
    const targetApiKey = Deno.env.get("OPENAI_API_KEY"); // Example: Use OPENAI_API_KEY
    if (!targetApiKey) {
      throw new Error("Target API key (e.g., OPENAI_API_KEY) is not set in environment variables.");
    }
    console.log("Target API key retrieved.");

    // --- 6. Construct FormData for Target API ---
    // Using OpenAI /v1/images/edits as example
    console.log("Constructing FormData for API call...");
    const formData = new FormData();
    formData.append("prompt", project.prompt);
    formData.append("model", project.model); // e.g., 'dall-e-2' for edits, or adjust if using different endpoint/model
    formData.append("size", project.size);
    // formData.append("quality", project.quality); // 'quality' might not be applicable to edits endpoint
    formData.append("n", "1"); // Request one image

    // Append main image (required for edits)
    formData.append("image", mainImageBlob, "input_image.png"); // Filename is arbitrary but required

    // Append mask or additional images if the API supports/requires it
    // For OpenAI edits, a mask is often needed if not replacing the whole image.
    // If using user objects as *part* of the prompt/edit, the API might need them differently.
    // This part needs careful adaptation based on the *specific* API endpoint and its requirements.
    // Assuming for now we just pass the main image and prompt for a general edit/generation.
    // If userObjectBlobs are meant to be *part* of the edit, they might need to be appended differently
    // or potentially require a different API endpoint (like variations or generation from scratch).

    // --- 7. Call Target Image Generation API ---
    console.log(`Calling target API (${project.model})...`);
    const apiResponse = await fetch("https://api.openai.com/v1/images/edits", { // ADJUST ENDPOINT if needed
      method: "POST",
      headers: {
        Authorization: `Bearer ${targetApiKey}`,
        // Content-Type is set automatically by fetch when using FormData
      },
      body: formData,
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error("API Error Response:", errorBody);
      throw new Error(`API call failed: ${apiResponse.status} ${apiResponse.statusText} - ${errorBody}`);
    }

    const result = await apiResponse.json();
    console.log("API call successful.");
    // console.log("API Result:", JSON.stringify(result)); // Log full result if needed

    // --- 8. Process API Response ---
    // Extract image URL (structure depends on the API)
    const generatedImageUrlFromApi = result.data?.[0]?.url; // Example for OpenAI
    if (!generatedImageUrlFromApi) {
      throw new Error("Generated image URL not found in API response.");
    }
    console.log(`Generated image URL from API: ${generatedImageUrlFromApi}`);

    // --- 9. Download Generated Image ---
    console.log("Downloading generated image...");
    const generatedImageResponse = await fetch(generatedImageUrlFromApi);
    if (!generatedImageResponse.ok) {
      throw new Error("Failed to download generated image from API URL.");
    }
    const generatedImageBlob = await generatedImageResponse.blob();
    console.log("Generated image downloaded.");

    // --- 10. Upload Generated Image to Supabase Storage ---
    const generatedImageFileName = `generated/${project.id}_${Date.now()}.png`; // Unique name
    console.log(`Uploading generated image to: ${generatedImageFileName}`);
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from("projects") // Assuming 'projects' bucket
      .upload(generatedImageFileName, generatedImageBlob, {
        contentType: generatedImageBlob.type || 'image/png',
        upsert: true, // Overwrite if somehow exists
      });

    if (uploadError) throw uploadError;
    if (!uploadData) throw new Error("Upload failed: No data returned.");

    // --- 11. Get Public URL for Uploaded Image ---
    const { data: urlData } = supabaseClient.storage
      .from("projects")
      .getPublicUrl(generatedImageFileName);

    const generatedImagePublicUrl = urlData?.publicUrl;
    if (!generatedImagePublicUrl) {
      throw new Error("Failed to get public URL for uploaded generated image.");
    }
    console.log(`Generated image uploaded to Supabase Storage: ${generatedImagePublicUrl}`);

    // --- 12. TODO: Generate Thumbnail (Optional but recommended) ---
    // This would involve:
    // - Reading the generatedImageBlob
    // - Resizing using a Deno image library (e.g., 'imagescript')
    // - Uploading the thumbnail blob to storage (e.g., `thumbnails/generated/...`)
    // - Getting its public URL
    const thumbnailUrl = generatedImagePublicUrl; // Placeholder: Use main image URL for now
    console.log(`Using placeholder thumbnail URL: ${thumbnailUrl}`);

    // --- 13. TODO: Parse Text Response & Save Detected Objects ---
    // The OpenAI edits endpoint might not return a text description or object list.
    // If object detection is needed, it might require:
    // a) A different API call (e.g., to a vision model like GPT-4 Vision) using the generated image.
    // b) Parsing information embedded *in the prompt* if the prompt requested a list.
    // For now, we'll skip saving image_objects.
    console.log("Skipping object detection/saving for now.");
    // const detectedObjects = []; // Parse from API response if available
    // if (detectedObjects.length > 0) {
    //   await saveImageObjects(projectId, project.user_id, detectedObjects); // Need to implement saveImageObjects call here
    // }

    // --- 14. Update Project Status in Database ---
    console.log("Updating project status to 'completed'...");
    const { error: updateError } = await supabaseClient
      .from("projects")
      .update({
        stato_generazione: "completed",
        generated_image_url: generatedImagePublicUrl,
        thumbnail_url: thumbnailUrl, // Save the thumbnail URL
        generation_error: null, // Clear any previous error
        updated_at: new Date().toISOString(), // Update timestamp
      })
      .eq("id", projectId);

    if (updateError) throw updateError;
    console.log("Project status updated successfully.");

  // --- 15. Return Success Response ---
    return new Response(JSON.stringify({ success: true, projectId: projectId }), {
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in generate-image-async function:", error);

    // --- Error Handling: Update Project Status ---
    if (projectId && supabaseClient) {
      try {
        console.log(`Attempting to update project ${projectId} status to 'failed'...`);
        await supabaseClient
          .from("projects")
          .update({
            stato_generazione: "failed",
            generation_error: error.message || "Unknown error",
            updated_at: new Date().toISOString(),
          })
          .eq("id", projectId);
        console.log(`Project ${projectId} status updated to 'failed'.`);
      } catch (updateError) {
        console.error(`Failed to update project ${projectId} status to 'failed':`, updateError);
        // Log this error but return the original error message
      }
    }

    // --- Return Error Response ---
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
