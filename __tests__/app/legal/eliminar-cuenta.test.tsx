import { render } from '@testing-library/react';

import EliminarCuentaPage, { metadata } from '@/app/legal/eliminar-cuenta/page';

describe('EliminarCuentaPage', () => {
  // Google Play pide que esta URL se pueda abrir SIN la app y que diga que se
  // borra. Si deja de decirlo, la ficha queda incumpliendo la politica.
  it('lists what gets deleted, including the points', () => {
    const { container } = render(<EliminarCuentaPage />);
    const text = container.textContent ?? '';
    expect(text).toContain('Qué se elimina');
    expect(text).toContain('puntos en todos los programas');
    expect(text).toContain('nombre, apellido, correo electrónico');
  });

  // Las ventas se conservan porque `purchase.beneficiary_id` es NOT NULL y son
  // registros contables del comercio. Decirlo es parte de la transparencia que
  // exige la declaracion, no un detalle de implementacion que se pueda omitir.
  it('explains what is retained and why', () => {
    const { container } = render(<EliminarCuentaPage />);
    const text = container.textContent ?? '';
    expect(text).toContain('Qué se conserva');
    expect(text).toContain('desvinculadas de tu identidad');
  });

  it('offers a prefilled mailto to the data protection address', () => {
    const { container } = render(<EliminarCuentaPage />);
    const mail = container.querySelector('a[href^="mailto:"]');
    expect(mail?.getAttribute('href')).toContain('dpo@puntosclub.com.ar');
    expect(mail?.getAttribute('href')).toContain('subject=');
  });

  it('links back to the privacy policy', () => {
    const { container } = render(<EliminarCuentaPage />);
    expect(
      container.querySelector('a[href="/legal/privacidad"]'),
    ).toBeInTheDocument();
  });

  it('exposes a title for the tab', () => {
    expect(metadata.title).toBe('Eliminar mi cuenta | Puntos Club');
  });
});
