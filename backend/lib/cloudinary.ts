import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export default cloudinary;

// ─── Upload a single image buffer / base64 string ─────────────────────────
export async function uploadImage(
  file: string,           // base64 data URI or file path
  folder = 'f1store/products'
): Promise<{ url: string; public_id: string }> {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });
  return { url: result.secure_url, public_id: result.public_id };
}

// ─── Delete an image by its public_id ─────────────────────────────────────
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

// ─── Generate a signed upload URL for direct browser → Cloudinary uploads ─
export function generateUploadSignature(folder = 'f1store/products'): {
  timestamp: number;
  signature: string;
  api_key: string;
  cloud_name: string;
  folder: string;
} {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );
  return {
    timestamp,
    signature,
    api_key: process.env.CLOUDINARY_API_KEY!,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    folder,
  };
}
