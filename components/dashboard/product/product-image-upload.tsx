"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Image as ImageIcon, Plus, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { normalizeProductImage } from '@/lib/utils/normalize-product-image';
import { toast } from 'sonner';

const EMPTY_IMAGES: string[] = [];

// Sin GIF: la normalizacion a WebP se queda con el primer frame, asi que
// aceptarlo seria prometer una animacion que la app nunca va a mostrar.
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

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
  const [images, setImages] = useState<string[]>(initialImages);
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
    for (const file of filesArray) {
      if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
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
      const results = await Promise.all(filesArray.map(async (original) => {
        const file = await normalizeProductImage(original);
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
          return null;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        return publicUrl;
      }));

      const failed = results.some((r) => r === null);
      for (const r of results) {
        if (r) uploadedUrls.push(r);
      }

      if (failed) {
        toast.error(t('uploadError'));
        // Clean up any successfully uploaded images on error
        await Promise.all(uploadedUrls.map(async (url) => {
          const fileName = url.split('/').pop();
          if (fileName) {
            await supabase.storage.from('product-images').remove([fileName]);
          }
        }));
      } else {
        const newImages = [...images, ...uploadedUrls];
        setImages(newImages);
        onImagesChange(newImages);
        toast.success(t('uploadSuccess', { count: uploadedUrls.length }));
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

  const emptySlots = Math.max(0, 3 - images.length);

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative flex aspect-video cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-3 text-center transition-colors hover:border-muted-foreground">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            disabled={uploading || images.length >= 3}
            className="hidden"
          />
          {uploading ? (
            <>
              <div className="size-7 animate-spin rounded-full border-b-2 border-foreground" />
              <span className="text-sm text-muted-foreground">{t('uploading')}</span>
            </>
          ) : (
            <>
              <Upload className="size-7 text-muted-foreground" />
              <span className="text-sm font-medium">{t('uploadButton')}</span>
              <span className="text-[11px] text-muted-foreground">{t('formats')}</span>
              <span className="text-[11px] text-muted-foreground">{t('autoResize')}</span>
            </>
          )}
        </label>

        {images.map((imageUrl, index) => (
          <div
            key={imageUrl}
            className="relative aspect-video overflow-hidden rounded-xl border bg-muted"
          >
            <Image
              src={imageUrl}
              alt={`Product image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 200px"
            />
            {index === 0 && (
              <span className="absolute left-2 top-2 rounded-md bg-brand-violet/90 px-2 py-0.5 text-[11px] font-medium text-white">
                {t('mainImage')}
              </span>
            )}
            <button
              type="button"
              aria-label={`Eliminar imagen ${index + 1}`}
              onClick={() => removeImage(imageUrl, index)}
              className="absolute right-2 top-2 cursor-pointer rounded-full bg-destructive p-1 text-destructive-foreground transition-opacity hover:opacity-90"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        {Array.from({ length: emptySlots }, (_, index) => (
          <span
            key={`slot-${index}`}
            className="flex aspect-video flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-muted-foreground"
          >
            <Plus className="size-6" />
            <span className="text-sm">{t('addImage')}</span>
          </span>
        ))}
      </div>

      {images.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="size-4" />
          {t('noImages')}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t('imageCount', { count: images.length })}
        </p>
      )}
    </div>
  );
}
