// netlify/functions/gemini-describe-object.ts
import { GoogleGenerativeAI, InlineDataPart, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

// Helper function (copied again for self-containment, could be shared)
async function urlToInlineDataPart(url: string): Promise<InlineDataPart> {
  if (!url || !url.startsWith('http')) {
    console.error(`Invalid URL provided: ${url}`);
    throw new Error(`Invalid image URL provided.`);
  }
  console.log(`Fetching image from URL: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    const errorBody = await response.text();
    console.error(`Error body: ${errorBody}`);
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const blob = await response.blob();
   if (!blob || blob.size === 0) {
      throw new Error(`Fetched empty or invalid image data from ${url}`);
  }
  console.log(`Fetched blob type: ${blob.type}, size: ${blob.size}`);
  const buffer = await blob.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  );
  return {
    inlineData: {
      data: base64,
      mimeType: blob.type || 'image/jpeg',
    },
  };
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
  } catch (error) {
    console.error("Failed to parse request body:", error);
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const { imageUrl } = body;

  if (!imageUrl) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required field: imageUrl." }) };
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    // Using gemini-1.5-flash as per the original client-side function
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        safetySettings: [ // Add safety settings
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
    });

    const prompt = "Describe the main object in this image concisely in a few words, focusing on its type, color, and key visual features. Example: 'black leather sofa with chrome legs'.";

    console.log(`Preparing image part for description: ${imageUrl}`);
    const imagePart = await urlToInlineDataPart(imageUrl);
    console.log(`Image part prepared.`);

    console.log(`Calling Gemini API for description...`);
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    console.log(`Received response from Gemini API.`);

    // Check for safety blocks or other issues
    const finishReason = response?.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        console.error(`Gemini generation finished unexpectedly: ${finishReason}`);
        const safetyRatings = response?.candidates?.[0]?.safetyRatings;
        console.error(`Safety Ratings: ${JSON.stringify(safetyRatings)}`);
         if (finishReason === 'SAFETY') {
             return { statusCode: 400, body: JSON.stringify({ error: "Content blocked due to safety filters.", details: safetyRatings }) };
        }
        return { statusCode: 500, body: JSON.stringify({ error: `Gemini generation failed: ${finishReason}` }) };
    }


    const description = response?.text()?.trim();

    if (!description) {
      console.warn('[gemini-describe-object] Gemini did not return a description.');
      // Decide if this is an error or just an empty result
      return {
        statusCode: 200, // Still a successful API call, just no description found
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: 'Object description unavailable' }), // Return default
      };
    }

    console.log(`[gemini-describe-object] Generated description: "${description}"`);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    };

  } catch (error: any) {
    console.error("Error generating object description:", error);
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    let statusCode = 500;
    let message = `Failed to generate object description: ${error.message || String(error)}`;

     if (error.message?.includes('503') || error.message?.includes('overloaded')) {
         statusCode = 503;
         message = "503: Service Unavailable - Model is currently overloaded";
     } else if (error.message?.includes('Failed to fetch image')) {
         statusCode = 400;
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
