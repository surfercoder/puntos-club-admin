jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() =>
    Promise.resolve((key: string, values?: Record<string, string>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
    ),
  ),
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

import { renderToStaticMarkup } from 'react-dom/server';

import { PlanFeatureLocked } from '@/components/dashboard/plan/plan-feature-locked';

describe('PlanFeatureLocked', () => {
  it('nombra la feature y manda a mejorar el plan', async () => {
    const html = renderToStaticMarkup(await PlanFeatureLocked({ feature: 'campaigns' }));
    expect(html).toContain('featureLockedTitle');
    expect(html).toContain('features.campaigns');
    expect(html).toContain('href="/dashboard/settings/plan"');
  });
});
