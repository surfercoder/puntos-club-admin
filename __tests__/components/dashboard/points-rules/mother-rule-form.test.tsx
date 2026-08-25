import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { MotherRuleForm } from '@/components/dashboard/points-rules/mother-rule-form';

const updatePointsRule = jest.fn();
const push = jest.fn();
const refresh = jest.fn();
const toastSuccess = jest.fn();
const toastError = jest.fn();

jest.mock('@/actions/dashboard/points-rules/actions', () => ({
  updatePointsRule: (...args: unknown[]) => updatePointsRule(...args),
}));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));
jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      {...props}
    />
  ),
}));
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div>
      <span data-testid="branch-value">{value}</span>
      <button data-testid="pick-branch" onClick={() => onValueChange('7')} />
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span />,
}));

const branches = [{ id: '7', name: 'Sucursal Centro' }];
const rule = {
  id: 1,
  name: 'Regla madre',
  ruleType: 'fixed_amount' as const,
  value: '2',
  branchId: '',
  isActive: true,
};

describe('MotherRuleForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updatePointsRule.mockResolvedValue({ success: true });
  });

  it('saves the fixed-amount configuration across every branch', async () => {
    render(<MotherRuleForm branches={branches} rule={rule} />);
    fireEvent.click(screen.getByRole('button', { name: /saveChanges/ }));

    await waitFor(() =>
      expect(updatePointsRule).toHaveBeenCalledWith(1, {
        rule_type: 'fixed_amount',
        config: { points_per_dollar: 2 },
        is_default: true,
        branch_id: undefined,
      }),
    );
    expect(toastSuccess).toHaveBeenCalledWith('saved');
    expect(push).toHaveBeenCalledWith('/dashboard/points-rules');
  });

  it('switches to a percentage rule and stores the percentage', async () => {
    render(<MotherRuleForm branches={branches} rule={rule} />);
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.change(screen.getByLabelText(/valueLabel.percentage/), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /saveChanges/ }));

    await waitFor(() =>
      expect(updatePointsRule).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ rule_type: 'percentage', config: { percentage: 5 } }),
      ),
    );
  });

  it('scopes the rule to a single branch when the toggle is off', async () => {
    render(
      <MotherRuleForm branches={branches} rule={{ ...rule, branchId: '7' }} />,
    );
    expect(screen.getByTestId('branch-value')).toHaveTextContent('7');
    fireEvent.click(screen.getByRole('button', { name: /saveChanges/ }));

    await waitFor(() =>
      expect(updatePointsRule).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ branch_id: 7 }),
      ),
    );
  });

  it('lets the owner switch back to every branch', async () => {
    render(<MotherRuleForm branches={branches} rule={{ ...rule, branchId: '7' }} />);
    fireEvent.click(screen.getByLabelText('allBranchesLabel'));
    fireEvent.click(screen.getByRole('button', { name: /saveChanges/ }));

    await waitFor(() =>
      expect(updatePointsRule).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ branch_id: undefined }),
      ),
    );
  });

  it('moves the rule to another branch', async () => {
    render(<MotherRuleForm branches={branches} rule={{ ...rule, branchId: '5' }} />);
    fireEvent.click(screen.getByTestId('pick-branch'));
    expect(screen.getByTestId('branch-value')).toHaveTextContent('7');

    fireEvent.click(screen.getByRole('button', { name: /saveChanges/ }));
    await waitFor(() =>
      expect(updatePointsRule).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ branch_id: 7 }),
      ),
    );
  });

  it('deactivates the rule', async () => {
    render(<MotherRuleForm branches={branches} rule={rule} />);
    fireEvent.click(screen.getByRole('button', { name: /deactivate/ }));

    await waitFor(() =>
      expect(updatePointsRule).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ is_active: false }),
      ),
    );
    expect(toastSuccess).toHaveBeenCalledWith('deactivated');
  });

  it('cannot deactivate a rule that is already off', () => {
    render(<MotherRuleForm branches={branches} rule={{ ...rule, isActive: false }} />);
    expect(screen.getByRole('button', { name: /deactivate/ })).toBeDisabled();
  });

  it('surfaces a save error and stays on the page', async () => {
    updatePointsRule.mockResolvedValue({ success: false, error: 'nope' });
    render(<MotherRuleForm branches={branches} rule={rule} />);
    fireEvent.click(screen.getByRole('button', { name: /saveChanges/ }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('nope'));
    expect(push).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when the error has no text', async () => {
    updatePointsRule.mockResolvedValue({ success: false });
    render(<MotherRuleForm branches={branches} rule={rule} />);
    fireEvent.click(screen.getByRole('button', { name: /saveChanges/ }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('saveError'));
  });

  it('treats an empty value as zero in the summary', () => {
    render(<MotherRuleForm branches={branches} rule={{ ...rule, value: '' }} />);
    expect(screen.getByText(/summary.fixed_amount/)).toBeInTheDocument();
  });

  it('refuses to save an empty value', async () => {
    render(<MotherRuleForm branches={branches} rule={{ ...rule, value: '' }} />);
    fireEvent.click(screen.getByRole('button', { name: /saveChanges/ }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('invalidValue'));
    expect(updatePointsRule).not.toHaveBeenCalled();
  });

  it('refuses to save a value that is not a number', async () => {
    render(<MotherRuleForm branches={branches} rule={{ ...rule, value: 'abc' }} />);
    fireEvent.click(screen.getByRole('button', { name: /saveChanges/ }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('invalidValue'));
    expect(updatePointsRule).not.toHaveBeenCalled();
  });

  it('refuses to scope the rule to a branch nobody picked', async () => {
    render(<MotherRuleForm branches={branches} rule={rule} />);
    fireEvent.click(screen.getByLabelText('allBranchesLabel'));
    fireEvent.click(screen.getByRole('button', { name: /saveChanges/ }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('branchRequired'));
    expect(updatePointsRule).not.toHaveBeenCalled();
  });

  it('opens and closes the calculation preview', () => {
    render(<MotherRuleForm branches={branches} rule={rule} />);
    const toggle = screen.getByRole('button', { expanded: false });
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument();
  });
});
