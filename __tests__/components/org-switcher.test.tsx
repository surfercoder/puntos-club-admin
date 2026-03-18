import { render, screen, fireEvent } from '@testing-library/react';
import { OrgSwitcher } from '@/components/org-switcher';

jest.mock('next/image', () => {
  const MockImage = ({ alt, ...props }: { alt: string; [key: string]: unknown }) => (
    <img alt={alt} {...props} />
  );
  MockImage.displayName = 'Image';
  return MockImage;
});

let _capturedOnCancel: (() => void) | undefined;
let _capturedOnSuccess: (() => void) | undefined;

jest.mock('@/components/dashboard/organization/organization-form', () => {
  const MockForm = ({ onCancel, onSuccess }: { onCancel?: () => void; onSuccess?: () => void }) => {
    _capturedOnCancel = onCancel;
    _capturedOnSuccess = onSuccess;
    return (
      <div data-testid="org-form">
        <button data-testid="form-cancel" onClick={onCancel}>Cancel</button>
        <button data-testid="form-success" onClick={onSuccess}>Submit</button>
      </div>
    );
  };
  MockForm.displayName = 'OrganizationForm';
  return MockForm;
});

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  DropdownMenuLabel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: React.PropsWithChildren<{ open: boolean }>) => (
    open ? <div data-testid="dialog">{children}</div> : null
  ),
  DialogContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

jest.mock('@/components/ui/sidebar', () => ({
  SidebarMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SidebarMenuButton: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...props}>{children}</button>
  ),
  SidebarMenuItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  useSidebar: jest.fn(() => ({ isMobile: false })),
}));

describe('OrgSwitcher', () => {
  const orgs = [
    { id: 'org-1', name: 'Alpha Org', logo_url: null },
    { id: 'org-2', name: 'Beta Org', logo_url: 'https://example.com/logo.png' },
  ];

  beforeEach(() => {
    _capturedOnCancel = undefined;
    _capturedOnSuccess = undefined;
  });

  it('renders active org name', () => {
    render(
      <OrgSwitcher
        orgs={orgs}
        activeOrgId="org-1"
        onChangeOrg={jest.fn()}
      />
    );
    expect(screen.getAllByText('Alpha Org').length).toBeGreaterThanOrEqual(1);
  });

  it('renders all orgs in dropdown', () => {
    render(
      <OrgSwitcher
        orgs={orgs}
        activeOrgId="org-1"
        onChangeOrg={jest.fn()}
      />
    );
    expect(screen.getAllByText('Alpha Org').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Beta Org').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onChangeOrg when an org is clicked', () => {
    const onChangeOrg = jest.fn();
    render(
      <OrgSwitcher
        orgs={orgs}
        activeOrgId="org-1"
        onChangeOrg={onChangeOrg}
      />
    );

    // Click on Beta Org in the dropdown
    const buttons = screen.getAllByText('Beta Org');
    fireEvent.click(buttons[0]);
    expect(onChangeOrg).toHaveBeenCalledWith('org-2');
  });

  it('renders organization label', () => {
    render(
      <OrgSwitcher
        orgs={orgs}
        activeOrgId="org-1"
        onChangeOrg={jest.fn()}
      />
    );
    expect(screen.getByText('organization')).toBeInTheDocument();
  });

  it('shows first letter when no logo URL', () => {
    render(
      <OrgSwitcher
        orgs={[{ id: 'org-1', name: 'Alpha Org', logo_url: null }]}
        activeOrgId="org-1"
        onChangeOrg={jest.fn()}
      />
    );
    expect(screen.getAllByText('A').length).toBeGreaterThanOrEqual(1);
  });

  it('does not render add organization button when canAddOrganization is false', () => {
    render(
      <OrgSwitcher
        orgs={orgs}
        activeOrgId="org-1"
        onChangeOrg={jest.fn()}
        canAddOrganization={false}
      />
    );
    expect(screen.queryByText('addNewOrganization')).not.toBeInTheDocument();
  });

  it('renders add organization button when canAddOrganization is true', () => {
    render(
      <OrgSwitcher
        orgs={orgs}
        activeOrgId="org-1"
        onChangeOrg={jest.fn()}
        canAddOrganization={true}
      />
    );
    expect(screen.getByText('addNewOrganization')).toBeInTheDocument();
  });

  it('returns null when no activeOrg and no orgs', () => {
    const { container } = render(
      <OrgSwitcher
        orgs={[]}
        activeOrgId={null}
        onChangeOrg={jest.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly in mobile mode', () => {
    const { useSidebar } = require('@/components/ui/sidebar');
    (useSidebar as jest.Mock).mockReturnValue({ isMobile: true });

    render(
      <OrgSwitcher
        orgs={orgs}
        activeOrgId="org-1"
        onChangeOrg={jest.fn()}
      />
    );
    expect(screen.getAllByText('Alpha Org').length).toBeGreaterThanOrEqual(1);
  });

  it('auto-selects first org when no activeOrgId is provided', () => {
    const onChangeOrg = jest.fn();
    render(
      <OrgSwitcher
        orgs={orgs}
        activeOrgId={null}
        onChangeOrg={onChangeOrg}
      />
    );
    expect(onChangeOrg).toHaveBeenCalledWith('org-1');
  });

  it('opens add organization dialog when add button is clicked', () => {
    render(
      <OrgSwitcher
        orgs={orgs}
        activeOrgId="org-1"
        onChangeOrg={jest.fn()}
        canAddOrganization={true}
      />
    );

    const addButton = screen.getByText('addNewOrganization');
    fireEvent.click(addButton);

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('org-form')).toBeInTheDocument();
  });

  it('renders image when org has logo_url', () => {
    render(
      <OrgSwitcher
        orgs={orgs}
        activeOrgId="org-2"
        onChangeOrg={jest.fn()}
      />
    );
    const images = screen.getAllByRole('img');
    expect(images.some(img => img.getAttribute('alt') === 'Beta Org')).toBe(true);
  });

  it('closes dialog when onCancel is called from the form', () => {
    render(
      <OrgSwitcher
        orgs={orgs}
        activeOrgId="org-1"
        onChangeOrg={jest.fn()}
        canAddOrganization={true}
      />
    );

    // Open dialog
    const addButton = screen.getByText('addNewOrganization');
    fireEvent.click(addButton);

    expect(screen.getByTestId('dialog')).toBeInTheDocument();

    // Click cancel in the form
    fireEvent.click(screen.getByTestId('form-cancel'));

    // Dialog should close
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('closes dialog and refreshes router when onSuccess is called from the form', () => {
    const { useRouter } = require('next/navigation');
    const refreshMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: refreshMock,
    });

    render(
      <OrgSwitcher
        orgs={orgs}
        activeOrgId="org-1"
        onChangeOrg={jest.fn()}
        canAddOrganization={true}
      />
    );

    // Open dialog
    const addButton = screen.getByText('addNewOrganization');
    fireEvent.click(addButton);

    expect(screen.getByTestId('dialog')).toBeInTheDocument();

    // Click submit (onSuccess) in the form
    fireEvent.click(screen.getByTestId('form-success'));

    // Dialog should close
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });
});
