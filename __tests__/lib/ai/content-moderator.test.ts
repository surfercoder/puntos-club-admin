// The Anthropic constructor is called at module scope, so we need to use a
// stable reference that exists before the module loads.
const mockCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => {
  // Return a class-like constructor
  const MockAnthropic = function () {
    return { messages: { create: mockCreate } };
  };
  MockAnthropic.prototype = {};
  return { __esModule: true, default: MockAnthropic };
});

// Force fresh import so the mock is used
let moderateNotificationContent: (title: string, body: string) => Promise<{ isApproved: boolean; reasons?: string[]; severity?: 'low' | 'medium' | 'high' }>;

beforeAll(async () => {
  const mod = await import('@/lib/ai/content-moderator');
  moderateNotificationContent = mod.moderateNotificationContent;
});

describe('moderateNotificationContent', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns approved result when AI approves the content', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: '{"isApproved": true, "reasons": [], "severity": "low"}',
        },
      ],
    });

    const result = await moderateNotificationContent('Promo', 'Descuento del 20%');

    expect(result).toEqual({
      isApproved: true,
      reasons: [],
      severity: 'low',
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
      })
    );
  });

  it('returns rejected result when AI rejects the content', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: '{"isApproved": false, "reasons": ["Contenido ofensivo"], "severity": "high"}',
        },
      ],
    });

    const result = await moderateNotificationContent('Malo', 'Texto malo');

    expect(result).toEqual({
      isApproved: false,
      reasons: ['Contenido ofensivo'],
      severity: 'high',
    });
  });

  it('handles non-text content type gracefully', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'image', source: {} }],
    });

    await expect(moderateNotificationContent('T', 'B')).rejects.toThrow(
      'Error al moderar el contenido. Por favor intenta de nuevo.'
    );
  });

  it('throws when response has no JSON', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'No JSON here' }],
    });

    await expect(moderateNotificationContent('T', 'B')).rejects.toThrow(
      'Error al moderar el contenido. Por favor intenta de nuevo.'
    );
  });

  it('throws when API call fails', async () => {
    mockCreate.mockRejectedValue(new Error('API error'));

    await expect(moderateNotificationContent('T', 'B')).rejects.toThrow(
      'Error al moderar el contenido. Por favor intenta de nuevo.'
    );
  });

  it('parses JSON embedded in surrounding text', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'Here is the result: {"isApproved": true, "reasons": [], "severity": "low"} end',
        },
      ],
    });

    const result = await moderateNotificationContent('OK', 'Good content');
    expect(result.isApproved).toBe(true);
  });
});
