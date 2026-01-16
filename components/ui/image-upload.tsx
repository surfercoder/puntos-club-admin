"use client";

import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  bucket: string;
  path?: string;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  aspectRatio?: 'square' | 'auto';
  maxHeight?: number;
}

export function ImageUpload({
  value,
  onChange,
  bucket,
  path = '',
  accept = 'image/*',
  maxSizeMB = 5,
  disabled = false,
  aspectRatio = 'auto',
  maxHeight = 200,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uploadData.path);

      const publicUrl = urlData.publicUrl;
      setPreview(publicUrl);
      onChange(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!preview) return;

    try {
      if (preview.includes(bucket)) {
        const urlParts = preview.split(`${bucket}/`);
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from(bucket).remove([filePath]);
        }
      }

      setPreview(null);
      onChange(null);
      toast.success('Image removed');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        accept={accept}
        className="hidden"
        disabled={disabled || uploading}
        type="file"
        onChange={handleFileSelect}
      />

      {preview ? (
        <div className="relative w-full max-w-md">
          <div 
            className={`relative w-full overflow-hidden rounded-lg border bg-muted ${
              aspectRatio === 'square' ? 'aspect-square' : ''
            }`}
            style={aspectRatio === 'auto' ? { maxHeight: `${maxHeight}px` } : undefined}
          >
            <Image
              alt="Preview"
              className={aspectRatio === 'square' ? 'object-cover' : 'object-contain'}
              height={maxHeight}
              src={preview}
              style={aspectRatio === 'auto' ? { width: '100%', height: 'auto', maxHeight: `${maxHeight}px` } : undefined}
              width={aspectRatio === 'square' ? maxHeight : 800}
            />
          </div>
          <Button
            className="absolute -right-2 -top-2"
            disabled={disabled || uploading}
            size="icon"
            type="button"
            variant="destructive"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="flex w-full max-w-xs cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 transition-colors hover:border-muted-foreground/50 hover:bg-muted"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <>
              <div className="rounded-full bg-primary/10 p-4">
                <ImageIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="mt-4 flex flex-col items-center gap-1">
                <p className="text-sm font-medium">Click to upload image</p>
                <p className="text-xs text-muted-foreground">
                  Max size: {maxSizeMB}MB
                </p>
              </div>
              <Upload className="mt-2 h-4 w-4 text-muted-foreground" />
            </>
          )}
        </div>
      )}
    </div>
  );
}
