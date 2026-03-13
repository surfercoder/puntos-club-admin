"use client";

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const EMPTY_IMAGES: string[] = [];

interface ProductImageUploadProps {
  productId?: string;
  initialImages?: string[];
  onImagesChange: (imageUrls: string[]) => void;
}

export default function ProductImageUpload({
  productId: _productId,
  initialImages = EMPTY_IMAGES,
  onImagesChange,
}: ProductImageUploadProps) {
  const t = useTranslations('Dashboard.product.imageUpload');
  const initialRef = useRef(initialImages);
  const [images, setImages] = useState<string[]>(initialRef.current);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const uploadImages = async (files: FileList) => {
    const filesArray = Array.from(files);
    const availableSlots = 3 - images.length;
    
    if (filesArray.length > availableSlots) {
      toast.error(t('uploadLimitError', { count: availableSlots }));
      return;
    }

    // Validate all files first
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    for (const file of filesArray) {
      if (!supportedTypes.includes(file.type)) {
        toast.error(t('formatError', { name: file.name }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('sizeError', { name: file.name }));
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
      toast.success(t('uploadSuccess', { count: uploadedUrls.length }));
    } catch (_error) {
      toast.error(t('uploadError'));

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
      toast.success(t('removeSuccess'));
    } catch (_error) {
      toast.error(t('removeError'));
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
          <div key={imageUrl} className="relative aspect-square rounded-lg border overflow-hidden group">
            <Image
              src={imageUrl}
              alt={`Product image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 200px"
            />
            <button
              type="button"
              onClick={() => removeImage(imageUrl, index)}
              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {images.length < 3 && (
          <label className="relative aspect-square rounded-lg border-2 border-dashed border-border hover:border-muted-foreground cursor-pointer flex flex-col items-center justify-center transition-colors">
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
                <span className="text-sm text-muted-foreground">{t('uploading')}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('uploadButton')}</span>
                <span className="text-xs text-muted-foreground/70">{t('formats')}</span>
                <span className="text-xs text-muted-foreground/70">{t('maxSize')}</span>
              </div>
            )}
          </label>
        )}
      </div>

      {images.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="w-4 h-4" />
          <span>{t('noImages')}</span>
        </div>
      )}

      {images.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {t('imageCount', { count: images.length })}
        </p>
      )}
    </div>
  );
}
