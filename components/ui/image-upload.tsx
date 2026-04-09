"use client";

import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

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
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('Common.imageUpload');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(t('fileSizeError', { maxSize: maxSizeMB }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error(t('selectImageFile'));
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      if (path) formData.append('path', path);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('uploadFailed'));
      }

      const { url, path: filePath } = await response.json();
      setPreview(url);
      setUploadedPath(filePath);
      onChange(url);
      toast.success(t('uploadSuccess'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('uploadError'));
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
      if (uploadedPath) {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket, path: uploadedPath }),
        });
      }

      setPreview(null);
      setUploadedPath(null);
      onChange(null);
      toast.success(t('removeSuccess'));
    } catch (_error) {
      toast.error(t('removeError'));
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
        <div
          className="relative inline-block"
          style={aspectRatio === 'square' ? { width: `${maxHeight}px`, height: `${maxHeight}px` } : undefined}
        >
          <div
            className={`relative overflow-hidden rounded-lg border bg-muted ${
              aspectRatio === 'square' ? 'w-full h-full' : 'w-full max-w-md'
            }`}
            style={aspectRatio === 'auto' ? { maxHeight: `${maxHeight}px` } : undefined}
          >
            <Image
              alt="Preview"
              className={aspectRatio === 'square' ? 'object-contain w-full h-full' : 'object-contain'}
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
          role="button"
          tabIndex={0}
          aria-label="Upload image"
          className="flex w-full max-w-xs cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 transition-colors hover:border-muted-foreground/50 hover:bg-muted"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">{t('uploading')}</p>
            </div>
          ) : (
            <>
              <div className="rounded-full bg-primary/10 p-4">
                <ImageIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="mt-4 flex flex-col items-center gap-1">
                <p className="text-sm font-medium">{t('clickToUpload')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('maxSize', { maxSize: maxSizeMB })}
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
