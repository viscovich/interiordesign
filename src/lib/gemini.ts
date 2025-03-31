import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Rename function for clarity
function getGenerationPrompt(
  renderingType: string,
  style: string,
  roomType: string,
  colorTone?: string,
  view?: string
): string {
  const colorPrompt = colorTone ? ` using a ${colorTone} color palette` : '';
  const viewPrompt = view ? ` Set the point of view to be ${view} to provide a clear perspective of the room.` : '';

  return `Analyze the provided floor plan or photo and generate a ${renderingType} that accurately reflects the layout of walls, doors, windows, and internal spaces.

First, identify all relevant furniture and appliances that are or should be present in the ${roomType}. List them clearly in the following format:
- [object name 1]
- [object name 2]
- etc.

Then, redesign the ${roomType} in a ${style} style${colorPrompt}. Make sure the design choices reflect the room’s purpose and architectural structure.${viewPrompt}

Describe the final design using markdown format with headings, bullet points, and well-structured paragraphs. Include details about layout, furniture, colors, and materials.

Finally, generate an image that represents the redesign as accurately and professionally as possible.`;
}

export async function generateInteriorDesign(
  imageUrl: string,
  style: string,
  roomType: string,
  colorTone: string,
  renderingType: string, // Change parameter name
  view: string // Make view required
): Promise<{ description: string; imageData: string }> {
  // Update log to use renderingType
  console.log(`[generateInteriorDesign] Starting with params: style=${style}, roomType=${roomType}, renderingType=${renderingType}, view=${view}`);

  // Using type assertion to bypass TypeScript check while maintaining the exact format
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp-image-generation",
    generationConfig: {
      responseModalities: ["Text", "Image"], 
    } as any,
  });

  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();
  const imageBuffer = await imageBlob.arrayBuffer();
  const imageBase64 = btoa(
    new Uint8Array(imageBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );

  // Update function call to use renderingType and the new function name
  const prompt = getGenerationPrompt(renderingType, style, roomType, colorTone, view);
  console.log(`[generateInteriorDesign] Using prompt: ${prompt}`);

  try {
    console.log(`[generateInteriorDesign] Calling Gemini API...`);
    const contents = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: imageBlob.type,
        }
      },
      {
        text: prompt
      }
    ];
    console.log(`[generateInteriorDesign] Request contents:`, JSON.stringify(contents, null, 2));
    
    const response = await model.generateContent(contents);
    console.log(`[generateInteriorDesign] Raw API response:`, JSON.stringify(response, null, 2));
    
    // Use optional chaining to safely access nested properties
    const parts = response.response?.candidates?.[0]?.content?.parts || [];
    console.log(`[generateInteriorDesign] Response parts:`, JSON.stringify(parts, null, 2));

    let description = '';
    let imageData = '';
    const detectedObjects: string[] = [];

    for (const part of parts) {
      if (part.text) {
        // Extract detected objects from the beginning of the response
        const objectListMatch = part.text.match(/(- .+?)(?:\n\n|$)/g);
        if (objectListMatch) {
          objectListMatch.forEach(obj => {
            const objectName = obj.replace(/^- /, '').trim();
            if (objectName) {
              detectedObjects.push(objectName);
            }
          });
          console.log('[Object Detection] Found objects:', detectedObjects);
        }

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

    return { description, imageData };
  } catch (error) {
    console.error("Errore nella generazione:", error);
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error; // Throw the original error to preserve the stack trace and message
  }
}
