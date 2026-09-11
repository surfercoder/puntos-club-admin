import NewCampaignPage from '@/app/dashboard/points-rules/new/page';

let branchRows: unknown[] | null = [];

const order = jest.fn(() => Promise.resolve({ data: branchRows, error: null }));
const branchBuilder: Record<string, unknown> = {};
Object.assign(branchBuilder, { select: () => branchBuilder, eq: () => branchBuilder, order });

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ from: () => branchBuilder })),
}));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ id: '1' })),
}));
const getActiveOrgIdFilter = jest.fn(() => Promise.resolve(1 as number | null));
jest.mock('@/lib/auth/get-active-org-id', () => ({
  getActiveOrgIdFilter: (...args: unknown[]) => getActiveOrgIdFilter(...args),
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
jest.mock('@/components/dashboard/points-rules/campaign-form', () => ({
  CampaignForm: ({ branches }: { branches: unknown }) => (
    <div data-testid="campaign-form">{JSON.stringify(branches)}</div>
  ),
}));

const render = async () =>
  require('react-dom/server').renderToStaticMarkup(await NewCampaignPage()) as string;

describe('NewCampaignPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    branchRows = [{ id: 7, name: 'Sucursal Centro' }];
    getActiveOrgIdFilter.mockResolvedValue(1);
  });

  it('hands the active branches to the form', async () => {
    const html = await render();
    expect(html).toContain('createTitle');
    expect(html).toContain('&quot;id&quot;:&quot;7&quot;');
  });

  it('renders with no branches configured', async () => {
    branchRows = null;
    expect(await render()).toContain('campaign-form');
  });

  it('asks for an organization when none is active', async () => {
    getActiveOrgIdFilter.mockResolvedValue(null);
    expect(await render()).toContain('noOrganization');
  });
});
