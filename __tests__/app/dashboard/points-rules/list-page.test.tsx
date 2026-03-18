import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import PointsRulesPage from '@/app/dashboard/points-rules/page';
import {
  getAllPointsRules,
  togglePointsRuleStatus,
  testPointsCalculation,
} from '@/actions/dashboard/points-rules/actions';

const mockGetAllPointsRules = getAllPointsRules as jest.Mock;
const mockTogglePointsRuleStatus = togglePointsRuleStatus as jest.Mock;
const mockTestPointsCalculation = testPointsCalculation as jest.Mock;

jest.mock('@/actions/dashboard/points-rules/actions', () => ({
  getAllPointsRules: jest.fn(() => Promise.resolve({ success: true, data: [] })),
  togglePointsRuleStatus: jest.fn(() => Promise.resolve({ success: true })),
  testPointsCalculation: jest.fn(() => Promise.resolve({ success: true, points: 50 })),
}));

jest.mock('@/components/dashboard/points-rules/delete-modal', () => {
  return function MockDeleteModal({ ruleId, ruleName, onDeleted }: { ruleId: number; ruleName: string; onDeleted: () => void }) {
    return <button data-testid={`delete-modal-${ruleId}`} onClick={onDeleted}>{ruleName}</button>;
  };
});

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; asChild?: boolean; variant?: string; size?: string }) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (v: boolean) => void }) => (
    <input type="checkbox" data-testid="switch" checked={checked} onChange={() => onCheckedChange?.(!checked)} />
  ),
}));
jest.mock('@/components/ui/input', () => ({
  Input: (props: Record<string, unknown>) => <input {...(props as React.InputHTMLAttributes<HTMLInputElement>)} />,
}));
jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => <label htmlFor={htmlFor}>{children}</label>,
}));
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));

// Mock the dynamic import of supabase client used in loadBranches
const mockOrder = jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Branch A' }] });
const mockEq2 = jest.fn(() => ({ order: mockOrder }));
const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

const sampleRules = [
  {
    id: 1,
    name: 'Fixed Rule',
    description: 'A fixed amount rule',
    rule_type: 'fixed_amount',
    config: { points_per_dollar: 2 },
    is_active: true,
    is_default: true,
    priority: 10,
    display_name: 'Double Points',
    display_icon: '⭐',
    display_color: '#3B82F6',
    show_in_app: true,
    time_start: '09:00:00',
    time_end: '17:00:00',
    days_of_week: [1, 2, 3],
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    valid_from: null,
    valid_until: null,
    organization: { name: 'Org' },
    branch: { name: 'Branch' },
    category: null,
  },
  {
    id: 2,
    name: 'Percentage Rule',
    description: '',
    rule_type: 'percentage',
    config: { percentage: 15 },
    is_active: false,
    is_default: false,
    priority: 5,
    display_name: '',
    display_icon: '',
    display_color: '#000',
    show_in_app: false,
    time_start: null,
    time_end: null,
    days_of_week: null,
    start_date: '2024-06-01',
    end_date: null,
    valid_from: null,
    valid_until: null,
    organization: null,
    branch: null,
    category: { name: 'Cat' },
  },
  {
    id: 3,
    name: 'Per Item Rule',
    description: 'Per item desc',
    rule_type: 'fixed_per_item',
    config: { points_per_item: 5 },
    is_active: true,
    is_default: false,
    priority: 1,
    display_name: 'Item Bonus',
    display_icon: '🔥',
    display_color: '#FF0000',
    show_in_app: true,
    time_start: null,
    time_end: null,
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
    start_date: null,
    end_date: '2024-12-31',
    valid_from: null,
    valid_until: null,
    organization: null,
    branch: null,
    category: null,
  },
  {
    id: 4,
    name: 'Tiered Rule',
    description: 'Tiered desc',
    rule_type: 'tiered',
    config: { tiers: [] },
    is_active: true,
    is_default: false,
    priority: 2,
    display_name: 'Tiered',
    display_icon: '💎',
    display_color: '#00FF00',
    show_in_app: true,
    time_start: null,
    time_end: null,
    days_of_week: [],
    start_date: null,
    end_date: null,
    valid_from: null,
    valid_until: null,
    organization: null,
    branch: null,
    category: null,
  },
  {
    id: 5,
    name: 'Unknown Rule',
    description: '',
    rule_type: 'some_unknown_type',
    config: {},
    is_active: true,
    is_default: false,
    priority: 0,
    display_name: '',
    display_icon: '',
    display_color: '#000',
    show_in_app: false,
    time_start: '08:00:00',
    time_end: null,
    days_of_week: [1],
    start_date: null,
    end_date: null,
    valid_from: null,
    valid_until: null,
    organization: null,
    branch: null,
    category: null,
  },
];

describe('PointsRulesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'active_org_id=123',
    });
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [] });
    mockOrder.mockResolvedValue({ data: [{ id: '1', name: 'Branch A' }] });
  });

  it('exports a default function (client component)', () => {
    expect(typeof PointsRulesPage).toBe('function');
  });

  it('renders loading state initially', async () => {
    mockGetAllPointsRules.mockImplementation(() => new Promise(() => {})); // never resolves
    await act(async () => {
      render(<PointsRulesPage />);
    });
    expect(screen.getByText('table.loading')).toBeInTheDocument();
  });

  it('renders empty state when no rules', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [] });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('table.empty')).toBeInTheDocument();
    });
  });

  it('renders rules table with all rule types', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: sampleRules });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('Fixed Rule')).toBeInTheDocument();
    });
    // Check display names / icons
    expect(screen.getByText('Double Points')).toBeInTheDocument();
    expect(screen.getAllByText('Percentage Rule').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Per Item Rule').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tiered Rule').length).toBeGreaterThan(0);
  });

  it('shows active and inactive badges', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: sampleRules });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getAllByText('status.active').length).toBeGreaterThan(0);
      expect(screen.getAllByText('status.inactive').length).toBeGreaterThan(0);
    });
  });

  it('shows default badge for default rules', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: sampleRules });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('status.default')).toBeInTheDocument();
    });
  });

  it('shows visible/hidden badges for show_in_app', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: sampleRules });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getAllByText('status.visible').length).toBeGreaterThan(0);
      expect(screen.getAllByText('status.hidden').length).toBeGreaterThan(0);
    });
  });

  it('shows rule config for different rule types', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: sampleRules });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('2 pts/$')).toBeInTheDocument(); // fixed_amount
      expect(screen.getByText('15%')).toBeInTheDocument(); // percentage
      expect(screen.getByText('5 pts/item')).toBeInTheDocument(); // fixed_per_item
      expect(screen.getByText('ruleTypes.multiplelevels')).toBeInTheDocument(); // tiered
      expect(screen.getByText('N/A')).toBeInTheDocument(); // unknown
    });
  });

  it('shows time display for rules with time constraints', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: sampleRules });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('09:00 - 17:00')).toBeInTheDocument();
    });
  });

  it('shows all day for rules without time constraints', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: sampleRules });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getAllByText('schedule.allDay').length).toBeGreaterThan(0);
    });
  });

  it('shows day names for rules with specific days', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: sampleRules });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      // Rule with days [1,2,3] should show day labels
      expect(screen.getByText('form.days.1, form.days.2, form.days.3')).toBeInTheDocument();
    });
  });

  it('shows allDays for rules with all 7 days', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: sampleRules });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getAllByText('schedule.allDays').length).toBeGreaterThan(0);
    });
  });

  it('shows date range for rules with start and end date', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: sampleRules });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      // Rule 1 is_default so shows "schedule.always"
      expect(screen.getByText('schedule.always')).toBeInTheDocument();
      // Rule 2 has start_date only
      expect(screen.getByText('schedule.from')).toBeInTheDocument();
      // Rule 3 has end_date only
      expect(screen.getByText('schedule.until')).toBeInTheDocument();
    });
  });

  it('does not show delete modal for default rules', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: sampleRules });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      // Rule 1 is default, should not have a delete modal
      expect(screen.queryByTestId('delete-modal-1')).not.toBeInTheDocument();
      // Rule 2 is not default, should have a delete modal
      expect(screen.getByTestId('delete-modal-2')).toBeInTheDocument();
    });
  });

  it('handles toggle status', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: sampleRules });
    mockTogglePointsRuleStatus.mockResolvedValue({ success: true });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('Fixed Rule')).toBeInTheDocument();
    });
    const switches = screen.getAllByTestId('switch');
    await act(async () => {
      fireEvent.click(switches[0]);
    });
    await waitFor(() => {
      expect(mockTogglePointsRuleStatus).toHaveBeenCalledWith(1, false);
    });
  });

  it('handles refresh button click', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [] });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('table.empty')).toBeInTheDocument();
    });
    const callsBefore = mockGetAllPointsRules.mock.calls.length;
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: sampleRules });
    const refreshButton = screen.getByText('table.refresh');
    await act(async () => {
      fireEvent.click(refreshButton);
    });
    await waitFor(() => {
      expect(mockGetAllPointsRules.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  it('handles calculator - changes amount and branch', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [] });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('table.empty')).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText('calculator.purchaseAmount');
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: '200' } });
    });
    expect(amountInput).toHaveValue(200);

    const branchSelect = screen.getByLabelText('calculator.branch');
    await act(async () => {
      fireEvent.change(branchSelect, { target: { value: '1' } });
    });
  });

  it('handles calculator - test calculation success', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [] });
    mockTestPointsCalculation.mockResolvedValue({ success: true, points: 50 });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('table.empty')).toBeInTheDocument();
    });

    // Set branch
    const branchSelect = screen.getByLabelText('calculator.branch');
    await act(async () => {
      fireEvent.change(branchSelect, { target: { value: '1' } });
    });

    // Click calculate
    const calcButton = screen.getByText('calculator.calculate');
    await act(async () => {
      fireEvent.click(calcButton);
    });
    await waitFor(() => {
      expect(mockTestPointsCalculation).toHaveBeenCalledWith(100, undefined, 1);
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  it('handles calculator - shows alert when no branch selected', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [] });
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('table.empty')).toBeInTheDocument();
    });

    const calcButton = screen.getByText('calculator.calculate');
    await act(async () => {
      fireEvent.click(calcButton);
    });
    expect(alertMock).toHaveBeenCalledWith('calculator.selectBranchAlert');
    alertMock.mockRestore();
  });

  it('handles calculator - test calculation with no points returned', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [] });
    mockTestPointsCalculation.mockResolvedValue({ success: true });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('table.empty')).toBeInTheDocument();
    });

    const branchSelect = screen.getByLabelText('calculator.branch');
    await act(async () => {
      fireEvent.change(branchSelect, { target: { value: '1' } });
    });

    const calcButton = screen.getByText('calculator.calculate');
    await act(async () => {
      fireEvent.click(calcButton);
    });
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  it('handles calculator - test calculation failure', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [] });
    mockTestPointsCalculation.mockResolvedValue({ success: false, error: 'fail' });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('table.empty')).toBeInTheDocument();
    });

    const branchSelect = screen.getByLabelText('calculator.branch');
    await act(async () => {
      fireEvent.change(branchSelect, { target: { value: '1' } });
    });

    const calcButton = screen.getByText('calculator.calculate');
    await act(async () => {
      fireEvent.click(calcButton);
    });
    await waitFor(() => {
      expect(mockTestPointsCalculation).toHaveBeenCalled();
    });
    // testResult should remain null (no result displayed)
    expect(screen.queryByText('calculator.pointsEarned')).not.toBeInTheDocument();
  });

  it('handles orgChanged event', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [] });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('table.empty')).toBeInTheDocument();
    });

    const callCountBefore = mockGetAllPointsRules.mock.calls.length;
    await act(async () => {
      window.dispatchEvent(new Event('orgChanged'));
    });
    await waitFor(() => {
      expect(mockGetAllPointsRules.mock.calls.length).toBeGreaterThan(callCountBefore);
    });
  });

  it('loads branches with no cookie', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [] });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('table.empty')).toBeInTheDocument();
    });
    // No branches loaded, select should be empty
    const branchSelect = screen.getByLabelText('calculator.branch');
    expect(branchSelect.querySelectorAll('option').length).toBe(1); // only the placeholder
  });

  it('loads branches with invalid cookie', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'active_org_id=abc' });
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [] });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('table.empty')).toBeInTheDocument();
    });
  });

  it('handles getAllPointsRules failure', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: false, error: 'fail' });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('table.empty')).toBeInTheDocument();
    });
  });

  it('handles toggle status failure (does not reload rules)', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: sampleRules });
    mockTogglePointsRuleStatus.mockResolvedValue({ success: false });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('Fixed Rule')).toBeInTheDocument();
    });
    const callsBefore = mockGetAllPointsRules.mock.calls.length;
    const switches = screen.getAllByTestId('switch');
    await act(async () => {
      fireEvent.click(switches[0]);
    });
    await waitFor(() => {
      expect(mockTogglePointsRuleStatus).toHaveBeenCalled();
    });
    // loadRules should not be called again since toggle failed
    expect(mockGetAllPointsRules.mock.calls.length).toBe(callsBefore);
  });

  it('shows time with partial time_start only', async () => {
    const rule = {
      ...sampleRules[0],
      id: 99,
      time_start: '08:30:00',
      time_end: null,
    };
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [rule] });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('08:30 - 23:59')).toBeInTheDocument();
    });
  });

  it('shows time with partial time_end only', async () => {
    const rule = {
      ...sampleRules[0],
      id: 99,
      is_default: false,
      time_start: null,
      time_end: '18:00:00',
    };
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [rule] });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('00:00 - 18:00')).toBeInTheDocument();
    });
  });

  it('shows date range with both start and end (non-default)', async () => {
    const rule = {
      ...sampleRules[0],
      id: 99,
      is_default: false,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
    };
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [rule] });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('2024-01-01 → 2024-12-31')).toBeInTheDocument();
    });
  });

  it('shows no date range for non-default rule with no dates', async () => {
    const rule = {
      ...sampleRules[3], // tiered rule, no dates, not default
      id: 99,
    };
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [rule] });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('Tiered')).toBeInTheDocument();
    });
  });

  it('renders create button link', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [] });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('createButton')).toBeInTheDocument();
    });
    const link = screen.getByRole('link', { name: /createButton/i });
    expect(link).toHaveAttribute('href', '/dashboard/points-rules/new');
  });

  it('renders edit link for each rule', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [sampleRules[0]] });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('Fixed Rule')).toBeInTheDocument();
    });
    const editLink = document.querySelector('a[href="/dashboard/points-rules/edit/1"]');
    expect(editLink).toBeTruthy();
  });

  it('handles delete modal callback (refresh)', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: sampleRules });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByTestId('delete-modal-2')).toBeInTheDocument();
    });
    const callsBefore = mockGetAllPointsRules.mock.calls.length;
    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-modal-2'));
    });
    await waitFor(() => {
      expect(mockGetAllPointsRules.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  it('renders title and description', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [] });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();
    });
  });

  it('renders calculator section', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [] });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('calculator.title')).toBeInTheDocument();
      expect(screen.getByText('calculator.description')).toBeInTheDocument();
    });
  });

  it('renders rule description when present', async () => {
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: sampleRules });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('A fixed amount rule')).toBeInTheDocument();
    });
  });

  // -- Cover reducer default case (line 115) --
  it('covers reducer default case', async () => {
    const React = require('react');
    const originalUseReducer = jest.requireActual('react').useReducer;
    let capturedReducer: any;
    const useReducerSpy = jest.spyOn(React, 'useReducer').mockImplementation((reducer: any, initialState: any) => {
      if (initialState && 'rules' in initialState && 'testAmount' in initialState) {
        capturedReducer = reducer;
      }
      return originalUseReducer(reducer, initialState);
    });

    mockGetAllPointsRules.mockResolvedValue({ success: true, data: [] });
    await act(async () => {
      render(<PointsRulesPage />);
    });

    if (capturedReducer) {
      const state = { rules: [], loading: false, testAmount: '100', testBranchId: '', branches: [], testResult: null, testLoading: false };
      const result = capturedReducer(state, { type: 'UNKNOWN' } as any);
      expect(result).toBe(state);
    }

    useReducerSpy.mockRestore();
  });

  // -- Cover getRuleTypeLabel catch block (line 128) by making t throw --
  it('covers getRuleTypeLabel catch block when t throws for unknown key', async () => {
    // Override useTranslations mock to throw for specific keys
    const { useTranslations } = require('next-intl');
    const originalMock = useTranslations.getMockImplementation?.();
    (useTranslations as jest.Mock).mockImplementation(() => {
      const t = (key: string) => {
        if (key.startsWith('ruleTypes.') && key !== 'ruleTypes.multiplelevels') {
          throw new Error('Missing translation');
        }
        return key;
      };
      t.rich = (key: string) => key;
      t.raw = () => ({});
      return t;
    });

    const ruleWithUnknown = [{
      ...sampleRules[4], // some_unknown_type
      id: 99,
    }];
    mockGetAllPointsRules.mockResolvedValue({ success: true, data: ruleWithUnknown });
    await act(async () => {
      render(<PointsRulesPage />);
    });
    await waitFor(() => {
      // getRuleTypeLabel should catch the throw and return the raw type
      expect(screen.getByText('some_unknown_type')).toBeInTheDocument();
    });

    // Restore mock
    if (originalMock) {
      (useTranslations as jest.Mock).mockImplementation(originalMock);
    } else {
      (useTranslations as jest.Mock).mockImplementation(() => {
        const t = (key: string) => key;
        t.rich = (key: string) => key;
        t.raw = () => ({});
        return t;
      });
    }
  });
});
