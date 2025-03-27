import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client with MinIO configuration
const s3 = new S3Client({
  endpoint: import.meta.env.VITE_S3_ENDPOINT,
  region: import.meta.env.VITE_S3_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_S3_ACCESS_KEY,
    secretAccessKey: import.meta.env.VITE_S3_SECRET_KEY
  },
  forcePathStyle: true, // Required for MinIO
});

/**
 * Uploads an image to S3/MinIO storage
 * @param imageData Base64 image data or data URL
 * @param path Path within the bucket (e.g. 'user123/filename.jpg')
 * @returns Public URL of the uploaded image
 */
export async function uploadImage(
  imageData: string, 
  path: string
): Promise<string> {
  try {
    // Extract base64 data if it's a data URL
    let base64Data = imageData;
    if (imageData.startsWith('data:')) {
      base64Data = imageData.split(',')[1];
    }

    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Determine content type
    const contentType = imageData.startsWith('data:image/png') ? 'image/png' : 
                       imageData.startsWith('data:image/jpeg') ? 'image/jpeg' : 
                       'image/jpeg';

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: import.meta.env.VITE_S3_BUCKET,
      Key: path,
      Body: bytes,
      ContentType: contentType,
      ACL: 'public-read' // Make uploaded files publicly accessible
    });

    await s3.send(command);

    // Return public URL
    return `${import.meta.env.VITE_S3_ENDPOINT}/${import.meta.env.VITE_S3_BUCKET}/${path}`;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Gets a public URL for an image in S3/MinIO
 * @param path Path within the bucket
 * @returns Public URL
 */
export function getImageUrl(path: string): string {
  return `${import.meta.env.VITE_S3_ENDPOINT}/${import.meta.env.VITE_S3_BUCKET}/${path}`;
}
