jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src, ...props }: { alt: string; src: string }) => (
    <img alt={alt} src={src} {...props} />
  ),
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

import { ImageUpload } from '@/components/ui/image-upload';

const pngFile = (name = 'logo.png', size = 1024) => {
  const file = new File(['x'], name, { type: 'image/png' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const fileInput = () => screen.getAllByLabelText('upload')[0] as HTMLInputElement;

const mockFetch = (impl: jest.Mock) => {
  (global.fetch as jest.Mock).mockImplementation(impl);
};

const okUpload = () =>
  jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ url: 'https://cdn/logo.png', path: 'org/logo.png' }),
  });

describe('ImageUpload', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it('shows the empty dropzone until an image exists', () => {
    render(<ImageUpload bucket="logos" onChange={jest.fn()} />);
    expect(screen.getByText('clickToUpload')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the existing value as a preview', () => {
    render(<ImageUpload bucket="logos" onChange={jest.fn()} value="https://cdn/existing.png" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn/existing.png');
  });

  it('opens the file picker from the dropzone', async () => {
    render(<ImageUpload bucket="logos" onChange={jest.fn()} />);
    const click = jest.spyOn(fileInput(), 'click');

    await userEvent.click(screen.getByText('clickToUpload'));
    expect(click).toHaveBeenCalled();
  });

  it('uploads the selected file and reports the new url', async () => {
    mockFetch(okUpload());
    const onChange = jest.fn();
    render(<ImageUpload bucket="logos" path="org-1" onChange={onChange} />);

    await userEvent.upload(fileInput(), pngFile());

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('https://cdn/logo.png'));
    expect(toast.success).toHaveBeenCalledWith('uploadSuccess');
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn/logo.png');

    const body = (global.fetch as jest.Mock).mock.calls[0][1].body as FormData;
    expect(body.get('bucket')).toBe('logos');
    expect(body.get('path')).toBe('org-1');
  });

  it('omits the path field when no path is given', async () => {
    mockFetch(okUpload());
    render(<ImageUpload bucket="logos" onChange={jest.fn()} />);

    await userEvent.upload(fileInput(), pngFile());

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = (global.fetch as jest.Mock).mock.calls[0][1].body as FormData;
    expect(body.get('path')).toBeNull();
  });

  it('rejects a file over the size limit before hitting the network', async () => {
    const onChange = jest.fn();
    render(<ImageUpload bucket="logos" maxSizeMB={1} onChange={onChange} />);

    await userEvent.upload(fileInput(), pngFile('big.png', 2 * 1024 * 1024));

    expect(toast.error).toHaveBeenCalledWith('fileSizeError');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects a non-image file', async () => {
    render(<ImageUpload accept="*" bucket="logos" onChange={jest.fn()} />);
    const notAnImage = new File(['x'], 'notes.txt', { type: 'text/plain' });

    // userEvent.upload enforces the accept filter, so drive the change event directly
    // the way a browser would for a file the picker let through.
    fireEvent.change(fileInput(), { target: { files: [notAnImage] } });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('selectImageFile'));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('surfaces the server error message when the upload fails', async () => {
    mockFetch(jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Bucket lleno' }) }));
    render(<ImageUpload bucket="logos" onChange={jest.fn()} />);

    await userEvent.upload(fileInput(), pngFile());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Bucket lleno'));
  });

  it('falls back to a generic message when the error body is unreadable', async () => {
    mockFetch(jest.fn().mockResolvedValue({ ok: false, json: async () => { throw new Error('not json'); } }));
    render(<ImageUpload bucket="logos" onChange={jest.fn()} />);

    await userEvent.upload(fileInput(), pngFile());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('uploadFailed'));
  });

  it('falls back to a generic message when the error body has no error field', async () => {
    mockFetch(jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    render(<ImageUpload bucket="logos" onChange={jest.fn()} />);

    await userEvent.upload(fileInput(), pngFile());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('uploadFailed'));
  });

  it.each([
    ['an empty selection', [] as File[]],
    ['a null file list', null],
  ])('ignores a change event carrying %s', async (_label, files) => {
    render(<ImageUpload bucket="logos" onChange={jest.fn()} />);

    fireEvent.change(fileInput(), { target: { files } });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('deletes the uploaded object when the preview is removed', async () => {
    mockFetch(okUpload());
    const onChange = jest.fn();
    render(<ImageUpload bucket="logos" onChange={onChange} />);

    await userEvent.upload(fileInput(), pngFile());
    await screen.findByRole('img');

    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    await userEvent.click(screen.getByRole('button', { name: 'remove' }));

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(null));
    const deleteCall = (global.fetch as jest.Mock).mock.calls.at(-1);
    expect(deleteCall[1]).toMatchObject({ method: 'DELETE' });
    expect(JSON.parse(deleteCall[1].body)).toEqual({ bucket: 'logos', path: 'org/logo.png' });
    expect(toast.success).toHaveBeenCalledWith('removeSuccess');
  });

  it('clears a pre-existing value without calling DELETE, since nothing was uploaded here', async () => {
    const onChange = jest.fn();
    render(<ImageUpload bucket="logos" onChange={onChange} value="https://cdn/existing.png" />);

    await userEvent.click(screen.getByRole('button', { name: 'remove' }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(null));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('reports a failed delete', async () => {
    mockFetch(okUpload());
    render(<ImageUpload bucket="logos" onChange={jest.fn()} />);
    await userEvent.upload(fileInput(), pngFile());
    await screen.findByRole('img');

    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));
    await userEvent.click(screen.getByRole('button', { name: 'remove' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('removeError'));
  });

  it('constrains the preview to a square when asked', () => {
    const { rerender, container } = render(
      <ImageUpload aspectRatio="square" bucket="logos" maxHeight={120} onChange={jest.fn()} value="https://cdn/a.png" />,
    );
    expect(container.querySelector('.relative.inline-block')).toHaveStyle({ width: '120px', height: '120px' });

    rerender(
      <ImageUpload aspectRatio="auto" bucket="logos" maxHeight={120} onChange={jest.fn()} value="https://cdn/a.png" />,
    );
    expect(container.querySelector('.relative.inline-block')).not.toHaveStyle({ height: '120px' });
  });

  it('disables both controls while disabled', () => {
    render(<ImageUpload bucket="logos" disabled onChange={jest.fn()} value="https://cdn/a.png" />);
    expect(fileInput()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'remove' })).toBeDisabled();
  });
});
