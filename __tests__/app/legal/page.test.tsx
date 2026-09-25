import { render } from '@testing-library/react';

import LegalPage, { generateMetadata, generateStaticParams } from '@/app/legal/[doc]/page';
import { PRIVACY_TEXT, PRIVACY_VERSION, TERMS_TEXT } from '@/lib/legal';

const notFound = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
jest.mock('next/navigation', () => ({ notFound: () => notFound() }));

beforeEach(() => notFound.mockClear());

describe('LegalPage', () => {
  it('prerenders exactly the two known documents', () => {
    expect(generateStaticParams()).toEqual([
      { doc: 'privacidad' },
      { doc: 'terminos' },
    ]);
  });

  it('404s on any other slug instead of rendering an empty document', async () => {
    await expect(
      LegalPage({ params: Promise.resolve({ doc: 'cookies' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('renders the privacy policy with its version', async () => {
    const { container } = render(
      await LegalPage({ params: Promise.resolve({ doc: 'privacidad' }) }),
    );
    expect(container.textContent).toContain('Política de Privacidad');
    expect(container.textContent).toContain(`Versión ${PRIVACY_VERSION}`);
    // Encabezado ("## "), item ("- ") y parrafo, cada uno en su etiqueta.
    expect(container.querySelector('h2')?.textContent).toBe(
      '1. Responsable del tratamiento',
    );
    expect(container.querySelectorAll('li').length).toBeGreaterThan(0);
  });

  // Las dos primeras lineas del texto son "PuntosClub" y el titulo del
  // documento, que ya salen en el <h1>: si no se saltean, salen dos veces.
  it('does not repeat the document title in the body', async () => {
    const { container } = render(
      await LegalPage({ params: Promise.resolve({ doc: 'terminos' }) }),
    );
    const h1 = container.querySelector('h1')?.textContent ?? '';
    expect(h1).toBe('Términos y Condiciones');
    expect(container.querySelectorAll('p')[0]?.textContent).not.toContain(
      'Términos y Condiciones de Uso',
    );
  });

  // Lo que se publica es el documento vigente, no el borrador de trabajo: la
  // cola con los puntos abiertos para el abogado no puede salir a la web.
  it('publishes the privacy policy without its internal review notes', async () => {
    const { container } = render(
      await LegalPage({ params: Promise.resolve({ doc: 'privacidad' }) }),
    );
    expect(container.textContent).not.toContain('Puntos para validación legal');
    expect(container.textContent).not.toContain('Borrador para revisión legal');
    expect(container.textContent).not.toContain('[PENDIENTE]');
  });

  // Data Safety de Google se contrasta contra este texto: si la politica dice
  // que no hay proveedores ni transferencias, la declaracion seria falsa.
  it('declares the real processors and the international transfer', async () => {
    const { container } = render(
      await LegalPage({ params: Promise.resolve({ doc: 'privacidad' }) }),
    );
    const text = container.textContent ?? '';
    expect(text).toContain('Supabase');
    expect(text).toContain('Expo');
    expect(text).toContain('fuera de la República Argentina');
    expect(text).not.toContain('no declaramos transferencias internacionales');
  });

  // La pagina usa el texto de cada linea como key de React. Si alguien mete
  // una linea repetida (o un renglon en blanco) en lib/legal.ts, hay dos keys
  // iguales: que salte aca y no en la consola del navegador.
  it.each([
    ['privacidad', PRIVACY_TEXT],
    ['terminos', TERMS_TEXT],
  ])('has no repeated lines in %s, so the line keys stay unique', (_doc, text) => {
    const lines = text.split('\n').slice(2);
    expect(new Set(lines).size).toBe(lines.length);
  });

  it('builds the metadata title per document', async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ doc: 'privacidad' }) }),
    ).resolves.toMatchObject({ title: 'Política de Privacidad | Puntos Club' });
    await expect(
      generateMetadata({ params: Promise.resolve({ doc: 'nope' }) }),
    ).resolves.toEqual({});
  });
});
