import { render } from '@testing-library/react';
import EmailConfirmedPage from '@/app/auth/email-confirmed/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/ui/card', () => ({ Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));

describe('Email Confirmed Page', () => {
  it('exports a default async function', () => { expect(typeof EmailConfirmedPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await EmailConfirmedPage(); expect(result).toBeTruthy(); });

  it('renders all content elements', async () => {
    const jsx = await EmailConfirmedPage();
    const { container } = render(jsx);
    expect(container.textContent).toContain('title');
    expect(container.textContent).toContain('message');
    expect(container.textContent).toContain('openApp');
  });
});
