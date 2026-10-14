import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

describe('robots y sitemap', () => {
  it('no bloquea las rutas publicas y apunta al sitemap del dominio real', () => {
    const r = robots();
    expect(r.rules).toEqual(expect.objectContaining({ allow: '/' }));
    expect(JSON.stringify(r.rules)).not.toMatch(/"\/auth|"\/owner/);
    expect(r.sitemap).toBe('https://www.puntosclub.com.ar/sitemap.xml');
  });

  it('lista la home primero', () => {
    expect(sitemap()[0].url).toBe('https://www.puntosclub.com.ar');
  });
});
