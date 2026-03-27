import { render } from '@testing-library/react';
import Page, { generateMetadata } from '@/app/auth/forgot-password/page';
jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/forgot-password-form', () => ({ ForgotPasswordForm: () => <div data-testid="forgot-password-form" /> }));

describe('Forgot Password Page', () => {
  it('exports a default function', () => { expect(typeof Page).toBe('function'); });

  it('renders the ForgotPasswordForm component', () => {
    const { getByTestId } = render(<Page />);
    expect(getByTestId('forgot-password-form')).toBeInTheDocument();
  });

  it('generateMetadata returns correct metadata', async () => {
    const metadata = await generateMetadata();
    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
  });
});
