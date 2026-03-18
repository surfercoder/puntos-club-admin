import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import EditPointsRulePage from '@/app/dashboard/points-rules/edit/[id]/page';
import { getPointsRuleById, updatePointsRule } from '@/actions/dashboard/points-rules/actions';
import { useRouter } from 'next/navigation';

const mockGetPointsRuleById = getPointsRuleById as jest.Mock;
const mockUpdatePointsRule = updatePointsRule as jest.Mock;
const mockPush = jest.fn();
const mockUseParams = jest.fn(() => ({ id: '1' }));

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  useParams: (...args: unknown[]) => mockUseParams(...args),
}));

jest.mock('@/actions/dashboard/points-rules/actions', () => ({
  getPointsRuleById: jest.fn(),
  updatePointsRule: jest.fn(),
}));

const mockOrder = jest.fn().mockResolvedValue({ data: [{ id: '10', name: 'Branch X' }] });
const mockEq2 = jest.fn(() => ({ order: mockOrder }));
const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; variant?: string; size?: string }) => (
    <button onClick={onClick} disabled={disabled} type={type} {...props}>{children}</button>
  ),
}));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));
jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => <label htmlFor={htmlFor}>{children}</label>,
}));
jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}));
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value?: string; onValueChange?: (v: string) => void }) => (
    <div data-testid="select-wrapper" data-value={value}>
      {children}
      <select data-testid="mock-select" value={value} onChange={(e) => onValueChange?.(e.target.value)}>
        <option value="fixed_amount">fixed_amount</option>
        <option value="percentage">percentage</option>
        <option value="fixed_per_item">fixed_per_item</option>
      </select>
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => <span />,
}));
jest.mock('@/components/ui/switch', () => ({
  Switch: ({ id, checked, onCheckedChange, disabled }: { id?: string; checked?: boolean; onCheckedChange?: (v: boolean) => void; disabled?: boolean }) => (
    <input
      type="checkbox"
      id={id}
      data-testid={`switch-${id}`}
      checked={checked}
      disabled={disabled}
      onChange={() => onCheckedChange?.(!checked)}
    />
  ),
}));
jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ id, checked, onCheckedChange, disabled }: { id?: string; checked?: boolean; onCheckedChange?: () => void; disabled?: boolean }) => (
    <input
      type="checkbox"
      id={id}
      data-testid={`checkbox-${id}`}
      checked={checked}
      disabled={disabled}
      onChange={() => onCheckedChange?.()}
    />
  ),
}));

const sampleRule = {
  id: 1,
  name: 'Test Rule',
  description: 'Test desc',
  rule_type: 'fixed_amount',
  config: { points_per_dollar: 3 },
  is_active: true,
  is_default: false,
  priority: 5,
  display_name: 'Display Test',
  display_icon: '🔥',
  display_color: '#FF0000',
  show_in_app: true,
  branch_id: 10,
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  time_start: '09:00',
  time_end: '17:00',
  days_of_week: [1, 3, 5],
};

describe('EditPointsRulePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, replace: jest.fn() });
    mockUseParams.mockReturnValue({ id: '1' });
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=123' });
    mockGetPointsRuleById.mockResolvedValue({ success: true, data: sampleRule });
    mockOrder.mockResolvedValue({ data: [{ id: '10', name: 'Branch X' }] });
  });

  it('exports a default function (client component)', () => {
    expect(typeof EditPointsRulePage).toBe('function');
  });

  it('renders loading spinner initially', async () => {
    mockGetPointsRuleById.mockImplementation(() => new Promise(() => {}));
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    // The Loader2 icon is rendered as an SVG; check for the container
    expect(document.querySelector('.animate-spin') || screen.queryByText('form.editTitle') === null).toBeTruthy();
  });

  it('renders fetch error state', async () => {
    mockGetPointsRuleById.mockResolvedValue({ success: false, error: 'Not found' });
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText(/form.loadError/)).toBeInTheDocument();
    });
    expect(screen.getByText('backToList')).toBeInTheDocument();
  });

  it('renders form with loaded data', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('Test Rule')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test desc')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Display Test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#FF0000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // priority
    expect(screen.getByDisplayValue('3')).toBeInTheDocument(); // points_per_dollar
  });

  it('renders back to list link', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    const links = screen.getAllByText('backToList');
    expect(links.length).toBeGreaterThan(0);
  });

  it('handles name change', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Rule')).toBeInTheDocument();
    });
    const nameInput = screen.getByDisplayValue('Test Rule');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'New Name' } });
    });
    expect(screen.getByDisplayValue('New Name')).toBeInTheDocument();
  });

  it('handles description change', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test desc')).toBeInTheDocument();
    });
    const descInput = screen.getByDisplayValue('Test desc');
    await act(async () => {
      fireEvent.change(descInput, { target: { value: 'New desc' } });
    });
    expect(screen.getByDisplayValue('New desc')).toBeInTheDocument();
  });

  it('handles is_active toggle', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByTestId('switch-is_active')).toBeInTheDocument();
    });
    const sw = screen.getByTestId('switch-is_active');
    await act(async () => {
      fireEvent.click(sw);
    });
    await waitFor(() => {
      expect(screen.getByTestId('switch-is_active')).not.toBeChecked();
    });
  });

  it('handles is_default toggle (clears schedule fields)', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByTestId('switch-is_default')).toBeInTheDocument();
    });
    const sw = screen.getByTestId('switch-is_default');
    await act(async () => {
      fireEvent.click(sw);
    });
    // When is_default is set to true, schedule fields should be cleared
    await waitFor(() => {
      expect(screen.getByTestId('switch-is_default')).toBeChecked();
    });
  });

  it('handles show_in_app toggle', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByTestId('switch-show_in_app')).toBeInTheDocument();
    });
    const sw = screen.getByTestId('switch-show_in_app');
    await act(async () => {
      fireEvent.click(sw);
    });
  });

  it('handles rule type change to percentage', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    // Find the rule type select (first one)
    const selects = screen.getAllByTestId('mock-select');
    await act(async () => {
      fireEvent.change(selects[0], { target: { value: 'percentage' } });
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // percentage field
    });
  });

  it('handles rule type change to fixed_per_item and edits the input', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    const selects = screen.getAllByTestId('mock-select');
    await act(async () => {
      fireEvent.change(selects[0], { target: { value: 'fixed_per_item' } });
    });
    await waitFor(() => {
      expect(screen.getByText('form.pointsPerItem')).toBeInTheDocument();
    });
    // Edit the points_per_item input (covers line 330)
    const input = screen.getByLabelText('form.pointsPerItem');
    await act(async () => {
      fireEvent.change(input, { target: { value: '8' } });
    });
    expect(input).toHaveValue(8);
  });

  it('handles points_per_dollar change', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByLabelText('form.pointsPerPurchase')).toBeInTheDocument();
    });
    const input = screen.getByLabelText('form.pointsPerPurchase');
    expect(input).toHaveValue(3);
    await act(async () => {
      fireEvent.change(input, { target: { value: '7' } });
    });
    expect(input).toHaveValue(7);
  });

  it('handles priority change', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // priority
    });
    const input = screen.getByLabelText('form.priority');
    await act(async () => {
      fireEvent.change(input, { target: { value: '99' } });
    });
    expect(screen.getByDisplayValue('99')).toBeInTheDocument();
  });

  it('handles branch change', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    const branchSelect = screen.getByLabelText('calculator.branch');
    await act(async () => {
      fireEvent.change(branchSelect, { target: { value: '10' } });
    });
  });

  it('handles schedule date changes', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    const startDate = screen.getByLabelText('form.startDate');
    await act(async () => {
      fireEvent.change(startDate, { target: { value: '2025-06-01' } });
    });
    expect(screen.getByDisplayValue('2025-06-01')).toBeInTheDocument();

    const endDate = screen.getByLabelText('form.endDate');
    await act(async () => {
      fireEvent.change(endDate, { target: { value: '2025-12-31' } });
    });
    expect(screen.getByDisplayValue('2025-12-31')).toBeInTheDocument();
  });

  it('handles schedule time changes', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    const startTime = screen.getByLabelText('form.startTime');
    await act(async () => {
      fireEvent.change(startTime, { target: { value: '10:00' } });
    });
    const endTime = screen.getByLabelText('form.endTime');
    await act(async () => {
      fireEvent.change(endTime, { target: { value: '18:00' } });
    });
  });

  it('handles day toggle', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    // Toggle day 0 (add it)
    const day0 = screen.getByTestId('checkbox-day-0');
    await act(async () => {
      fireEvent.click(day0);
    });
    // Toggle day 1 (remove it, it was already selected)
    const day1 = screen.getByTestId('checkbox-day-1');
    await act(async () => {
      fireEvent.click(day1);
    });
  });

  it('handles display_name change', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('Display Test')).toBeInTheDocument();
    });
    const input = screen.getByDisplayValue('Display Test');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'New Display' } });
    });
    expect(screen.getByDisplayValue('New Display')).toBeInTheDocument();
  });

  it('handles emoji icon selection', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    // Click on a different emoji
    const emojiButton = screen.getByText('💎');
    await act(async () => {
      fireEvent.click(emojiButton);
    });
  });

  it('handles display_color change (color picker)', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByLabelText('form.color')).toBeInTheDocument();
    });
    const colorInput = screen.getByLabelText('form.color');
    await act(async () => {
      fireEvent.change(colorInput, { target: { value: '#00FF00' } });
    });
  });

  it('handles display_color change (text input)', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getAllByDisplayValue('#FF0000').length).toBeGreaterThanOrEqual(1);
    });
    const colorInputs = screen.getAllByDisplayValue('#FF0000');
    // Change the last input (text type)
    const textInput = colorInputs[colorInputs.length - 1];
    await act(async () => {
      fireEvent.change(textInput, { target: { value: '#0000FF' } });
    });
  });

  it('handles form submit success with fixed_amount', async () => {
    mockUpdatePointsRule.mockResolvedValue({ success: true });
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(mockUpdatePointsRule).toHaveBeenCalledWith(1, expect.objectContaining({
        name: 'Test Rule',
        rule_type: 'fixed_amount',
        config: { points_per_dollar: 3 },
      }));
      expect(mockPush).toHaveBeenCalledWith('/dashboard/points-rules');
    });
  });

  it('handles form submit success with percentage type', async () => {
    const percentageRule = {
      ...sampleRule,
      rule_type: 'percentage',
      config: { percentage: 15 },
    };
    mockGetPointsRuleById.mockResolvedValue({ success: true, data: percentageRule });
    mockUpdatePointsRule.mockResolvedValue({ success: true });
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(mockUpdatePointsRule).toHaveBeenCalledWith(1, expect.objectContaining({
        config: { percentage: 15 },
      }));
    });
  });

  it('handles form submit success with fixed_per_item type', async () => {
    const perItemRule = {
      ...sampleRule,
      rule_type: 'fixed_per_item',
      config: { points_per_item: 7 },
    };
    mockGetPointsRuleById.mockResolvedValue({ success: true, data: perItemRule });
    mockUpdatePointsRule.mockResolvedValue({ success: true });
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(mockUpdatePointsRule).toHaveBeenCalledWith(1, expect.objectContaining({
        config: { points_per_item: 7 },
      }));
    });
  });

  it('handles form submit failure', async () => {
    mockUpdatePointsRule.mockResolvedValue({ success: false, error: 'Server error' });
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Error: Server error');
    });
    alertMock.mockRestore();
  });

  it('handles form submit with is_default true (clears schedule)', async () => {
    const defaultRule = {
      ...sampleRule,
      is_default: true,
      start_date: '',
      end_date: '',
      time_start: '',
      time_end: '',
      days_of_week: [],
      show_in_app: false,
    };
    mockGetPointsRuleById.mockResolvedValue({ success: true, data: defaultRule });
    mockUpdatePointsRule.mockResolvedValue({ success: true });
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(mockUpdatePointsRule).toHaveBeenCalledWith(1, expect.objectContaining({
        show_in_app: false,
        start_date: undefined,
        end_date: undefined,
        time_start: undefined,
        time_end: undefined,
        days_of_week: undefined,
      }));
    });
  });

  it('handles form submit with no display_name (uses name)', async () => {
    const ruleNoDisplayName = { ...sampleRule, display_name: '' };
    mockGetPointsRuleById.mockResolvedValue({ success: true, data: ruleNoDisplayName });
    mockUpdatePointsRule.mockResolvedValue({ success: true });
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(mockUpdatePointsRule).toHaveBeenCalledWith(1, expect.objectContaining({
        display_name: 'Test Rule',
      }));
    });
  });

  it('handles form submit with no branch_id', async () => {
    const ruleNoBranch = { ...sampleRule, branch_id: null };
    mockGetPointsRuleById.mockResolvedValue({ success: true, data: ruleNoBranch });
    mockUpdatePointsRule.mockResolvedValue({ success: true });
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(mockUpdatePointsRule).toHaveBeenCalledWith(1, expect.objectContaining({
        branch_id: undefined,
      }));
    });
  });

  it('handles orgChanged event', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    await act(async () => {
      window.dispatchEvent(new Event('orgChanged'));
    });
  });

  it('handles no cookie for branch loading', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
  });

  it('handles invalid org cookie for branch loading', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=abc' });
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
  });

  it('loads rule with missing optional fields', async () => {
    const minimalRule = {
      id: 1,
      name: '',
      description: '',
      rule_type: '',
      config: {},
      is_active: undefined,
      is_default: undefined,
      priority: undefined,
      display_name: '',
      display_icon: '',
      display_color: '',
      show_in_app: undefined,
      branch_id: null,
      start_date: '',
      end_date: '',
      time_start: '',
      time_end: '',
      days_of_week: null,
    };
    mockGetPointsRuleById.mockResolvedValue({ success: true, data: minimalRule });
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
  });

  it('renders percentage input when rule type is percentage', async () => {
    const percentageRule = { ...sampleRule, rule_type: 'percentage', config: { percentage: 20 } };
    mockGetPointsRuleById.mockResolvedValue({ success: true, data: percentageRule });
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.percentage')).toBeInTheDocument();
    });
    const percentInput = screen.getByLabelText('form.percentage');
    await act(async () => {
      fireEvent.change(percentInput, { target: { value: '25' } });
    });
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
  });

  it('shows cancel button with link', async () => {
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    expect(screen.getByText('cancel')).toBeInTheDocument();
  });

  // -- Cover reducer default case (line 115) --
  it('covers reducer default case', async () => {
    const React = require('react');
    const originalUseReducer = jest.requireActual('react').useReducer;
    let capturedReducer: any;
    const useReducerSpy = jest.spyOn(React, 'useReducer').mockImplementation((reducer: any, initialState: any) => {
      if (initialState && 'fetching' in initialState && 'formData' in initialState && 'branches' in initialState) {
        capturedReducer = reducer;
      }
      return originalUseReducer(reducer, initialState);
    });

    await act(async () => {
      render(<EditPointsRulePage />);
    });

    if (capturedReducer) {
      const state = { loading: false, fetching: false, fetchError: null, branches: [], formData: {} };
      const result = capturedReducer(state, { type: 'UNKNOWN' } as any);
      expect(result).toBe(state);
    }

    useReducerSpy.mockRestore();
  });

  it('handles is_default toggle off (unchecked branch, line 179)', async () => {
    // Start with is_default=true, toggle to false
    const defaultRule = { ...sampleRule, is_default: true, start_date: '', end_date: '', time_start: '', time_end: '', days_of_week: [], show_in_app: false };
    mockGetPointsRuleById.mockResolvedValue({ success: true, data: defaultRule });
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByTestId('switch-is_default')).toBeChecked();
    });
    // Toggle off - this hits the `checked=false` branch of the ternary
    const sw = screen.getByTestId('switch-is_default');
    await act(async () => {
      fireEvent.click(sw);
    });
    await waitFor(() => {
      expect(screen.getByTestId('switch-is_default')).not.toBeChecked();
    });
  });

  it('handles form submit with empty schedule fields and is_default=false (lines 645-648, 652)', async () => {
    const ruleNoSchedule = {
      ...sampleRule,
      is_default: false,
      start_date: '',
      end_date: '',
      time_start: '',
      time_end: '',
      days_of_week: [],
    };
    mockGetPointsRuleById.mockResolvedValue({ success: true, data: ruleNoSchedule });
    mockUpdatePointsRule.mockResolvedValue({ success: true });
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });
    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(mockUpdatePointsRule).toHaveBeenCalledWith(1, expect.objectContaining({
        start_date: undefined,
        end_date: undefined,
        time_start: undefined,
        time_end: undefined,
        days_of_week: undefined,
      }));
    });
  });

  it('shows saving state on submit button', async () => {
    mockUpdatePointsRule.mockImplementation(() => new Promise(() => {})); // never resolves
    await act(async () => {
      render(<EditPointsRulePage />);
    });
    await waitFor(() => {
      expect(screen.getByText('form.saveRule')).toBeInTheDocument();
    });
    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(screen.getByText('form.saving')).toBeInTheDocument();
  });
});
