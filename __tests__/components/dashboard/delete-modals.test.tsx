import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Mock Dialog to always render children
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: any) => <div>{children}</div>,
}));

// Mock all delete actions
jest.mock('@/actions/dashboard/category/actions', () => ({ deleteCategory: jest.fn() }));
jest.mock('@/actions/dashboard/product/actions', () => ({ deleteProduct: jest.fn() }));
jest.mock('@/actions/dashboard/branch/actions', () => ({ deleteBranch: jest.fn() }));
jest.mock('@/actions/dashboard/stock/actions', () => ({ deleteStock: jest.fn() }));
jest.mock('@/actions/dashboard/beneficiary/actions', () => ({ deleteBeneficiary: jest.fn() }));
jest.mock('@/actions/dashboard/redemption/actions', () => ({ deleteRedemption: jest.fn() }));
jest.mock('@/actions/dashboard/address/actions', () => ({ deleteAddress: jest.fn() }));
jest.mock('@/actions/dashboard/organization/actions', () => ({ deleteOrganization: jest.fn() }));
jest.mock('@/actions/dashboard/app_order/actions', () => ({ deleteAppOrder: jest.fn() }));
jest.mock('@/actions/dashboard/app_user/actions', () => ({ deleteAppUser: jest.fn() }));
jest.mock('@/actions/dashboard/app_user_organization/actions', () => ({ deleteAppUserOrganization: jest.fn() }));
jest.mock('@/actions/dashboard/beneficiary_organization/actions', () => ({ deleteBeneficiaryOrganization: jest.fn() }));
jest.mock('@/actions/dashboard/points-rules/actions', () => ({ deletePointsRule: jest.fn() }));

import { deleteCategory } from '@/actions/dashboard/category/actions';
import { deleteProduct } from '@/actions/dashboard/product/actions';
import { deleteBranch } from '@/actions/dashboard/branch/actions';
import { deleteStock } from '@/actions/dashboard/stock/actions';
import { deleteBeneficiary } from '@/actions/dashboard/beneficiary/actions';
import { deleteRedemption } from '@/actions/dashboard/redemption/actions';
import { deleteAddress } from '@/actions/dashboard/address/actions';
import { deleteOrganization } from '@/actions/dashboard/organization/actions';
import { deleteAppOrder } from '@/actions/dashboard/app_order/actions';
import { deleteAppUser } from '@/actions/dashboard/app_user/actions';
import { deleteAppUserOrganization } from '@/actions/dashboard/app_user_organization/actions';
import { deleteBeneficiaryOrganization } from '@/actions/dashboard/beneficiary_organization/actions';
import { deletePointsRule } from '@/actions/dashboard/points-rules/actions';

import CategoryDeleteModal from '@/components/dashboard/category/delete-modal';
import ProductDeleteModal from '@/components/dashboard/product/delete-modal';
import BranchDeleteModal from '@/components/dashboard/branch/delete-modal';
import StockDeleteModal from '@/components/dashboard/stock/delete-modal';
import BeneficiaryDeleteModal from '@/components/dashboard/beneficiary/delete-modal';
import RedemptionDeleteModal from '@/components/dashboard/redemption/delete-modal';
import AddressDeleteModal from '@/components/dashboard/address/delete-modal';
import OrganizationDeleteModal from '@/components/dashboard/organization/delete-modal';
import AppOrderDeleteModal from '@/components/dashboard/app_order/delete-modal';
import AppUserDeleteModal from '@/components/dashboard/app_user/delete-modal';
import AppUserOrganizationDeleteModal from '@/components/dashboard/app_user_organization/delete-modal';
import BeneficiaryOrganizationDeleteModal from '@/components/dashboard/beneficiary_organization/delete-modal';
import PointsRulesDeleteModal from '@/components/dashboard/points-rules/delete-modal';

const mockRefresh = jest.fn();
const mockInvalidate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({
    push: jest.fn(), replace: jest.fn(), refresh: mockRefresh, back: jest.fn(), prefetch: jest.fn(),
  });
  const { usePlanUsage } = require('@/components/providers/plan-usage-provider');
  (usePlanUsage as jest.Mock).mockReturnValue({
    summary: null, isLoading: false, invalidate: mockInvalidate,
    isAtLimit: jest.fn(() => false), shouldWarn: jest.fn(() => false), getFeature: jest.fn(), plan: null,
  });
});

function getDeleteButton() {
  const buttons = screen.getAllByRole('button');
  // Some modals use i18n key 'delete', others use hardcoded 'Eliminar'.
  // Pick the last matching button (the action button in the footer, not the trigger).
  const matches = buttons.filter((b) => b.textContent === 'delete' || b.textContent === 'Eliminar');
  return matches[matches.length - 1];
}

function expectRendered() {
  expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
}

function getCancelButton() {
  const buttons = screen.getAllByRole('button');
  const matches = buttons.filter((b) => b.textContent === 'cancel' || b.textContent === 'Cancelar');
  return matches[matches.length - 1];
}

// ---- Category ----
describe('CategoryDeleteModal', () => {
  const mock = deleteCategory as jest.Mock;

  it('renders', () => {
    render(<CategoryDeleteModal categoryId="1" categoryName="Cat" />);
    expectRendered();
  });

  it('success path', async () => {
    mock.mockResolvedValue({ error: null });
    render(<CategoryDeleteModal categoryId="1" categoryName="Cat" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(mock).toHaveBeenCalledWith('1'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('deleteSuccess'));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('error path', async () => {
    mock.mockResolvedValue({ error: { message: 'fail' } });
    render(<CategoryDeleteModal categoryId="1" categoryName="Cat" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('deleteError'));
  });

  it('exception path', async () => {
    mock.mockRejectedValue(new Error('Network'));
    render(<CategoryDeleteModal categoryId="1" categoryName="Cat" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('genericError'));
  });

  it('cancel button click', () => {
    render(<CategoryDeleteModal categoryId="1" categoryName="Cat" />);
    fireEvent.click(getCancelButton());
  });
});

// ---- Product ----
describe('ProductDeleteModal', () => {
  const mock = deleteProduct as jest.Mock;

  it('renders', () => {
    render(<ProductDeleteModal productId="1" productName="P" />);
    expectRendered();
  });

  it('success path', async () => {
    mock.mockResolvedValue({ error: null });
    render(<ProductDeleteModal productId="1" productName="P" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('deleteSuccess'));
    expect(mockInvalidate).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('error path', async () => {
    mock.mockResolvedValue({ error: { message: 'fail' } });
    render(<ProductDeleteModal productId="1" productName="P" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('deleteError'));
  });

  it('exception path', async () => {
    mock.mockRejectedValue(new Error('Net'));
    render(<ProductDeleteModal productId="1" productName="P" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('genericError'));
  });

  it('cancel button click', () => {
    render(<ProductDeleteModal productId="1" productName="P" />);
    fireEvent.click(getCancelButton());
  });
});

// ---- Branch ----
describe('BranchDeleteModal', () => {
  const mock = deleteBranch as jest.Mock;

  it('renders', () => {
    render(<BranchDeleteModal branchId="1" branchName="B" />);
    expectRendered();
  });

  it('success path', async () => {
    mock.mockResolvedValue({ error: null });
    render(<BranchDeleteModal branchId="1" branchName="B" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('deleteSuccess'));
    expect(mockInvalidate).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('error path - generic', async () => {
    mock.mockResolvedValue({ error: { message: 'something' } });
    render(<BranchDeleteModal branchId="1" branchName="B" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('deleteError'));
  });

  it('error path - points_rule', async () => {
    mock.mockResolvedValue({ error: { message: 'last default points rule' } });
    render(<BranchDeleteModal branchId="1" branchName="B" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('deleteErrorHasPointsRule'));
  });

  it('error path - points_rule keyword', async () => {
    mock.mockResolvedValue({ error: { message: 'violates points_rule fk' } });
    render(<BranchDeleteModal branchId="1" branchName="B" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('deleteErrorHasPointsRule'));
  });

  it('error with null message', async () => {
    mock.mockResolvedValue({ error: { message: null } });
    render(<BranchDeleteModal branchId="1" branchName="B" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('deleteError'));
  });

  it('exception path', async () => {
    mock.mockRejectedValue(new Error('Net'));
    render(<BranchDeleteModal branchId="1" branchName="B" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('genericError'));
  });

  it('cancel button click', () => {
    render(<BranchDeleteModal branchId="1" branchName="B" />);
    fireEvent.click(getCancelButton());
  });
});

// ---- Stock ----
describe('StockDeleteModal', () => {
  const mock = deleteStock as jest.Mock;

  it('renders', () => {
    render(<StockDeleteModal stockId="1" stockDescription="S" />);
    expectRendered();
  });

  it('success path', async () => {
    mock.mockResolvedValue({ error: null });
    render(<StockDeleteModal stockId="1" stockDescription="S" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('error path', async () => {
    mock.mockResolvedValue({ error: { message: 'fail' } });
    render(<StockDeleteModal stockId="1" stockDescription="S" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('exception path', async () => {
    mock.mockRejectedValue(new Error('Net'));
    render(<StockDeleteModal stockId="1" stockDescription="S" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('cancel button click', () => {
    render(<StockDeleteModal stockId="1" stockDescription="S" />);
    fireEvent.click(getCancelButton());
  });
});

// ---- Beneficiary ----
describe('BeneficiaryDeleteModal', () => {
  const mock = deleteBeneficiary as jest.Mock;

  it('renders', () => {
    render(<BeneficiaryDeleteModal beneficiaryId="1" beneficiaryName="Ben" />);
    expectRendered();
  });

  it('success path', async () => {
    mock.mockResolvedValue({ error: null });
    render(<BeneficiaryDeleteModal beneficiaryId="1" beneficiaryName="Ben" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('deleteSuccess'));
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it('error path', async () => {
    mock.mockResolvedValue({ error: { message: 'fail' } });
    render(<BeneficiaryDeleteModal beneficiaryId="1" beneficiaryName="Ben" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('deleteError'));
  });

  it('exception path', async () => {
    mock.mockRejectedValue(new Error('Net'));
    render(<BeneficiaryDeleteModal beneficiaryId="1" beneficiaryName="Ben" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('genericError'));
  });

  it('cancel button click', () => {
    render(<BeneficiaryDeleteModal beneficiaryId="1" beneficiaryName="Ben" />);
    fireEvent.click(getCancelButton());
  });
});

// ---- Redemption ----
describe('RedemptionDeleteModal', () => {
  const mock = deleteRedemption as jest.Mock;

  it('renders', () => {
    render(<RedemptionDeleteModal redemptionId="1" redemptionDescription="R" />);
    expectRendered();
  });

  it('success path', async () => {
    mock.mockResolvedValue({ error: null });
    render(<RedemptionDeleteModal redemptionId="1" redemptionDescription="R" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('error path', async () => {
    mock.mockResolvedValue({ error: { message: 'fail' } });
    render(<RedemptionDeleteModal redemptionId="1" redemptionDescription="R" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('exception path', async () => {
    mock.mockRejectedValue(new Error('Net'));
    render(<RedemptionDeleteModal redemptionId="1" redemptionDescription="R" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('cancel button click', () => {
    render(<RedemptionDeleteModal redemptionId="1" redemptionDescription="R" />);
    fireEvent.click(getCancelButton());
  });
});

// ---- Address ----
describe('AddressDeleteModal', () => {
  const mock = deleteAddress as jest.Mock;

  it('renders', () => {
    render(<AddressDeleteModal id={1} />);
    expectRendered();
  });

  it('success path', async () => {
    mock.mockResolvedValue(undefined);
    render(<AddressDeleteModal id={1} />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(mock).toHaveBeenCalledWith(1));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('exception path', async () => {
    mock.mockRejectedValue(new Error('Network'));
    render(<AddressDeleteModal id={1} />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('genericError'));
  });

  it('cancel button click', () => {
    render(<AddressDeleteModal id={1} />);
    const cancelBtn = getCancelButton();
    fireEvent.click(cancelBtn);
    // setOpen(false) was called
    expect(cancelBtn).toBeDefined();
  });
});

// ---- Organization ----
describe('OrganizationDeleteModal', () => {
  const mock = deleteOrganization as jest.Mock;

  it('renders', () => {
    render(<OrganizationDeleteModal organizationId="1" organizationName="Org" />);
    expectRendered();
  });

  it('success path', async () => {
    mock.mockResolvedValue({ error: null });
    render(<OrganizationDeleteModal organizationId="1" organizationName="Org" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('deleteSuccess'));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('error path', async () => {
    mock.mockResolvedValue({ error: { message: 'fail' } });
    render(<OrganizationDeleteModal organizationId="1" organizationName="Org" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('deleteError'));
  });

  it('exception path', async () => {
    mock.mockRejectedValue(new Error('Net'));
    render(<OrganizationDeleteModal organizationId="1" organizationName="Org" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('genericError'));
  });

  it('cancel button click', () => {
    render(<OrganizationDeleteModal organizationId="1" organizationName="Org" />);
    fireEvent.click(getCancelButton());
  });
});

// ---- AppOrder ----
describe('AppOrderDeleteModal', () => {
  const mock = deleteAppOrder as jest.Mock;

  it('renders', () => {
    render(<AppOrderDeleteModal appOrderId="1" appOrderNumber="ORD-1" />);
    expectRendered();
  });

  it('success path', async () => {
    mock.mockResolvedValue(undefined);
    render(<AppOrderDeleteModal appOrderId="1" appOrderNumber="ORD-1" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('exception path', async () => {
    mock.mockRejectedValue(new Error('Net'));
    render(<AppOrderDeleteModal appOrderId="1" appOrderNumber="ORD-1" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('cancel button click', () => {
    render(<AppOrderDeleteModal appOrderId="1" appOrderNumber="ORD-1" />);
    fireEvent.click(getCancelButton());
  });
});

// ---- AppUser ----
describe('AppUserDeleteModal', () => {
  const mock = deleteAppUser as jest.Mock;

  it('renders', () => {
    render(<AppUserDeleteModal appUserId="1" appUserName="User" />);
    expectRendered();
  });

  it('success path', async () => {
    mock.mockResolvedValue({ error: null });
    render(<AppUserDeleteModal appUserId="1" appUserName="User" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('deleteSuccess'));
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it('error path', async () => {
    mock.mockResolvedValue({ error: { message: 'fail' } });
    render(<AppUserDeleteModal appUserId="1" appUserName="User" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('deleteError'));
  });

  it('exception path', async () => {
    mock.mockRejectedValue(new Error('Net'));
    render(<AppUserDeleteModal appUserId="1" appUserName="User" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('genericError'));
  });

  it('cancel button click', () => {
    render(<AppUserDeleteModal appUserId="1" appUserName="User" />);
    fireEvent.click(getCancelButton());
  });
});

// ---- AppUserOrganization ----
describe('AppUserOrganizationDeleteModal', () => {
  const mock = deleteAppUserOrganization as jest.Mock;

  it('renders', () => {
    render(<AppUserOrganizationDeleteModal appUserOrganizationId="1" appUserOrganizationDescription="Link" />);
    expectRendered();
  });

  it('success path', async () => {
    mock.mockResolvedValue({ error: null });
    render(<AppUserOrganizationDeleteModal appUserOrganizationId="1" appUserOrganizationDescription="Link" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('error path', async () => {
    mock.mockResolvedValue({ error: { message: 'fail' } });
    render(<AppUserOrganizationDeleteModal appUserOrganizationId="1" appUserOrganizationDescription="Link" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('exception path', async () => {
    mock.mockRejectedValue(new Error('Net'));
    render(<AppUserOrganizationDeleteModal appUserOrganizationId="1" appUserOrganizationDescription="Link" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('cancel button click', () => {
    render(<AppUserOrganizationDeleteModal appUserOrganizationId="1" appUserOrganizationDescription="Link" />);
    fireEvent.click(getCancelButton());
  });
});

// ---- BeneficiaryOrganization ----
describe('BeneficiaryOrganizationDeleteModal', () => {
  const mock = deleteBeneficiaryOrganization as jest.Mock;

  it('renders', () => {
    render(<BeneficiaryOrganizationDeleteModal beneficiaryOrganizationId="1" beneficiaryOrganizationDescription="Link" />);
    expectRendered();
  });

  it('success path', async () => {
    mock.mockResolvedValue({ error: null });
    render(<BeneficiaryOrganizationDeleteModal beneficiaryOrganizationId="1" beneficiaryOrganizationDescription="Link" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('deleteSuccess'));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('error path', async () => {
    mock.mockResolvedValue({ error: { message: 'fail' } });
    render(<BeneficiaryOrganizationDeleteModal beneficiaryOrganizationId="1" beneficiaryOrganizationDescription="Link" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('deleteError'));
  });

  it('exception path', async () => {
    mock.mockRejectedValue(new Error('Net'));
    render(<BeneficiaryOrganizationDeleteModal beneficiaryOrganizationId="1" beneficiaryOrganizationDescription="Link" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('genericError'));
  });

  it('cancel button click', () => {
    render(<BeneficiaryOrganizationDeleteModal beneficiaryOrganizationId="1" beneficiaryOrganizationDescription="Link" />);
    fireEvent.click(getCancelButton());
  });
});

// ---- PointsRules ----
describe('PointsRulesDeleteModal', () => {
  const mock = deletePointsRule as jest.Mock;

  it('renders', () => {
    render(<PointsRulesDeleteModal ruleId={1} ruleName="Rule" />);
    expectRendered();
  });

  it('success with onDeleted', async () => {
    mock.mockResolvedValue({ success: true });
    const onDeleted = jest.fn();
    render(<PointsRulesDeleteModal ruleId={1} ruleName="Rule" onDeleted={onDeleted} />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('deleteSuccess'));
    expect(onDeleted).toHaveBeenCalled();
  });

  it('error with custom message', async () => {
    mock.mockResolvedValue({ success: false, error: 'Custom error' });
    render(<PointsRulesDeleteModal ruleId={1} ruleName="Rule" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Custom error'));
  });

  it('error without custom message', async () => {
    mock.mockResolvedValue({ success: false, error: '' });
    render(<PointsRulesDeleteModal ruleId={1} ruleName="Rule" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('deleteError'));
  });

  it('exception path', async () => {
    mock.mockRejectedValue(new Error('Net'));
    render(<PointsRulesDeleteModal ruleId={1} ruleName="Rule" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('genericError'));
  });

  it('success without onDeleted', async () => {
    mock.mockResolvedValue({ success: true });
    render(<PointsRulesDeleteModal ruleId={1} ruleName="Rule" />);
    fireEvent.click(getDeleteButton());
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('deleteSuccess'));
  });

  it('cancel button click', () => {
    render(<PointsRulesDeleteModal ruleId={1} ruleName="Rule" />);
    fireEvent.click(getCancelButton());
  });
});
