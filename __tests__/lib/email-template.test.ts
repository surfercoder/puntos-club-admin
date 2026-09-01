import { esc, pointsCreditedEmail } from '@/lib/email-template';

const base = {
  beneficiaryName: 'Juan Pérez',
  organizationName: 'Kiosco Central',
  pointsEarned: 1500,
  newBalance: 12000,
  accreditedAt: new Date('2025-05-25T17:32:00.000Z'),
};

describe('esc', () => {
  it('neutraliza los caracteres que rompen el HTML del email', () => {
    expect(esc(`<b>&"'`)).toBe('&lt;b&gt;&amp;&quot;&#39;');
  });
});

describe('pointsCreditedEmail', () => {
  it('saluda por el nombre de pila y muestra puntos, saldo y fecha en hora argentina', () => {
    const html = pointsCreditedEmail(base);

    expect(html).toContain('¡Buenísimo, Juan!');
    expect(html).toContain('+1.500');
    expect(html).toContain('12.000');
    expect(html).toContain('Kiosco Central');
    expect(html).toContain('25 de mayo de 2025 - 14:32 hs');
  });

  it('usa el logo de la organización cuando existe', () => {
    const html = pointsCreditedEmail({ ...base, organizationLogoUrl: 'https://cdn.test/logo.png' });

    expect(html).toContain('src="https://cdn.test/logo.png"');
  });

  it('escapa el nombre y la organización en vez de inyectarlos como markup', () => {
    const html = pointsCreditedEmail({
      ...base,
      beneficiaryName: '<script>x</script>',
      organizationName: 'Kiosco "El Centro"',
      organizationLogoUrl: 'https://cdn.test/l.png" onerror="alert(1)',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Kiosco &quot;El Centro&quot;');
    expect(html).not.toContain('onerror="alert(1)"');
  });

  it('cae a un icono genérico cuando la organización no tiene logo', () => {
    const html = pointsCreditedEmail({ ...base, organizationLogoUrl: null });

    expect(html).not.toContain('cdn.test');
    expect(html).toContain('🏬');
  });
});
