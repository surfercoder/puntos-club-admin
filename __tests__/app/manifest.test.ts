import manifest from '@/app/manifest';

describe('manifest', () => {
  it('trae los iconos que Chrome pide para ofrecer la instalacion', () => {
    const m = manifest();
    expect(m.display).toBe('standalone');
    expect(m.start_url).toBe('/dashboard');
    expect(m.icons?.map((i) => `${i.sizes} ${i.purpose}`)).toEqual([
      '192x192 any',
      '512x512 any',
      '192x192 maskable',
      '512x512 maskable',
    ]);
  });
});
