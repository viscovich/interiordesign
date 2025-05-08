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
 * Uploads an image File object to S3/MinIO storage
 * @param imageFile The File object to upload
 * @param path Path within the bucket (e.g. 'user123/filename.jpg')
 * @returns Public URL of the uploaded image
 */
export async function uploadImage(
  imageFile: File, 
  path: string
): Promise<string> {
  try {
    // Log file size
    const fileSizeKB = imageFile.size / 1024;
    const fileSizeMB = fileSizeKB / 1024;
    console.log(`[Image Upload] Uploading file: ${imageFile.name}, Size: ${fileSizeKB.toFixed(2)} KB (${fileSizeMB.toFixed(2)} MB), Type: ${imageFile.type}`);

    // Upload to S3
    const arrayBuffer = await imageFile.arrayBuffer(); // Convert File to ArrayBuffer
    const uint8Array = new Uint8Array(arrayBuffer); // Convert ArrayBuffer to Uint8Array

    const command = new PutObjectCommand({
      Bucket: import.meta.env.VITE_S3_BUCKET,
      Key: path,
      Body: uint8Array, // Pass Uint8Array
      ContentType: imageFile.type,
      ContentLength: uint8Array.byteLength, // Explicitly set ContentLength
      ACL: 'public-read'
    });

    await s3.send(command);

    // Return public URL
    const publicUrl = `${import.meta.env.VITE_S3_ENDPOINT}/${import.meta.env.VITE_S3_BUCKET}/${path}`;
    console.log(`[Image Upload] Successfully uploaded to: ${publicUrl}`);
    return publicUrl;
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
