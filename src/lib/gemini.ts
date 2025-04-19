// Removed GoogleGenerativeAI, InlineDataPart imports and API Key initialization
// import { useCredit } from './userService'; // Keep if needed elsewhere, remove if only for gemini
import { UserObject } from './userObjectsService'; // Keep UserObject import
import { InlineDataPart } from '@google/generative-ai'; // Re-add InlineDataPart for the helper

// Restore urlToInlineDataPart helper function as it's needed by projectsService
// Ensure it's exported
export async function urlToInlineDataPart(url: string): Promise<InlineDataPart> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const blob = await response.blob();
   if (!blob || blob.size === 0) {
      throw new Error(`Fetched empty or invalid image data from ${url}`);
  }
  const buffer = await blob.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  );
  return {
    inlineData: {
      data: base64,
      mimeType: blob.type || 'image/jpeg', // Provide default mimetype if missing
    },
  };
}


// Rename function for clarity (Keep prompt generation logic client-side)
function getGenerationPrompt(
  renderingType: string,
  style: string,
  roomType: string,
  colorTone?: string, // Expects 'palette:name' or 'color:name' or undefined
  view?: string,
  includeObjectsInstruction?: boolean
): string {
  let colorPrompt = '';
  if (colorTone) {
    if (colorTone.startsWith('palette:')) {
      const paletteName = colorTone.substring('palette:'.length);
      colorPrompt = ` using a ${paletteName} color palette`;
    } else if (colorTone.startsWith('color:')) {
      const colorName = colorTone.substring('color:'.length);
      colorPrompt = ` focusing on ${colorName} tones`; 
    }
  }

  const viewMap: Record<string, string> = {
    frontal: "from the front, facing the main wall",
    side: "from the side, capturing an angled perspective",
    top: "from above, as a bird’s-eye view"
  };
  const viewPrompt = view && viewMap[view] ? ` Set the point of view ${viewMap[view]}.` : '';

  const listAndDescriptionPrompt = `
Start by listing the essential furniture and appliances that should be included in the redesigned ${roomType}, based on the ${style} style${colorPrompt}.
**Only provide a plain list of object names, with no extra descriptions, like this:**
- [object name 1]
- [object name 2]
- etc.

Do not combine this list with any explanation or context. The description comes after.

Then, describe the layout and positioning of these elements in the ${roomType}.`;

  const imagePrompt = `

Finally, generate an image that represents the design in a ${renderingType} format.`;

  const objectsInstruction = includeObjectsInstruction
    ? "\nBe sure to include the attached object(s) in the final image, integrating them naturally into the scene."
    : "";

  switch (renderingType.toLowerCase()) {
    case 'wireframe':
      return `Generate a black and white architectural **line drawing** of a ${roomType} in wireframe style.
Show all major structural and furniture elements (walls, windows, cabinets, sink, stove, etc.) using only **clean black outlines**, with **no color, shading, or textures**.
Use a 3D perspective based on the provided plan or image.${viewPrompt}
Avoid realistic rendering. Focus only on a **technical-style sketch** as if created for architectural drafting.
${listAndDescriptionPrompt}${imagePrompt}${objectsInstruction}`;

    case '2d':
      return `Generate a clean and well-structured **2D floor plan** of a ${roomType}, viewed strictly from above.
The drawing should clearly show walls, doors, windows, furniture, and key appliances, either with outlines or filled flat symbols.
Do not include any perspective, shading, or 3D effects. The goal is to produce a **clear, professional top-down layout**.${colorPrompt}
${listAndDescriptionPrompt}${imagePrompt}${objectsInstruction}`;

    case '3d':
    default:
      return `**Primary Goal:** Generate a stunning 3D rendered image of a redesigned ${roomType} based on the provided floor plan or photo (which may be empty or furnished).

**Design Specifications:**
*   **Style:** ${style}
*   **Color Palette/Tone:** ${colorPrompt.trim() || 'Default'}
*   **Viewpoint:** ${view && viewMap[view] ? viewMap[view] : 'Default (Front)'}
*   **Rendering Type:** ${renderingType}
*   **Input Analysis:** 
    - Carefully analyze the input image to detect and respect architectural elements such as walls, doors, windows, and overall layout.
    - If the input room is already furnished, treat it as a **complete redesign**: ignore existing furniture and interpret only the structural layout.
    - The final design should be based on the **actual spatial proportions** visible in the image or plan.

**Required Outputs:**

1.  **Textual Description (Markdown Format):**
    *   **Essential Furniture & Appliances:**${listAndDescriptionPrompt}
    *   **Layout Description:** Describe how these elements are arranged within the space, relative to walls and viewer orientation.
    *   **Final Design Details:** Describe the redesigned room, covering color and material choices, textures, lighting, style adherence (${style}${colorPrompt}), and how everything fits together in a cohesive and functional way.${viewPrompt}

2.  **Image Output (Most Important):**
    *   Generate **one high-quality 3D rendered image** that visually represents the final design according to all specifications (${style} style, ${colorPrompt.trim() || 'appropriate colors'}, ${view && viewMap[view] ? viewMap[view] : 'front view'}).${objectsInstruction}`;
  }
}

// Function to generate prompt for updating an existing design
export function getNewGenerationPrompt(
  baseStyle: string,
  newRenderingType: string,
  roomType: string,
  colorTone?: string, // Expects 'palette:name' or 'color:name'
  newView?: string,
  includeObjectsInstruction?: boolean, // Flag indicating if object replacement is happening
  objectToReplaceDescription?: string | null, // Description of the object being replaced
  replacementObjectDescription?: string | null // Description of the new object being inserted
): string {
  let colorPrompt = '';
  if (colorTone) {
    if (colorTone.startsWith('palette:')) {
      const paletteName = colorTone.substring('palette:'.length);
      colorPrompt = ` using a ${paletteName} color palette`;
    } else if (colorTone.startsWith('color:')) {
      const colorName = colorTone.substring('color:'.length);
      colorPrompt = ` focusing on ${colorName} tones`;
    }
  }

  const viewMap: Record<string, string> = {
    frontal: "from the front, facing the main wall",
    side: "from the side, capturing an angled perspective",
    top: "from above, as a bird’s-eye view"
  };
  const viewPrompt = newView && viewMap[newView] ? ` Set the point of view ${viewMap[newView]}.` : '';

  // Construct the specific object replacement instruction using the provided descriptions
  let objectsInstruction = '';
  if (includeObjectsInstruction && objectToReplaceDescription && replacementObjectDescription) {
    objectsInstruction = `\n**Object Replacement Instruction:** Replace the '${objectToReplaceDescription}' visible in the original image with the new object described as '${replacementObjectDescription}'. Refer to the attached image for the visual representation of the new object. Integrate it naturally into the scene, matching the style and perspective.`;
  } else if (includeObjectsInstruction) {
    // Fallback or warning if descriptions are missing but replacement was intended
    console.warn('[getNewGenerationPrompt] Object replacement intended, but descriptions are missing. Using generic instruction.');
    objectsInstruction = "\nIMPORTANT: You MUST replace the original object(s) with the attached replacement image(s). Remove the original object completely and integrate the new object naturally into the scene. The replacement object should match the style and perspective of the original design."; // Keep old generic one as fallback
  }


  return `**Goal:** Update the previously generated ${roomType} design by changing certain visual aspects, without altering the underlying architectural layout or furniture arrangement.

**Modifications to Apply:**
- **Rendering Type:** ${newRenderingType}
- **Style:** Keep the original ${baseStyle} design
- **Color Palette/Tone:**${colorPrompt || ' Keep existing tones if not specified.'}
- **Viewpoint:**${viewPrompt || ' Keep original view if not specified.'}

**Important Instructions:**
- Maintain the same room layout, proportions, and furniture positioning as in the original image.
- Do not change the architecture, wall structure, or spatial logic of the room.
- Apply the new visual settings (rendering style, viewpoint, and/or color palette) while keeping the design consistent with the existing one.${objectsInstruction}

**Deliverable:**
- **First, list the essential furniture and appliances visible in the updated image.** For each item, provide a brief description including its main color or material. Use this format: '- [color/material] [object name]'. Example: '- black sofa', '- wooden table'.
- **Then, generate one updated image** of the same room design, reflecting the requested changes above in style, color tone, viewpoint, or rendering type.`;
}

// Removed internal _callGeminiApi function. Calls will now go to the Netlify function.

// This function now handles INITIAL generation using getGenerationPrompt and calls the Netlify function
export async function generateInteriorDesign(
  imageUrl: string,
  style: string,
  roomType: string,
  colorTone: string, // Keep colorTone here for the initial prompt
  renderingType: string,
  view: string,
  userId: string, // Keep userId if needed for logging or future checks, but credit deduction is likely server-side now
  selectedObjects: UserObject[] = []
): Promise<{ description: string; imageData: string; detectedObjects: string[] }> {
  console.log(`[generateInteriorDesign] Calling Netlify function with params: style=${style}, roomType=${roomType}, renderingType=${renderingType}, view=${view}, objects=${selectedObjects.length}`);

  // 1. Generate the prompt client-side
  const prompt = getGenerationPrompt(
    renderingType,
    style,
    roomType,
    colorTone, // Pass colorTone for initial prompt
    view,
    selectedObjects.length > 0 // Pass object flag for initial prompt
  );
  console.log(`[generateInteriorDesign] Generated prompt.`);

  // 2. Prepare object image URLs (if any)
  const objectImageUrls = selectedObjects
    .map(obj => obj.thumbnail_url || obj.asset_url)
    .filter((url): url is string => !!url); // Filter out null/undefined URLs

  // 3. Call the Netlify function
  try {
    // Add detailed logging before the fetch call
    console.log(`[generateInteriorDesign] Preparing to call Netlify function '/.netlify/functions/gemini-call'`);
    console.log(`[generateInteriorDesign]   mainImageUrl: ${imageUrl}`);
    console.log(`[generateInteriorDesign]   objectImageUrls: ${JSON.stringify(objectImageUrls)}`);
    console.log(`[generateInteriorDesign]   prompt starts with: "${prompt.substring(0, 100)}..."`);

    // Basic check for mainImageUrl validity (can be enhanced)
    if (!imageUrl || !imageUrl.startsWith('http')) {
        console.error(`[generateInteriorDesign] Invalid mainImageUrl detected before fetch: ${imageUrl}`);
        throw new Error('Invalid main image URL provided for generation.');
    }
    // Optional: Add similar check for objectImageUrls if needed

    const response = await fetch('/.netlify/functions/gemini-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        mainImageUrl: imageUrl,
        objectImageUrls: objectImageUrls,
      }),
    });

    console.log(`[generateInteriorDesign] Netlify function response status: ${response.status}`);
    const result = await response.json();

    if (!response.ok) {
      console.error(`[generateInteriorDesign] Netlify function error: ${response.statusText}`, result);
      // Throw a more specific error based on status or result content
      throw new Error(result.error || `Failed to generate design (${response.status})`);
    }

    console.log(`[generateInteriorDesign] Received data from Netlify function.`);
    // Validate the expected fields exist
    if (typeof result.description !== 'string' || typeof result.imageData !== 'string' || !Array.isArray(result.detectedObjects)) {
        console.error('[generateInteriorDesign] Invalid data structure received from Netlify function:', result);
        throw new Error('Invalid response format from generation service.');
    }

    return {
        description: result.description,
        imageData: result.imageData,
        detectedObjects: result.detectedObjects
    };

  } catch (error) {
    console.error("[generateInteriorDesign] Error calling Netlify function:", error);
    // Re-throw or handle the error appropriately for the UI
    throw error instanceof Error ? error : new Error('An unknown error occurred during design generation.');
  }
}

// Removed export of _callGeminiApi

// --- Function to Generate Object Description (Calls Netlify Function) ---
export async function generateObjectDescription(imageUrl: string): Promise<string> {
  console.log(`[generateObjectDescription] Calling Netlify function for image: ${imageUrl}`);

  try {
    const response = await fetch('/.netlify/functions/gemini-describe-object', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    console.log(`[generateObjectDescription] Netlify function response status: ${response.status}`);
    const result = await response.json();

    if (!response.ok) {
      console.error(`[generateObjectDescription] Netlify function error: ${response.statusText}`, result);
      throw new Error(result.error || `Failed to generate description (${response.status})`);
    }

     // Check if description exists in the response
    if (typeof result.description !== 'string') {
        console.warn('[generateObjectDescription] Description missing or invalid in Netlify function response:', result);
        return 'Object description unavailable'; // Return default as per original logic
    }

    console.log(`[generateObjectDescription] Received description: "${result.description}"`);
    return result.description;

  } catch (error) {
    console.error(`[generateObjectDescription] Error calling Netlify function for ${imageUrl}:`, error);
    // Return a default error string as per original logic
    return 'Object description failed';
  }
}
