/**
 * Cloudinary configuration and utilities
 * 
 * To use Cloudinary, you need to:
 * 1. Create a Cloudinary account at https://cloudinary.com
 * 2. Get your Cloud Name, API Key, and API Secret from the dashboard
 * 3. Set environment variables or update the config below
 */

// Cloudinary configuration
// Values are read from Vite environment variables so no secrets are committed.
// Define these in your `.env.local` file:
// VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_API_KEY, VITE_CLOUDINARY_UPLOAD_PRESET
export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || "",
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "",
};

/**
 * Get Cloudinary upload URL
 */
export function getCloudinaryUploadUrl(): string {
  return `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
}

/**
 * Upload image to Cloudinary
 */
export async function uploadImageToCloudinary(
  file: File,
  folder?: string
): Promise<{ secure_url: string; public_id: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", cloudinaryConfig.uploadPreset);
  
  if (folder) {
    formData.append("folder", folder);
  }

  try {
    const response = await fetch(getCloudinaryUploadUrl(), {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to upload image");
    }

    const data = await response.json();
    return {
      secure_url: data.secure_url,
      public_id: data.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}

/**
 * Upload PDF (auto resource type) to Cloudinary
 * - resource_type "auto" lets Cloudinary detect PDF correctly
 * - /image/upload endpoint with fl_attachment=false delivers inline for viewing
 */
export async function uploadPdfToCloudinary(
  file: File,
  folder?: string
): Promise<{ secure_url: string; public_id: string; original_filename: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", cloudinaryConfig.uploadPreset);
  // Use image endpoint — Cloudinary handles PDFs as image resource type for unsigned presets
  // This allows fl_inline / Google Viewer fallback for browser viewing
  if (folder) formData.append("folder", folder);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;

  try {
    const response = await fetch(uploadUrl, { method: "POST", body: formData });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "PDF 업로드 실패");
    }
    const data = await response.json();
    return {
      secure_url: data.secure_url,
      public_id: data.public_id,
      original_filename: data.original_filename || file.name,
    };
  } catch (error) {
    console.error("Cloudinary PDF upload error:", error);
    throw error;
  }
}

/**
 * Delete image from Cloudinary
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = await generateSignature(publicId, timestamp);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/destroy`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_id: publicId,
          signature,
          timestamp,
          api_key: cloudinaryConfig.apiKey,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete image");
    }

    return true;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
}

/**
 * Generate signature for Cloudinary API calls
 * Note: In production, this should be done server-side for security
 */
async function generateSignature(publicId: string, timestamp: number): Promise<string> {
  // For client-side, we'll use a simple approach
  // In production, this should be done on the backend
  const message = `public_id=${publicId}&timestamp=${timestamp}${cloudinaryConfig.apiKey}`;
  
  // Using Web Crypto API for hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex;
}

