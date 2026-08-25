jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => (
    <img alt={alt} src={src} />
  ),
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import ProductImageUpload from '@/components/dashboard/product/product-image-upload';
import { createClient } from '@/lib/supabase/client';

const upload = jest.fn();
const getPublicUrl = jest.fn();
const remove = jest.fn();

const imageFile = (name = 'a.png', type = 'image/png', size = 1024) => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const selectFiles = (files: File[]) => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files } });
};

const renderUpload = (initialImages?: string[]) => {
  const onImagesChange = jest.fn();
  render(<ProductImageUpload initialImages={initialImages} onImagesChange={onImagesChange} />);
  return { onImagesChange };
};

describe('ProductImageUpload', () => {
  beforeEach(() => {
    upload.mockResolvedValue({ error: null });
    getPublicUrl.mockImplementation((path: string) => ({ data: { publicUrl: `https://cdn/${path}` } }));
    remove.mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockReturnValue({
      storage: { from: jest.fn(() => ({ upload, getPublicUrl, remove })) },
    });
  });

  it('invites an upload while there are no images', () => {
    renderUpload();
    expect(screen.getByText('noImages')).toBeInTheDocument();
    expect(screen.getByText('uploadButton')).toBeInTheDocument();
    expect(screen.queryByText('imageCount')).not.toBeInTheDocument();
  });

  it('renders the initial images with a remove button each', () => {
    renderUpload(['https://cdn/a.png', 'https://cdn/b.png']);

    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.getByText('imageCount')).toBeInTheDocument();
    expect(screen.queryByText('noImages')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar imagen 1' })).toBeInTheDocument();
  });

  it('disables the dropzone once three images are present', () => {
    renderUpload(['https://cdn/a.png', 'https://cdn/b.png', 'https://cdn/c.png']);
    expect(document.querySelector('input[type="file"]')).toBeDisabled();
    expect(screen.queryByText('addImage')).not.toBeInTheDocument();
  });

  it('marks the first image as the main one and pads the rest with empty slots', () => {
    renderUpload(['https://cdn/a.png']);
    expect(screen.getByText('mainImage')).toBeInTheDocument();
    expect(screen.getAllByText('addImage')).toHaveLength(2);
  });

  it('uploads the selected files and reports the new list', async () => {
    const { onImagesChange } = renderUpload();

    selectFiles([imageFile('a.png'), imageFile('b.png')]);

    await waitFor(() => expect(onImagesChange).toHaveBeenCalled());
    expect(upload).toHaveBeenCalledTimes(2);
    expect(onImagesChange.mock.calls[0][0]).toHaveLength(2);
    expect(toast.success).toHaveBeenCalledWith('uploadSuccess');
  });

  it('appends to the images already present', async () => {
    const { onImagesChange } = renderUpload(['https://cdn/existing.png']);

    selectFiles([imageFile('a.png')]);

    await waitFor(() => expect(onImagesChange).toHaveBeenCalled());
    expect(onImagesChange.mock.calls[0][0][0]).toBe('https://cdn/existing.png');
    expect(onImagesChange.mock.calls[0][0]).toHaveLength(2);
  });

  it('refuses a batch that would exceed the three image limit', async () => {
    const { onImagesChange } = renderUpload(['https://cdn/a.png', 'https://cdn/b.png']);

    selectFiles([imageFile('c.png'), imageFile('d.png')]);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('uploadLimitError'));
    expect(upload).not.toHaveBeenCalled();
    expect(onImagesChange).not.toHaveBeenCalled();
  });

  it('rejects an unsupported format before uploading anything', async () => {
    renderUpload();

    selectFiles([imageFile('notes.pdf', 'application/pdf')]);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('formatError'));
    expect(upload).not.toHaveBeenCalled();
  });

  it('rejects a file over 5MB before uploading anything', async () => {
    renderUpload();

    selectFiles([imageFile('big.png', 'image/png', 6 * 1024 * 1024)]);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('sizeError'));
    expect(upload).not.toHaveBeenCalled();
  });

  it('rolls back the images that did upload when one of the batch fails', async () => {
    upload.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: new Error('boom') });
    const { onImagesChange } = renderUpload();

    selectFiles([imageFile('a.png'), imageFile('b.png')]);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('uploadError'));
    expect(remove).toHaveBeenCalledTimes(1);
    expect(onImagesChange).not.toHaveBeenCalled();
  });

  it('reports a wholly failed batch without trying to clean up', async () => {
    upload.mockResolvedValue({ error: new Error('boom') });
    renderUpload();

    selectFiles([imageFile('a.png')]);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('uploadError'));
    expect(remove).not.toHaveBeenCalled();
  });

  it('ignores a change event with no files', () => {
    renderUpload();

    selectFiles([]);

    expect(upload).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('removes an image from storage and from the list', async () => {
    const { onImagesChange } = renderUpload(['https://cdn/a.png', 'https://cdn/b.png']);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar imagen 1' }));

    await waitFor(() => expect(onImagesChange).toHaveBeenCalledWith(['https://cdn/b.png']));
    expect(remove).toHaveBeenCalledWith(['a.png']);
    expect(toast.success).toHaveBeenCalledWith('removeSuccess');
  });

  it('reports a failed removal', async () => {
    remove.mockRejectedValue(new Error('network down'));
    const { onImagesChange } = renderUpload(['https://cdn/a.png']);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar imagen 1' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('removeError'));
    expect(onImagesChange).not.toHaveBeenCalled();
  });

  it('shows the uploading state while the batch is in flight', async () => {
    let finishUpload: (result: { error: null }) => void = () => {};
    upload.mockReturnValue(new Promise((resolve) => { finishUpload = resolve; }));
    renderUpload();

    selectFiles([imageFile('a.png')]);

    expect(await screen.findByText('uploading')).toBeInTheDocument();
    finishUpload({ error: null });
    await waitFor(() => expect(screen.queryByText('uploading')).not.toBeInTheDocument());
  });
});
