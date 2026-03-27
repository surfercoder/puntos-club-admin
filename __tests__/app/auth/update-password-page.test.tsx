import { render } from '@testing-library/react';
import Page, { generateMetadata } from '@/app/auth/update-password/page';
jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/update-password-form', () => ({ UpdatePasswordForm: () => <div data-testid="update-password-form" /> }));

describe('Update Password Page', () => {
  it('exports a default function', () => { expect(typeof Page).toBe('function'); });

  it('renders the UpdatePasswordForm component', () => {
    const { getByTestId } = render(<Page />);
    expect(getByTestId('update-password-form')).toBeInTheDocument();
  });

  it('generateMetadata returns correct metadata', async () => {
    const metadata = await generateMetadata();
    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
  });
});
