import { POST, DELETE } from '@/app/api/upload/route';

const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();
const mockRemove = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      })),
    },
  })),
}));

function createMockFile(name: string, type: string, size: number) {
  return {
    name,
    type,
    size,
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(size)),
  };
}

describe('Upload API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpload.mockResolvedValue({ data: { path: 'logos/test-file.png' }, error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://storage.example.com/logos/test-file.png' } });
    mockRemove.mockResolvedValue({ error: null });
  });

  it('exports POST handler', () => { expect(typeof POST).toBe('function'); });
  it('exports DELETE handler', () => { expect(typeof DELETE).toBe('function'); });

  describe('POST', () => {
    it('returns 400 when no file provided', async () => {
      const formData = new FormData();
      formData.append('bucket', 'logos');
      const request = { formData: () => Promise.resolve(formData) } as any;

      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe('No file provided');
    });

    it('returns 400 when no bucket specified', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['data'], { type: 'image/png' }) as any, 'test.png');
      const request = { formData: () => Promise.resolve(formData) } as any;

      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe('No bucket specified');
    });

    it('returns 403 for non-public bucket', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['data'], { type: 'image/png' }) as any, 'test.png');
      formData.append('bucket', 'private-bucket');
      const request = { formData: () => Promise.resolve(formData) } as any;

      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(403);
      expect(data.error).toBe('Bucket not allowed for public uploads');
    });

    it('returns 400 for disallowed mime type', async () => {
      const mockFile = createMockFile('test.pdf', 'application/pdf', 1024);
      const formData = {
        get: (key: string) => {
          if (key === 'file') return mockFile;
          if (key === 'bucket') return 'logos';
          if (key === 'path') return null;
          return null;
        },
      };
      const request = { formData: () => Promise.resolve(formData) } as any;

      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toContain('File type not allowed');
    });

    it('returns 400 for file exceeding size limit', async () => {
      const mockFile = createMockFile('big.png', 'image/png', 11 * 1024 * 1024);
      const formData = {
        get: (key: string) => {
          if (key === 'file') return mockFile;
          if (key === 'bucket') return 'logos';
          if (key === 'path') return null;
          return null;
        },
      };
      const request = { formData: () => Promise.resolve(formData) } as any;

      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toContain('File size exceeds');
    });

    it('uploads successfully and returns url', async () => {
      const mockFile = createMockFile('test.png', 'image/png', 1024);
      const formData = {
        get: (key: string) => {
          if (key === 'file') return mockFile;
          if (key === 'bucket') return 'logos';
          if (key === 'path') return 'org-1';
          return null;
        },
      };
      const request = { formData: () => Promise.resolve(formData) } as any;

      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.url).toBe('https://storage.example.com/logos/test-file.png');
      expect(data.path).toBe('logos/test-file.png');
    });

    it('returns 500 when upload fails', async () => {
      mockUpload.mockResolvedValueOnce({ data: null, error: { message: 'Storage error' } });

      const mockFile = createMockFile('test.png', 'image/png', 1024);
      const formData = {
        get: (key: string) => {
          if (key === 'file') return mockFile;
          if (key === 'bucket') return 'logos';
          if (key === 'path') return null;
          return null;
        },
      };
      const request = { formData: () => Promise.resolve(formData) } as any;

      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error).toBe('Storage error');
    });

    it('returns 500 on unexpected error (catch block)', async () => {
      const request = {
        formData: () => Promise.reject(new Error('FormData parse error')),
      } as any;

      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('DELETE', () => {
    it('returns 400 when bucket or path is missing', async () => {
      const request = {
        json: () => Promise.resolve({ bucket: 'logos' }),
      } as any;
      const response = await DELETE(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe('Bucket and path are required');
    });

    it('returns 403 for non-public bucket', async () => {
      const request = {
        json: () => Promise.resolve({ bucket: 'private', path: 'some/file.png' }),
      } as any;
      const response = await DELETE(request);
      await response.json();
      expect(response.status).toBe(403);
    });

    it('deletes file successfully', async () => {
      const request = {
        json: () => Promise.resolve({ bucket: 'logos', path: 'org-1/file.png' }),
      } as any;
      const response = await DELETE(request);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('returns 500 when delete fails', async () => {
      mockRemove.mockResolvedValueOnce({ error: { message: 'Delete failed' } });

      const request = {
        json: () => Promise.resolve({ bucket: 'logos', path: 'org-1/file.png' }),
      } as any;
      const response = await DELETE(request);
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error).toBe('Delete failed');
    });

    it('returns 500 on unexpected error (catch block)', async () => {
      const request = {
        json: () => Promise.reject(new Error('JSON parse error')),
      } as any;
      const response = await DELETE(request);
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
