import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateInteriorDesign(
  imageUrl: string,
  style: string,
  roomType: string
): Promise<{ description: string; imageData: string }> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp-image-generation",
    generationConfig: {
      responseModalities: ["Text", "Image"], // ✅ CamelCase corretto
    },
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

  const contents = [
    {
      parts: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageBlob.type,
          },
        },
        {
          text: `If you were to furnish this room with a ${style} style for a ${roomType}, what would you include?
Describe it in detail using markdown format with headings, bullet points, and well-formatted paragraphs.
Then generate an image that represents your idea. Try to respect the walls and windows of the attached room.`,
        },
      ],
    },
  ];

  try {
    const response = await model.generateContent({ contents });

    const parts = response.response.candidates[0].content.parts;

    let description = '';
    let imageData = '';

    for (const part of parts) {
      if (part.text) {
        description += part.text;
      } else if (part.inlineData) {
        imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    if (!description || !imageData) {
      throw new Error("Incomplete response");
    }

    return { description, imageData };
  } catch (error) {
    console.error("Errore nella generazione:", error);
    throw new Error("Failed to generate content");
  }
}
