import { POST } from '@/app/api/active-org/route';

describe('Active Org API Route', () => {
  it('exports a POST handler function', () => {
    expect(typeof POST).toBe('function');
  });

  it('returns 400 when orgId is missing', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Request;

    const response = await POST(mockReq);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing orgId');
  });

  it('returns 400 when body has empty orgId', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({ orgId: '' }),
    } as unknown as Request;

    const response = await POST(mockReq);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing orgId');
  });

  it('sets cookie and returns success when orgId is provided', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({ orgId: 'org-123' }),
    } as unknown as Request;

    const response = await POST(mockReq);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Verify cookie was set
    const cookie = response.cookies.get('active_org_id');
    expect(cookie).toBeDefined();
    expect(cookie.value).toBe('org-123');
  });

  it('returns 500 when req.json() throws', async () => {
    const mockReq = {
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
    } as unknown as Request;

    const response = await POST(mockReq);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('Invalid JSON');
  });

  it('returns "Unknown error" for non-Error throws', async () => {
    const mockReq = {
      json: jest.fn().mockRejectedValue('string error'),
    } as unknown as Request;

    const response = await POST(mockReq);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('Unknown error');
  });
});
