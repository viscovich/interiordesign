// netlify/functions/gemini-call.ts
import { GoogleGenerativeAI, InlineDataPart, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

// Helper to fetch and convert image URL to InlineDataPart (copied from original gemini.ts)
async function urlToInlineDataPart(url: string): Promise<InlineDataPart> {
  // Add error handling for invalid URLs
  if (!url) {
    console.error('Empty URL provided');
    throw new Error('Image URL is required');
  }

  // Check for valid URL format (http, https, or data URIs)
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:', 'data:'].includes(parsedUrl.protocol)) {
      console.error(`Invalid URL protocol: ${url}`);
      throw new Error('Only HTTP/HTTPS and data URLs are supported');
    }
  } catch (e) {
    console.error(`Invalid URL format: ${url}`);
    throw new Error('Invalid image URL format');
  }
  console.log(`Fetching image from URL: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error(`Error body: ${errorBody}`);
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Reject AVIF files as they're not supported by Gemini
    if (url.endsWith('.avif')) {
      throw new Error('AVIF format is not supported. Please use JPEG or PNG.');
    }
    const blob = await response.blob();

    // Add check for empty blob or invalid type
    if (!blob || blob.size === 0) {
      throw new Error(`Fetched empty or invalid image data from ${url}`);
    }

    console.log(`Fetched blob type: ${blob.type}, size: ${blob.size}`);
    const buffer = await blob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    // Force JPEG if type is empty or problematic (but not AVIF)
    const mimeType = blob.type && blob.type !== 'application/octet-stream' && !blob.type.includes('avif')
      ? blob.type 
      : 'image/jpeg';

    return {
      inlineData: {
        data: base64,
        mimeType: mimeType,
      },
    };
  } catch (error) {
    console.error(`Error processing image URL ${url}:`, error);
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    console.error("GEMINI_API_KEY environment variable not set.");
    return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error: API key missing." }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
    console.log('Received request body:', JSON.stringify(body, null, 2)); // Log full request
  } catch (error) {
    console.error("Failed to parse request body:", error);
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const { prompt, mainImageUrl, objectImageUrls = [] } = body;
  console.log('Processing with:', {
    promptLength: prompt?.length,
    mainImageUrl: mainImageUrl,
    objectImageCount: objectImageUrls.length,
    sampleObjectUrl: objectImageUrls[0] // Log first object URL for debugging
  });

  if (!prompt || !mainImageUrl) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields: prompt and mainImageUrl." }) };
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation", // Ensure this matches client
      generationConfig: {
        responseModalities: ["Text", "Image"],
      } as any, // Cast needed as SDK types might be stricter
       safetySettings: [ // Add safety settings to reduce blocks
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    console.log(`Preparing main image part for: ${mainImageUrl}`);
    const mainImagePart = await urlToInlineDataPart(mainImageUrl);
    console.log(`Main image part prepared.`);

    const objectImageParts: InlineDataPart[] = [];
    console.log(`Preparing ${objectImageUrls.length} object image parts...`);
    for (const url of objectImageUrls) {
      if (!url) {
        console.error('Empty object URL provided, skipping');
        continue;
      }
      try {
        console.log(`Preparing object image part for: ${url}`);
        if (!url.startsWith('http')) {
          throw new Error(`Invalid object URL format: ${url}`);
        }
        const imagePart = await urlToInlineDataPart(url);
        objectImageParts.push(imagePart);
        console.log(`Object image part prepared for: ${url}`);
      } catch (error) {
        console.error(`Skipping object image due to error: ${url}`, error);
        // Continue with other objects but log the error
      }
    }
     console.log(`Finished preparing object image parts.`);


    const contents = [
      mainImagePart,
      ...objectImageParts,
      { text: prompt },
    ];
    console.log(`Calling Gemini API with ${contents.length} content parts.`);

    const result = await model.generateContent(contents);
    console.log(`Received response from Gemini API.`);
    // console.log(`Full Raw API response object:`, JSON.stringify(result, null, 2)); // Keep for debugging if needed

    const response = result.response;
    const parts = response?.candidates?.[0]?.content?.parts || [];
     console.log(`Response parts count: ${parts.length}`);

    let description = '';
    let imageData = '';
    const detectedObjects: string[] = [];

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
         console.log(`Found text part.`);
      } else if (part.inlineData) {
        imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        console.log(`Found image data of type: ${part.inlineData.mimeType}`);
      }
    }
    console.log('[Object Detection] Found objects:', detectedObjects);

    if (!description && !imageData) {
        console.error("Gemini response missing both description and image data.");
        // Check for safety ratings or finish reason
        const finishReason = response?.candidates?.[0]?.finishReason;
        const safetyRatings = response?.candidates?.[0]?.safetyRatings;
        console.error(`Finish Reason: ${finishReason}`);
        console.error(`Safety Ratings: ${JSON.stringify(safetyRatings)}`);
        if (finishReason === 'SAFETY') {
             return { statusCode: 400, body: JSON.stringify({ error: "Content blocked due to safety filters.", details: safetyRatings }) };
        }
        return { statusCode: 503, body: JSON.stringify({ error: "Service Unavailable - Both description and image data are missing from response." }) };
    } else if (!imageData) {
        console.warn("API response missing image data.");
         return { statusCode: 503, body: JSON.stringify({ error: "Service Unavailable - Image data missing from response. Model might be overloaded." }) };
    } else if (!description) {
        console.warn("API response missing description text.");
        // Allow proceeding without description, but maybe log it prominently
    }


    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, imageData, detectedObjects }),
    };

  } catch (error: any) {
    console.error("Error calling Gemini API or processing data:", error);
     console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
     let statusCode = 500;
     let message = `Failed to generate design: ${error.message || String(error)}`;

     if (error.message?.includes('503') || error.message?.includes('overloaded')) {
         statusCode = 503;
         message = "503: Service Unavailable - Model is currently overloaded";
     } else if (error.message?.includes('Failed to fetch image')) {
         statusCode = 400; // Bad request if image URL is bad
         message = `400: Bad Request - ${error.message}`;
     } else if (error.message?.includes('Invalid image URL')) {
         statusCode = 400;
         message = `400: Bad Request - ${error.message}`;
     } else if (error.message?.includes('SAFETY')) {
         statusCode = 400;
         message = "Content generation blocked due to safety filters.";
     }


    return {
      statusCode: statusCode,
      body: JSON.stringify({ error: message }),
    };
  }
};

export { handler };
