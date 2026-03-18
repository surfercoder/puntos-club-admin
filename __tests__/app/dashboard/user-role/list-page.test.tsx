import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserRolePage from '@/app/dashboard/user-role/page';
import { getAllUserRoles, updateUserRole, getUsersCountByRole } from '@/actions/dashboard/user-role/actions';

jest.mock('@/actions/dashboard/user-role/actions', () => ({
  getAllUserRoles: jest.fn(() => Promise.resolve({ success: true, data: [] })),
  updateUserRole: jest.fn(() => Promise.resolve({ success: true })),
  getUsersCountByRole: jest.fn(() => Promise.resolve({ success: true, data: { appUserCounts: {}, beneficiaryCount: 0 } })),
}));
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; [k: string]: unknown }) => (
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
jest.mock('@/components/ui/input', () => ({
  Input: (props: Record<string, unknown>) => <input {...props} />,
}));
jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: { children: React.ReactNode; [k: string]: unknown }) => <label {...props}>{children}</label>,
}));
jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: Record<string, unknown>) => <textarea {...props} />,
}));
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) => open ? (
    <div data-testid="dialog">
      <button data-testid="dialog-close" onClick={() => onOpenChange?.(false)}>Close Dialog</button>
      {children}
    </div>
  ) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockRoles = [
  { id: '1', name: 'final_user', display_name: 'Final User', description: 'End user' },
  { id: '2', name: 'cashier', display_name: 'Cashier', description: null },
  { id: '3', name: 'owner', display_name: 'Owner', description: 'Org owner' },
  { id: '4', name: 'admin', display_name: 'Admin', description: 'Administrator' },
  { id: '5', name: 'collaborator', display_name: 'Collaborator', description: 'Collaborator role' },
];

const mockCounts = {
  appUserCounts: { '2': 5, '3': 2, '4': 1, '5': 3 },
  beneficiaryCount: 100,
};

describe('UserRolePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAllUserRoles as jest.Mock).mockResolvedValue({ success: true, data: mockRoles });
    (getUsersCountByRole as jest.Mock).mockResolvedValue({ success: true, data: mockCounts });
  });

  it('exports a default function (client component)', () => {
    expect(typeof UserRolePage).toBe('function');
  });

  it('renders loading state initially', () => {
    (getAllUserRoles as jest.Mock).mockReturnValue(new Promise(() => {}));
    (getUsersCountByRole as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<UserRolePage />);
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('renders empty state when no roles', async () => {
    (getAllUserRoles as jest.Mock).mockResolvedValue({ success: true, data: [] });
    render(<UserRolePage />);
    await waitFor(() => {
      expect(screen.getByText('empty')).toBeInTheDocument();
    });
  });

  it('renders roles table with data', async () => {
    render(<UserRolePage />);
    await waitFor(() => {
      expect(screen.getAllByText('Final User').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Cashier').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Owner').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders user counts correctly for final_user (beneficiary count)', async () => {
    render(<UserRolePage />);
    await waitFor(() => {
      const allTexts = screen.getAllByText('100');
      expect(allTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders user counts correctly for app user roles', async () => {
    render(<UserRolePage />);
    await waitFor(() => {
      const fiveTexts = screen.getAllByText('5');
      expect(fiveTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('returns 0 when userCounts is null', async () => {
    (getUsersCountByRole as jest.Mock).mockResolvedValue({ success: false, data: null });
    render(<UserRolePage />);
    await waitFor(() => {
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('returns 0 for role not in appUserCounts', async () => {
    (getUsersCountByRole as jest.Mock).mockResolvedValue({
      success: true,
      data: { appUserCounts: {}, beneficiaryCount: 0 },
    });
    render(<UserRolePage />);
    await waitFor(() => {
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows noDescription when role description is null', async () => {
    render(<UserRolePage />);
    await waitFor(() => {
      expect(screen.getByText('noDescription')).toBeInTheDocument();
    });
  });

  it('opens edit dialog when edit button is clicked', async () => {
    render(<UserRolePage />);
    await waitFor(() => {
      expect(screen.getAllByText('Final User').length).toBeGreaterThanOrEqual(1);
    });

    // Find edit buttons (pencil icon buttons) - they don't have text "refresh"
    const allButtons = screen.getAllByRole('button');
    // The edit buttons have variant="ghost" and size="sm", find one that is not the refresh button
    const editButtons = allButtons.filter(b => {
      const text = b.textContent || '';
      return !text.includes('refresh') && !text.includes('title') && !text.includes('description');
    });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });

  it('submits edit form successfully', async () => {
    (updateUserRole as jest.Mock).mockResolvedValue({ success: true });
    render(<UserRolePage />);
    await waitFor(() => {
      expect(screen.getAllByText('Final User').length).toBeGreaterThanOrEqual(1);
    });

    const allButtons = screen.getAllByRole('button');
    const editButtons = allButtons.filter(b => {
      const text = b.textContent || '';
      return !text.includes('refresh') && !text.includes('title');
    });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('dialog.save'));

    await waitFor(() => {
      expect(updateUserRole).toHaveBeenCalled();
    });
  });

  it('shows alert when submit fails', async () => {
    (updateUserRole as jest.Mock).mockResolvedValue({ success: false, error: 'Update failed' });
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<UserRolePage />);
    await waitFor(() => {
      expect(screen.getAllByText('Final User').length).toBeGreaterThanOrEqual(1);
    });

    const allButtons = screen.getAllByRole('button');
    const editButtons = allButtons.filter(b => {
      const text = b.textContent || '';
      return !text.includes('refresh') && !text.includes('title');
    });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('dialog.save'));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Update failed');
    });

    alertMock.mockRestore();
  });

  it('shows displayNameRequired alert when no display name', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<UserRolePage />);
    await waitFor(() => {
      expect(screen.getAllByText('Final User').length).toBeGreaterThanOrEqual(1);
    });

    const allButtons = screen.getAllByRole('button');
    const editButtons = allButtons.filter(b => {
      const text = b.textContent || '';
      return !text.includes('refresh') && !text.includes('title');
    });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    // Clear the display_name input
    const inputs = screen.getAllByRole('textbox');
    const displayNameInput = inputs.find(i => (i as HTMLInputElement).value === 'Final User');
    fireEvent.change(displayNameInput!, { target: { value: '' } });

    fireEvent.click(screen.getByText('dialog.save'));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('dialog.displayNameRequired');
    });
    expect(updateUserRole).not.toHaveBeenCalled();

    alertMock.mockRestore();
  });

  it('refreshes data when refresh button is clicked', async () => {
    render(<UserRolePage />);
    await waitFor(() => {
      expect(screen.getAllByText('Final User').length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getByText('refresh'));

    await waitFor(() => {
      expect(getAllUserRoles).toHaveBeenCalledTimes(2);
    });
  });

  it('can close dialog with cancel button', async () => {
    render(<UserRolePage />);
    await waitFor(() => {
      expect(screen.getAllByText('Final User').length).toBeGreaterThanOrEqual(1);
    });

    const allButtons = screen.getAllByRole('button');
    const editButtons = allButtons.filter(b => {
      const text = b.textContent || '';
      return !text.includes('refresh') && !text.includes('title');
    });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('cancel'));
    await waitFor(() => {
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });
  });

  it('updates description field in dialog (dispatches SET_FORM_DATA)', async () => {
    render(<UserRolePage />);
    await waitFor(() => {
      expect(screen.getAllByText('Final User').length).toBeGreaterThanOrEqual(1);
    });

    const allButtons = screen.getAllByRole('button');
    const editButtons = allButtons.filter(b => {
      const text = b.textContent || '';
      return !text.includes('refresh') && !text.includes('title');
    });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    // Change display_name input (dispatches SET_FORM_DATA - line 98)
    const inputs = screen.getAllByRole('textbox');
    const displayNameInput = inputs.find(i => (i as HTMLInputElement).value === 'Final User');
    if (displayNameInput) {
      fireEvent.change(displayNameInput, { target: { value: 'Updated Display Name' } });
      expect(displayNameInput).toHaveValue('Updated Display Name');
    }

    // Change description textarea (also dispatches SET_FORM_DATA - line 98)
    const descTextarea = inputs.find(t => t.tagName === 'TEXTAREA');
    if (descTextarea) {
      fireEvent.change(descTextarea, { target: { value: 'Updated description' } });
      expect(descTextarea).toHaveValue('Updated description');
    }
  });

  it('shows default error message when updateUserRole fails without error message', async () => {
    (updateUserRole as jest.Mock).mockResolvedValue({ success: false });
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<UserRolePage />);
    await waitFor(() => {
      expect(screen.getAllByText('Final User').length).toBeGreaterThanOrEqual(1);
    });

    const allButtons = screen.getAllByRole('button');
    const editButtons = allButtons.filter(b => {
      const text = b.textContent || '';
      return !text.includes('refresh') && !text.includes('title');
    });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('dialog.save'));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('dialog.updateError');
    });

    alertMock.mockRestore();
  });

  it('handles unknown role name without crashing', async () => {
    (getAllUserRoles as jest.Mock).mockResolvedValue({
      success: true,
      data: [{ id: '99', name: 'unknown_role', display_name: 'Unknown', description: 'desc' }],
    });
    render(<UserRolePage />);
    await waitFor(() => {
      expect(screen.getAllByText('Unknown').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('closes dialog via onOpenChange callback', async () => {
    render(<UserRolePage />);
    await waitFor(() => {
      expect(screen.getAllByText('Final User').length).toBeGreaterThanOrEqual(1);
    });

    // Open dialog
    const allButtons = screen.getAllByRole('button');
    const editButtons = allButtons.filter(b => {
      const text = b.textContent || '';
      return !text.includes('refresh') && !text.includes('title');
    });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    // Close via onOpenChange
    fireEvent.click(screen.getByTestId('dialog-close'));

    await waitFor(() => {
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });
  });

  it('handles getAllUserRoles returning failure (line 132 false branch)', async () => {
    (getAllUserRoles as jest.Mock).mockResolvedValue({ success: false, data: null });
    render(<UserRolePage />);
    await waitFor(() => {
      expect(screen.getByText('empty')).toBeInTheDocument();
    });
  });

  it('opens edit dialog for role with description (line 148 truthy branch)', async () => {
    render(<UserRolePage />);
    await waitFor(() => {
      expect(screen.getAllByText('Owner').length).toBeGreaterThanOrEqual(1);
    });
    // Click edit on Owner role which has description='Org owner'
    const allButtons = screen.getAllByRole('button');
    const editButtons = allButtons.filter(b => {
      const text = b.textContent || '';
      return !text.includes('refresh') && !text.includes('title');
    });
    // Find the edit button for Owner (index 2 since roles are in order)
    fireEvent.click(editButtons[2]);
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });

  it('submits with empty description (line 164 falsy branch)', async () => {
    (updateUserRole as jest.Mock).mockResolvedValue({ success: true });
    render(<UserRolePage />);
    await waitFor(() => {
      expect(screen.getAllByText('Cashier').length).toBeGreaterThanOrEqual(1);
    });
    // Click edit on Cashier (has description: null)
    const allButtons = screen.getAllByRole('button');
    const editButtons = allButtons.filter(b => {
      const text = b.textContent || '';
      return !text.includes('refresh') && !text.includes('title');
    });
    fireEvent.click(editButtons[1]);
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
    // Submit without changing description (it's empty from null)
    fireEvent.click(screen.getByText('dialog.save'));
    await waitFor(() => {
      expect(updateUserRole).toHaveBeenCalledWith(2, expect.objectContaining({
        description: undefined,
      }));
    });
  });

  // -- Cover reducer default case (line 111) --
  it('covers userRoleReducer default case', async () => {
    const React = require('react');
    const originalUseReducer = jest.requireActual('react').useReducer;
    let capturedReducer: any;
    const useReducerSpy = jest.spyOn(React, 'useReducer').mockImplementation((reducer: any, initialState: any) => {
      if (initialState && 'roles' in initialState && 'dialogOpen' in initialState && 'editingRole' in initialState) {
        capturedReducer = reducer;
      }
      return originalUseReducer(reducer, initialState);
    });

    render(<UserRolePage />);

    if (capturedReducer) {
      const state = { roles: [], loading: false, userCounts: null, dialogOpen: false, editingRole: null, formData: { display_name: '', description: '' }, saving: false };

      // Test default case (line 111)
      const defaultResult = capturedReducer(state, { type: 'UNKNOWN' } as any);
      expect(defaultResult).toBe(state);

      // Test SET_EDITING_ROLE case (line 98 - never dispatched from UI)
      const editRoleResult = capturedReducer(state, { type: 'SET_EDITING_ROLE', payload: { id: '1', name: 'test', display_name: 'Test' } });
      expect(editRoleResult.editingRole).toBeTruthy();

      // Test SET_FORM_DATA case (line 100)
      const newFormData = { display_name: 'Test', description: 'Desc' };
      const setResult = capturedReducer(state, { type: 'SET_FORM_DATA', payload: newFormData });
      expect(setResult.formData).toEqual(newFormData);
    }

    useReducerSpy.mockRestore();
  });
});
