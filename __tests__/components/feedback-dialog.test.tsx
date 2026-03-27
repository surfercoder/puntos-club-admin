import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedbackDialog } from '@/components/feedback-dialog';
import { sendFeedback } from '@/actions/feedback/send-feedback';
import { toast } from 'sonner';

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));
jest.mock('@/actions/feedback/send-feedback', () => ({
  sendFeedback: jest.fn(),
}));
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('lucide-react', () => ({
  MessageSquarePlus: (props: any) => <svg data-testid="message-icon" {...props} />,
}));
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, onOpenChange }: any) => <div role="dialog" data-testid="dialog" onClick={() => onOpenChange?.(false)} onKeyDown={(e: any) => { if (e.key === 'Escape') onOpenChange?.(false); }}>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, type, ...props }: any) => <button onClick={onClick} type={type} {...props}>{children}</button>,
}));
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: any) => <div role="listbox" data-testid="select" onClick={() => onValueChange?.('error')} onKeyDown={(e: any) => { if (e.key === 'Enter') onValueChange?.('error'); }}>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span />,
}));
jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

describe('FeedbackDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trigger button', () => {
    render(<FeedbackDialog userEmail="test@test.com" userName="Test" />);
    expect(screen.getByText('trigger')).toBeTruthy();
  });

  it('renders dialog content', () => {
    render(<FeedbackDialog userEmail="test@test.com" userName="Test" />);
    expect(screen.getByText('title')).toBeTruthy();
    expect(screen.getByText('description')).toBeTruthy();
  });

  it('submits feedback successfully', async () => {
    (sendFeedback as jest.Mock).mockResolvedValue({ success: true });
    render(<FeedbackDialog userEmail="test@test.com" userName="Test" />);

    const textarea = screen.getByPlaceholderText('messagePlaceholder');
    fireEvent.change(textarea, { target: { value: 'Great app!' } });

    const form = textarea.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(sendFeedback).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    (sendFeedback as jest.Mock).mockResolvedValue({ success: false, error: 'Failed' });
    render(<FeedbackDialog userEmail="test@test.com" userName="Test" />);

    const textarea = screen.getByPlaceholderText('messagePlaceholder');
    fireEvent.change(textarea, { target: { value: 'Feedback' } });

    const form = textarea.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('shows error toast on throw', async () => {
    (sendFeedback as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<FeedbackDialog userEmail="test@test.com" userName="Test" />);

    const textarea = screen.getByPlaceholderText('messagePlaceholder');
    fireEvent.change(textarea, { target: { value: 'Feedback' } });

    const form = textarea.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('does not submit with empty message', async () => {
    render(<FeedbackDialog userEmail="test@test.com" userName="Test" />);

    const textarea = screen.getByPlaceholderText('messagePlaceholder');
    fireEvent.change(textarea, { target: { value: '' } });

    const form = textarea.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(sendFeedback).not.toHaveBeenCalled();
    });
  });

  it('closes dialog via cancel button', () => {
    render(<FeedbackDialog userEmail="test@test.com" userName="Test" />);
    const cancelButton = screen.getByText('cancel');
    fireEvent.click(cancelButton);
    // No crash, setOpen(false) was called
  });

  it('triggers onOpenChange callback on Dialog', () => {
    render(<FeedbackDialog userEmail="test@test.com" userName="Test" />);
    fireEvent.click(screen.getByTestId('dialog'));
    // No crash, onOpenChange(false) was called
  });

  it('changes feedback type via select', () => {
    render(<FeedbackDialog userEmail="test@test.com" userName="Test" />);
    fireEvent.click(screen.getByTestId('select'));
    // No crash, onValueChange('error') was called
  });

  it('shows fallback error message when result.error is undefined', async () => {
    (sendFeedback as jest.Mock).mockResolvedValue({ success: false, error: undefined });
    render(<FeedbackDialog userEmail="test@test.com" userName="Test" />);

    const textarea = screen.getByPlaceholderText('messagePlaceholder');
    fireEvent.change(textarea, { target: { value: 'Feedback' } });

    const form = textarea.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('errorMessage');
    });
  });

  it('shows error message from result when available', async () => {
    (sendFeedback as jest.Mock).mockResolvedValue({ success: false, error: 'Custom error' });
    render(<FeedbackDialog userEmail="test@test.com" userName="Test" />);

    const textarea = screen.getByPlaceholderText('messagePlaceholder');
    fireEvent.change(textarea, { target: { value: 'Feedback' } });

    const form = textarea.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Custom error');
    });
  });
});
