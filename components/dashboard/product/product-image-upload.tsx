"use client";

import { useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ProductImageUploadProps {
  productId?: string;
  initialImages?: string[];
  onImagesChange: (imageUrls: string[]) => void;
}

export default function ProductImageUpload({
  productId: _productId,
  initialImages = [],
  onImagesChange,
}: ProductImageUploadProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const uploadImages = async (files: FileList) => {
    const filesArray = Array.from(files);
    const availableSlots = 3 - images.length;
    
    if (filesArray.length > availableSlots) {
      toast.error(`You can only upload ${availableSlots} more image${availableSlots !== 1 ? 's' : ''}`);
      return;
    }

    // Validate all files first
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    for (const file of filesArray) {
      if (!supportedTypes.includes(file.type)) {
        toast.error(`${file.name} format not supported. Please use JPEG, PNG, WebP, or GIF`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return;
      }
    }

    setUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const file of filesArray) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      const newImages = [...images, ...uploadedUrls];
      setImages(newImages);
      onImagesChange(newImages);
      toast.success(`${uploadedUrls.length} image${uploadedUrls.length !== 1 ? 's' : ''} uploaded successfully`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
      
      // Clean up any successfully uploaded images on error
      for (const url of uploadedUrls) {
        const fileName = url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('product-images').remove([fileName]);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (imageUrl: string, index: number) => {
    try {
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('product-images')
          .remove([fileName]);
      }

      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      onImagesChange(newImages);
      toast.success('Image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadImages(files);
    }
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {images.map((imageUrl, index) => (
          <div key={index} className="relative aspect-square rounded-lg border overflow-hidden group">
            <img
              src={imageUrl}
              alt={`Product image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(imageUrl, index)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {images.length < 3 && (
          <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer flex flex-col items-center justify-center transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                <span className="text-sm text-gray-500">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-500">Upload Images</span>
                <span className="text-xs text-gray-400">JPEG, PNG, WebP, GIF</span>
                <span className="text-xs text-gray-400">Max 5MB each</span>
              </div>
            )}
          </label>
        )}
      </div>

      {images.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ImageIcon className="w-4 h-4" />
          <span>No images uploaded yet. You can add up to 3 images.</span>
        </div>
      )}

      {images.length > 0 && (
        <p className="text-sm text-gray-500">
          {images.length} of 3 images uploaded
        </p>
      )}
    </div>
  );
}
