import { GoogleGenerativeAI, InlineDataPart } from '@google/generative-ai'; // Added InlineDataPart
import { useCredit } from './userService';
import { UserObject } from './userObjectsService'; // Added UserObject import

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Helper to fetch and convert image URL to InlineDataPart
async function urlToInlineDataPart(url: string): Promise<InlineDataPart> {
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
  includeObjectsInstruction?: boolean // Added flag for objects
): string {
  let colorPrompt = '';
  if (colorTone) {
    if (colorTone.startsWith('palette:')) {
      const paletteName = colorTone.substring('palette:'.length);
      colorPrompt = ` using a ${paletteName} color palette`;
    } else if (colorTone.startsWith('color:')) {
      const colorName = colorTone.substring('color:'.length);
      // Using the phrasing discussed in PLAN MODE
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

  // Add instruction for objects if needed
  const objectsInstruction = includeObjectsInstruction ? "\nBe sure to include the attached object(s) in the final image, integrating them naturally into the scene." : "";

  switch (renderingType.toLowerCase()) {
    case 'wireframe':
      return `Generate a black and white architectural **line drawing** of a ${roomType} in wireframe style.
Show all major structural and furniture elements (walls, windows, cabinets, sink, stove, etc.) using only **clean black outlines**, with **no color, shading, or textures**.
Use a 3D perspective based on the provided plan or image.${viewPrompt}
Avoid realistic rendering. Focus only on a **technical-style sketch** as if created for architectural drafting.
${listAndDescriptionPrompt}${imagePrompt}${objectsInstruction}`; // Added objectsInstruction

    case '2d':
      return `Generate a clean and well-structured **2D floor plan** of a ${roomType}, viewed strictly from above.
The drawing should clearly show walls, doors, windows, furniture, and key appliances, either with outlines or filled flat symbols.
Do not include any perspective, shading, or 3D effects. The goal is to produce a **clear, professional top-down layout**.${colorPrompt}
${listAndDescriptionPrompt}${imagePrompt}${objectsInstruction}`; // Added objectsInstruction

    case '3d':
    default:
      // Revised prompt structure from PLAN MODE discussion
      return `**Primary Goal:** Generate a stunning 3D rendered image of a redesigned ${roomType} based on the provided floor plan or photo.

**Design Specifications:**
*   **Style:** ${style}
*   **Color Palette/Tone:** ${colorPrompt.trim() || 'Default'}
*   **Viewpoint:** ${view && viewMap[view] ? viewMap[view] : 'Default (Front)'}
*   **Rendering Type:** ${renderingType}
*   **Input:** Analyze the provided floor plan or photo (empty or furnished) to accurately reflect the layout of walls, doors, windows, and internal spaces in the final rendering.

**Required Outputs:**

1.  **Textual Description (Markdown Format):**
    *   **Essential Furniture & Appliances:** ${listAndDescriptionPrompt}
    *   **Layout Description:** Describe the layout and positioning of the listed elements within the room.
    *   **Final Design Details:** Describe the complete redesigned room, including layout, furniture choices, colors, materials, and how they fit the ${style} style${colorPrompt}. Ensure the design reflects the room's purpose and structure.${viewPrompt}

2.  **Image Output (Most Important):**
    *   Generate **one high-quality 3D rendered image** visually representing the final described design according to all specifications (${style} style, ${colorPrompt.trim() || 'appropriate colors'}, ${view && viewMap[view] ? viewMap[view] : 'front view'}). This image is the main deliverable.${objectsInstruction}`; // Added objectsInstruction
  }
}



export async function generateInteriorDesign(
  imageUrl: string,
  style: string,
  roomType: string,
  colorTone: string,
  renderingType: string,
  view: string,
  userId: string,
  selectedObjects: UserObject[] = [] // Added selectedObjects parameter
): Promise<{ description: string; imageData: string; detectedObjects: string[] }> {
  // Deduce 5 credits for image generation
  await useCredit(userId, 5);
  console.log(`[generateInteriorDesign] Starting with params: style=${style}, roomType=${roomType}, renderingType=${renderingType}, view=${view}, objects=${selectedObjects.length}`);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp-image-generation",
    generationConfig: {
      responseModalities: ["Text", "Image"],
    } as any,
  });

  // Fetch and prepare main image data
  const mainImagePart = await urlToInlineDataPart(imageUrl);

  // Fetch and prepare selected object image data
  const objectImageParts: InlineDataPart[] = [];
  for (const obj of selectedObjects) {
    try {
      // Prefer thumbnail_url if available, otherwise use asset_url
      const objectImageUrl = obj.thumbnail_url || obj.asset_url;
      if (objectImageUrl) {
        const objectImagePart = await urlToInlineDataPart(objectImageUrl);
        objectImageParts.push(objectImagePart);
      } else {
         console.warn(`Skipping object ${obj.id} due to missing image URL.`);
      }
    } catch (error) {
      console.error(`Error fetching image for object ${obj.id}:`, error);
      // Optionally decide whether to proceed without this object's image or throw error
    }
  }

  // Generate prompt, including object instruction if objects are selected
  const prompt = getGenerationPrompt(
    renderingType, 
    style, 
    roomType, 
    colorTone, 
    view, 
    selectedObjects.length > 0 // Pass true if objects are selected
  );
  console.log(`[generateInteriorDesign] Using prompt: ${prompt}`);

  try {
    console.log(`[generateInteriorDesign] Calling Gemini API...`);
    // Combine main image, object images, and text prompt
    const contents = [
      mainImagePart,
      ...objectImageParts, // Spread the object image parts
      { text: prompt },
    ];
    
    console.log(`[generateInteriorDesign] Request contents length: ${contents.length}`); // Log length instead of full content

    const response = await model.generateContent(contents);
    console.log(`[generateInteriorDesign] Raw API response:`, JSON.stringify(response, null, 2));

    const parts = response.response?.candidates?.[0]?.content?.parts || [];
    console.log(`[generateInteriorDesign] Response parts:`, JSON.stringify(parts, null, 2));

    let description = '';
    let imageData = '';
    const detectedObjects: string[] = [];

    for (const part of parts) {
      if (part.text) {
        const lines = part.text.split('\n');
        let reachedDescription = false;

        for (const line of lines) {
          if (line.trim().startsWith('###')) {
            reachedDescription = true;
            break;
          }

          if (line.trim().startsWith('- ')) {
            const objectName = line.trim().replace(/^- /, '').trim();
            if (objectName) {
              detectedObjects.push(objectName);
            }
          }
        }

        console.log('[Object Detection] Found objects:', detectedObjects);
        description += part.text;
        console.log(`[generateInteriorDesign] Found text part of length: ${part.text.length}`);
      } else if (part.inlineData) {
        imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        console.log(`[generateInteriorDesign] Found image data of type: ${part.inlineData.mimeType}`);
      }
    }

    console.log(`[generateInteriorDesign] Processed response: description=${description ? 'present' : 'missing'}, imageData=${imageData ? 'present' : 'missing'}`);

    if (!description && !imageData) {
      throw new Error("Incomplete response: Both description and image data are missing");
    } else if (!description) {
      throw new Error("Incomplete response: Description is missing");
    } else if (!imageData) {
      throw new Error("Incomplete response: Image data is missing");
    }

    return { description, imageData, detectedObjects };
  } catch (error) {
    console.error("Errore nella generazione:", error);
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error;
  }
}
