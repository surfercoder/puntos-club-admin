import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import NewPointsRulePage from '@/app/dashboard/points-rules/new/page';
import { createPointsRule } from '@/actions/dashboard/points-rules/actions';
import { useRouter } from 'next/navigation';

const mockCreatePointsRule = createPointsRule as jest.Mock;
const mockPush = jest.fn();

jest.mock('@/actions/dashboard/points-rules/actions', () => ({
  createPointsRule: jest.fn(),
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
      <select data-testid="mock-select" value={value || ''} onChange={(e) => onValueChange?.(e.target.value)}>
        <option value="">--</option>
        <option value="fixed_amount">fixed_amount</option>
        <option value="percentage">percentage</option>
        <option value="fixed_per_item">fixed_per_item</option>
        <option value="10">Branch X</option>
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

describe('NewPointsRulePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, replace: jest.fn() });
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=123' });
    mockOrder.mockResolvedValue({ data: [{ id: '10', name: 'Branch X' }] });
  });

  it('exports a default function (client component)', () => {
    expect(typeof NewPointsRulePage).toBe('function');
  });

  it('renders the form', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    expect(screen.getByText('form.createTitle')).toBeInTheDocument();
    expect(screen.getByText('form.createDescription')).toBeInTheDocument();
  });

  it('renders back to list link', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    expect(screen.getByText('backToList')).toBeInTheDocument();
    const link = document.querySelector('a[href="/dashboard/points-rules"]');
    expect(link).toBeTruthy();
  });

  it('renders basic info section', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    expect(screen.getByText('form.basicInfo')).toBeInTheDocument();
    expect(screen.getByText('form.ruleName')).toBeInTheDocument();
    expect(screen.getByText('form.description')).toBeInTheDocument();
  });

  it('handles name change', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const nameInput = screen.getByLabelText('form.ruleName');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'My Rule' } });
    });
    expect(screen.getByDisplayValue('My Rule')).toBeInTheDocument();
  });

  it('handles description change', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const descInput = screen.getByLabelText('form.description');
    await act(async () => {
      fireEvent.change(descInput, { target: { value: 'A desc' } });
    });
    expect(screen.getByDisplayValue('A desc')).toBeInTheDocument();
  });

  it('handles is_active toggle', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const sw = screen.getByTestId('switch-is_active');
    expect(sw).toBeChecked();
    await act(async () => {
      fireEvent.click(sw);
    });
    expect(sw).not.toBeChecked();
  });

  it('handles is_default toggle (clears schedule)', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const sw = screen.getByTestId('switch-is_default');
    expect(sw).not.toBeChecked();
    await act(async () => {
      fireEvent.click(sw);
    });
    expect(sw).toBeChecked();
  });

  it('handles show_in_app toggle', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const sw = screen.getByTestId('switch-show_in_app');
    await act(async () => {
      fireEvent.click(sw);
    });
  });

  it('renders points calculation section with default rule type', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    expect(screen.getByText('form.pointsCalc')).toBeInTheDocument();
    expect(screen.getByText('form.pointsPerPurchase')).toBeInTheDocument();
  });

  it('handles points_per_dollar change', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const input = screen.getByLabelText('form.pointsPerPurchase');
    await act(async () => {
      fireEvent.change(input, { target: { value: '5' } });
    });
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('handles priority change', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const input = screen.getByLabelText('form.priority');
    await act(async () => {
      fireEvent.change(input, { target: { value: '10' } });
    });
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  it('handles rule type change to percentage', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    // Change rule type
    const selects = screen.getAllByTestId('mock-select');
    // The second select is rule_type (first is branch_id)
    const ruleTypeSelect = selects[1];
    await act(async () => {
      fireEvent.change(ruleTypeSelect, { target: { value: 'percentage' } });
    });
    await waitFor(() => {
      expect(screen.getByText('form.percentage')).toBeInTheDocument();
    });
  });

  it('handles percentage change', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    // Switch to percentage type
    const selects = screen.getAllByTestId('mock-select');
    await act(async () => {
      fireEvent.change(selects[1], { target: { value: 'percentage' } });
    });
    await waitFor(() => {
      expect(screen.getByLabelText('form.percentage')).toBeInTheDocument();
    });
    const percentInput = screen.getByLabelText('form.percentage');
    await act(async () => {
      fireEvent.change(percentInput, { target: { value: '25' } });
    });
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
  });

  it('handles branch_id change', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const selects = screen.getAllByTestId('mock-select');
    // First select is branch_id
    await act(async () => {
      fireEvent.change(selects[0], { target: { value: '10' } });
    });
  });

  it('renders schedule section', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    expect(screen.getByText('form.schedule')).toBeInTheDocument();
    expect(screen.getByText('form.startDate')).toBeInTheDocument();
    expect(screen.getByText('form.endDate')).toBeInTheDocument();
    expect(screen.getByText('form.startTime')).toBeInTheDocument();
    expect(screen.getByText('form.endTime')).toBeInTheDocument();
    expect(screen.getByText('form.activeDays')).toBeInTheDocument();
  });

  it('handles schedule date changes', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const startDate = screen.getByLabelText('form.startDate');
    await act(async () => {
      fireEvent.change(startDate, { target: { value: '2025-01-01' } });
    });
    expect(screen.getByDisplayValue('2025-01-01')).toBeInTheDocument();

    const endDate = screen.getByLabelText('form.endDate');
    await act(async () => {
      fireEvent.change(endDate, { target: { value: '2025-12-31' } });
    });
    expect(screen.getByDisplayValue('2025-12-31')).toBeInTheDocument();
  });

  it('handles schedule time changes', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const startTime = screen.getByLabelText('form.startTime');
    await act(async () => {
      fireEvent.change(startTime, { target: { value: '08:00' } });
    });
    const endTime = screen.getByLabelText('form.endTime');
    await act(async () => {
      fireEvent.change(endTime, { target: { value: '20:00' } });
    });
  });

  it('handles day toggle (add and remove)', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    // Toggle day 0 (add)
    const day0 = screen.getByTestId('checkbox-day-0');
    await act(async () => {
      fireEvent.click(day0);
    });
    expect(day0).toBeChecked();

    // Toggle day 0 again (remove)
    await act(async () => {
      fireEvent.click(day0);
    });
    expect(day0).not.toBeChecked();
  });

  it('renders display settings section', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    expect(screen.getByText('form.displaySettings')).toBeInTheDocument();
    expect(screen.getByText('form.displayName')).toBeInTheDocument();
    expect(screen.getByText('form.icon')).toBeInTheDocument();
    expect(screen.getByText('form.color')).toBeInTheDocument();
  });

  it('handles display_name change', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const input = screen.getByLabelText('form.displayName');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'My Display' } });
    });
    expect(screen.getByDisplayValue('My Display')).toBeInTheDocument();
  });

  it('handles emoji icon selection', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const emojiButton = screen.getByText('💎');
    await act(async () => {
      fireEvent.click(emojiButton);
    });
  });

  it('handles display_color change (color input)', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const colorInput = screen.getByLabelText('form.color');
    await act(async () => {
      fireEvent.change(colorInput, { target: { value: '#00FF00' } });
    });
  });

  it('handles display_color change (text input)', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const textInputs = screen.getAllByDisplayValue('#3B82F6');
    expect(textInputs.length).toBeGreaterThanOrEqual(1);
    // Change the last one (text input)
    const textInput = textInputs[textInputs.length - 1];
    await act(async () => {
      fireEvent.change(textInput, { target: { value: '#FF0000' } });
    });
  });

  it('handles form submit success with fixed_amount', async () => {
    mockCreatePointsRule.mockResolvedValue({ success: true });
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    // Fill in required name
    const nameInput = screen.getByLabelText('form.ruleName');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'New Rule' } });
    });

    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(mockCreatePointsRule).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Rule',
        rule_type: 'fixed_amount',
        config: { points_per_dollar: 2 },
        display_name: 'New Rule', // uses name when display_name is empty
      }));
      expect(mockPush).toHaveBeenCalledWith('/dashboard/points-rules');
    });
  });

  it('handles form submit with percentage type', async () => {
    mockCreatePointsRule.mockResolvedValue({ success: true });
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    // Switch to percentage
    const selects = screen.getAllByTestId('mock-select');
    await act(async () => {
      fireEvent.change(selects[1], { target: { value: 'percentage' } });
    });

    const nameInput = screen.getByLabelText('form.ruleName');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Pct Rule' } });
    });

    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(mockCreatePointsRule).toHaveBeenCalledWith(expect.objectContaining({
        config: { percentage: 10 },
      }));
    });
  });

  it('handles form submit with fixed_per_item type', async () => {
    mockCreatePointsRule.mockResolvedValue({ success: true });
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const selects = screen.getAllByTestId('mock-select');
    await act(async () => {
      fireEvent.change(selects[1], { target: { value: 'fixed_per_item' } });
    });

    const nameInput = screen.getByLabelText('form.ruleName');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Item Rule' } });
    });

    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(mockCreatePointsRule).toHaveBeenCalledWith(expect.objectContaining({
        config: { points_per_item: 2 },
      }));
    });
  });

  it('handles form submit failure', async () => {
    mockCreatePointsRule.mockResolvedValue({ success: false, error: 'Validation failed' });
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const nameInput = screen.getByLabelText('form.ruleName');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Bad Rule' } });
    });

    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Error: Validation failed');
    });
    expect(mockPush).not.toHaveBeenCalled();
    alertMock.mockRestore();
  });

  it('handles form submit with is_default true', async () => {
    mockCreatePointsRule.mockResolvedValue({ success: true });
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    // Set name
    const nameInput = screen.getByLabelText('form.ruleName');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Default Rule' } });
    });
    // Toggle is_default
    const sw = screen.getByTestId('switch-is_default');
    await act(async () => {
      fireEvent.click(sw);
    });

    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(mockCreatePointsRule).toHaveBeenCalledWith(expect.objectContaining({
        is_default: true,
        show_in_app: false,
        start_date: undefined,
        end_date: undefined,
        time_start: undefined,
        time_end: undefined,
        days_of_week: undefined,
      }));
    });
  });

  it('handles form submit with schedule (days_of_week, dates, times)', async () => {
    mockCreatePointsRule.mockResolvedValue({ success: true });
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const nameInput = screen.getByLabelText('form.ruleName');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Scheduled Rule' } });
    });

    // Set dates
    const startDate = screen.getByLabelText('form.startDate');
    await act(async () => {
      fireEvent.change(startDate, { target: { value: '2025-01-01' } });
    });
    const endDate = screen.getByLabelText('form.endDate');
    await act(async () => {
      fireEvent.change(endDate, { target: { value: '2025-12-31' } });
    });

    // Set times
    const startTime = screen.getByLabelText('form.startTime');
    await act(async () => {
      fireEvent.change(startTime, { target: { value: '09:00' } });
    });
    const endTime = screen.getByLabelText('form.endTime');
    await act(async () => {
      fireEvent.change(endTime, { target: { value: '17:00' } });
    });

    // Toggle some days
    const day1 = screen.getByTestId('checkbox-day-1');
    await act(async () => {
      fireEvent.click(day1);
    });
    const day3 = screen.getByTestId('checkbox-day-3');
    await act(async () => {
      fireEvent.click(day3);
    });

    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(mockCreatePointsRule).toHaveBeenCalledWith(expect.objectContaining({
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        time_start: '09:00',
        time_end: '17:00',
        days_of_week: [1, 3],
      }));
    });
  });

  it('handles form submit with branch_id', async () => {
    mockCreatePointsRule.mockResolvedValue({ success: true });
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const nameInput = screen.getByLabelText('form.ruleName');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Branch Rule' } });
    });

    // Select branch
    const selects = screen.getAllByTestId('mock-select');
    await act(async () => {
      fireEvent.change(selects[0], { target: { value: '10' } });
    });

    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(mockCreatePointsRule).toHaveBeenCalledWith(expect.objectContaining({
        branch_id: 10,
      }));
    });
  });

  it('handles form submit with display_name set', async () => {
    mockCreatePointsRule.mockResolvedValue({ success: true });
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const nameInput = screen.getByLabelText('form.ruleName');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Rule Name' } });
    });
    const displayInput = screen.getByLabelText('form.displayName');
    await act(async () => {
      fireEvent.change(displayInput, { target: { value: 'Custom Display' } });
    });

    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(mockCreatePointsRule).toHaveBeenCalledWith(expect.objectContaining({
        display_name: 'Custom Display',
      }));
    });
  });

  it('shows creating state on submit button', async () => {
    mockCreatePointsRule.mockImplementation(() => new Promise(() => {})); // never resolves
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    expect(screen.getByText('form.createRule')).toBeInTheDocument();

    const form = document.querySelector('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(screen.getByText('form.creating')).toBeInTheDocument();
  });

  it('shows cancel button', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    expect(screen.getByText('cancel')).toBeInTheDocument();
  });

  it('handles orgChanged event', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    await act(async () => {
      window.dispatchEvent(new Event('orgChanged'));
    });
  });

  it('handles no cookie for branch loading', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    expect(screen.getByText('form.createTitle')).toBeInTheDocument();
  });

  it('handles invalid org cookie for branch loading', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=abc' });
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    expect(screen.getByText('form.createTitle')).toBeInTheDocument();
  });

  it('handles orgChanged event with resetBranch', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    // Trigger orgChanged which calls loadBranches(true)
    await act(async () => {
      window.dispatchEvent(new Event('orgChanged'));
    });
    // Should reset branch_id and reload branches
  });

  it('renders all day checkboxes', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    for (let i = 0; i < 7; i++) {
      expect(screen.getByTestId(`checkbox-day-${i}`)).toBeInTheDocument();
    }
  });

  it('renders all emoji options', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    const emojis = ['⭐', '🌙', '🎉', '💎', '🔥', '🍽️', '☀️', '🎁', '💰', '🏆'];
    for (const emoji of emojis) {
      expect(screen.getByText(emoji)).toBeInTheDocument();
    }
  });

  it('handles is_default toggle off (unchecked branch, line 95)', async () => {
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    // Toggle on
    const sw = screen.getByTestId('switch-is_default');
    await act(async () => {
      fireEvent.click(sw);
    });
    await waitFor(() => {
      expect(sw).toBeChecked();
    });
    // Toggle off - hits the `checked=false` (empty object) branch
    await act(async () => {
      fireEvent.click(sw);
    });
    await waitFor(() => {
      expect(sw).not.toBeChecked();
    });
  });

  it('handles branch loading with null data from supabase (line 438 ?? [])', async () => {
    mockOrder.mockResolvedValueOnce({ data: null });
    await act(async () => {
      render(<NewPointsRulePage />);
    });
    expect(screen.getByText('form.createTitle')).toBeInTheDocument();
  });
});
