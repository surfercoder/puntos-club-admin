import { render } from '@testing-library/react';
import { PublicFooter } from '@/components/public-footer';

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => {
    const t = (key: string, params?: Record<string, unknown>) => {
      if (params) return `${key}:${JSON.stringify(params)}`;
      return key;
    };
    return Promise.resolve(t);
  }),
}));

describe('PublicFooter', () => {
  it('exports a named async function', () => {
    expect(typeof PublicFooter).toBe('function');
  });

  it('renders without crashing', async () => {
    const jsx = await PublicFooter();
    const { container } = render(jsx);
    expect(container.querySelector('footer')).toBeInTheDocument();
  });

  it('renders sign in and sign up links', async () => {
    const jsx = await PublicFooter();
    const { getByText } = render(jsx);
    expect(getByText('signIn')).toBeInTheDocument();
    expect(getByText('signUp')).toBeInTheDocument();
  });
});
