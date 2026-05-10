import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Upload an image buffer to Cloudinary.
 * Auto-optimizes: WebP format, quality auto, responsive sizing.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'nexus-nft',
        public_id: `nft-${Date.now()}-${filename.replace(/\.[^.]+$/, '')}`,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
          { width: 1200, crop: 'limit' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'));
          return;
        }
        resolve(result as CloudinaryUploadResult);
      }
    );
    stream.end(buffer);
  });
}

/**
 * Get an optimized Cloudinary URL for an image.
 * Applies responsive sizing and auto format.
 */
export function getOptimizedUrl(publicId: string, width?: number): string {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    width: width || 800,
    crop: 'limit',
    secure: true,
  });
}

export { cloudinary };
