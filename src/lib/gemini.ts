import { GoogleGenerativeAI, InlineDataPart } from '@google/generative-ai'; // Added InlineDataPart
import { useCredit } from './userService';
import { UserObject } from './userObjectsService'; // Added UserObject import

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Helper to fetch and convert image URL to InlineDataPart
export async function urlToInlineDataPart(url: string): Promise<InlineDataPart> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  );
  return {
    inlineData: {
      data: base64,
      mimeType: blob.type,
    },
  };
}

// Rename function for clarity
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
  const viewPrompt = newView && viewMap[newView] ? ` Set the point of view ${viewMap[newView]}.` : '';

  const objectsInstruction = includeObjectsInstruction
    ? "\nIMPORTANT: You MUST replace the original object(s) with the attached replacement image(s). Remove the original object completely and integrate the new object naturally into the scene. The replacement object should match the style and perspective of the original design."
    : '';

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
- **First, list the essential furniture and appliances visible in the updated image.** Use the same format as the initial generation: a plain list starting each item with '- '.
- **Then, generate one updated image** of the same room design, reflecting the requested changes above in style, color tone, viewpoint, or rendering type.`;
}


// Internal function to handle the actual API call
async function _callGeminiApi(
  prompt: string,
  mainImageUrl: string,
  objectImageParts: InlineDataPart[] = []
): Promise<{ description: string; imageData: string; detectedObjects: string[] }> {
  console.log(`[_callGeminiApi] Calling Gemini with prompt starting: "${prompt.substring(0, 3000)}..." and ${objectImageParts.length} object images.`);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp-image-generation",
    generationConfig: {
      responseModalities: ["Text", "Image"],
    } as any,
  });

  // Fetch and prepare main image data
  const mainImagePart = await urlToInlineDataPart(mainImageUrl);

  // objectImageParts is now passed directly as parameter

  try {
    console.log(`[_callGeminiApi] Preparing contents...`);
    const contents = [
      mainImagePart,
      ...objectImageParts,
      { text: prompt },
    ];
    console.log(`[_callGeminiApi] Request contents length: ${contents.length}`);

    const response = await model.generateContent(contents);
    console.log(`[_callGeminiApi] Raw API response:`, JSON.stringify(response, null, 2));

    const parts = response.response?.candidates?.[0]?.content?.parts || [];
    console.log(`[_callGeminiApi] Response parts count: ${parts.length}`);

    let description = '';
    let imageData = '';
    const detectedObjects: string[] = []; // Keep object detection logic here for now

    for (const part of parts) {
      if (part.text) {
         // Simplified object detection logic (assuming it's still needed from the prompt structure)
         const lines = part.text.split('\n');
         for (const line of lines) {
           if (line.trim().startsWith('- ')) {
             const objectName = line.trim().replace(/^- /, '').trim();
             if (objectName) {
               detectedObjects.push(objectName);
             }
           }
         }
         description += part.text; // Append all text parts
         console.log(`[_callGeminiApi] Found text part.`);
      } else if (part.inlineData) {
        imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        console.log(`[_callGeminiApi] Found image data of type: ${part.inlineData.mimeType}`);
      }
    }
     console.log('[Object Detection] Found objects:', detectedObjects); // Log detected objects

    console.log(`[_callGeminiApi] Processed response: description=${description ? 'present' : 'missing'}, imageData=${imageData ? 'present' : 'missing'}`);

    if (!description && !imageData) {
      throw new Error("503: Service Unavailable - Both description and image data are missing");
    } else if (!description) {
      console.warn("API response missing description text.");
    } else if (!imageData) {
      throw new Error("imageData=missing: Model is overloaded, try again later");
    }

    // Return detectedObjects even if description is missing, might be useful
    return { description, imageData, detectedObjects };

  } catch (error) {
    console.error("Gemini API Error:", error);
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    if (error instanceof Error) {
      if (error.name === 'GoogleGenerativeAIFetchError' && error.message.includes('503')) {
        throw new Error("503: Service Unavailable - Model is currently overloaded");
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error("500: Server Error - Failed to connect to API");
      }
    }
    throw new Error(`Failed to generate design: ${error instanceof Error ? error.message : String(error)}`);
  }
}


// This function now handles INITIAL generation using getGenerationPrompt
export async function generateInteriorDesign(
  imageUrl: string,
  style: string,
  roomType: string,
  colorTone: string, // Keep colorTone here for the initial prompt
  renderingType: string,
  view: string,
  userId: string,
  selectedObjects: UserObject[] = [] // Keep selectedObjects for initial prompt object instruction
): Promise<{ description: string; imageData: string; detectedObjects: string[] }> {
  // Deduce credits only once per user action (should be handled in the calling service ideally)
  // await useCredit(userId, 5); // Moved potentially to projectService
  console.log(`[generateInteriorDesign - Initial] Starting with params: style=${style}, roomType=${roomType}, renderingType=${renderingType}, view=${view}, objects=${selectedObjects.length}`);

  // 1. Generate the INITIAL prompt
  const prompt = getGenerationPrompt(
    renderingType,
    style,
    roomType,
    colorTone, // Pass colorTone for initial prompt
    view,
    selectedObjects.length > 0 // Pass object flag for initial prompt
  );
  console.log(`[generateInteriorDesign - Initial] Generated initial prompt.`);

  // 2. Prepare object image data (if any)
  const objectImageParts: InlineDataPart[] = [];
  for (const obj of selectedObjects) {
    const url = obj.thumbnail_url || obj.asset_url;
    if (url) {
      try {
        const imagePart = await urlToInlineDataPart(url);
        objectImageParts.push(imagePart);
      } catch (error) {
        console.error(`Error converting object image to inline data: ${url}`, error);
        // Continue with other images if one fails
      }
    }
  }

  // 3. Call the internal API function
  // Note: We are NOT deducting credits here anymore, assuming it's handled upstream.
  return await _callGeminiApi(prompt, imageUrl, objectImageParts);
}


// Export the internal function for use in projectsService
export { _callGeminiApi };
