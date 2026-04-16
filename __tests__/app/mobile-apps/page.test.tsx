import { render } from '@testing-library/react';
import MobileAppsPage, { generateMetadata } from '@/app/mobile-apps/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('qrcode.react', () => ({ QRCodeSVG: (props: Record<string, unknown>) => <svg data-testid="qr" data-value={props.value as string} /> }));
jest.mock('lucide-react', () => ({ Smartphone: () => <svg data-testid="smartphone-icon" /> }));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => <div {...props}>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('MobileAppsPage', () => {
  it('exports a default async function', () => {
    expect(typeof MobileAppsPage).toBe('function');
  });

  it('renders without crashing', async () => {
    const result = await MobileAppsPage();
    expect(result).toBeTruthy();
  });

  it('renders all content elements', async () => {
    const jsx = await MobileAppsPage();
    const { container } = render(jsx);
    expect(container.textContent).toContain('title');
    expect(container.textContent).toContain('subtitle');
    expect(container.textContent).toContain('scanToDownload');
    expect(container.textContent).toContain('androidOnly');
  });

  it('renders a QR code for each app', async () => {
    const jsx = await MobileAppsPage();
    const { getAllByTestId } = render(jsx);
    const qrCodes = getAllByTestId('qr');
    expect(qrCodes).toHaveLength(2);
  });

  it('generateMetadata returns correct metadata', async () => {
    const metadata = await generateMetadata();
    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
  });
});
