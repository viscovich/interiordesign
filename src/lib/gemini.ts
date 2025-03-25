import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

function getPromptForTransformationMode(mode: string, style: string, roomType: string): string {
  switch (mode) {
    case 'virtual-staging':
      return `If you were to furnish this room with a ${style} style for a ${roomType}, what would you include?
Describe it in detail using markdown format with headings, bullet points, and well-formatted paragraphs.
Then generate an image that represents your idea. Try to respect the walls and windows of the attached room.`;
    
    case 'empty-space':
      return `Remove all furniture and objects from this room to create an empty space.
Describe the potential of this empty space using markdown format with headings, bullet points, and well-formatted paragraphs.
Then generate an image that shows the room completely empty. Maintain the walls, windows, and architectural features.`;
    
    case 'redesign':
      return `Redesign this ${roomType} with a ${style} style, changing the layout, colors, and materials.
Describe your redesign in detail using markdown format with headings, bullet points, and well-formatted paragraphs.
Then generate an image that represents your redesign. You can modify walls, flooring, and fixtures while maintaining the basic room structure.`;
    
    default:
      return `If you were to furnish this room with a ${style} style for a ${roomType}, what would you include?
Describe it in detail using markdown format with headings, bullet points, and well-formatted paragraphs.
Then generate an image that represents your idea. Try to respect the walls and windows of the attached room.`;
  }
}

export async function generateInteriorDesign(
  imageUrl: string,
  style: string,
  roomType: string,
  transformationMode: string = 'virtual-staging'
): Promise<{ description: string; imageData: string }> {
  console.log(`[generateInteriorDesign] Starting with params: style=${style}, roomType=${roomType}, transformationMode=${transformationMode}`);
  
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

  const prompt = getPromptForTransformationMode(transformationMode, style, roomType);
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

    for (const part of parts) {
      if (part.text) {
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
