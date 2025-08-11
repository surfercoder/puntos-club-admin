import { render, screen, fireEvent } from '@testing-library/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../dialog';

describe('Dialog Components', () => {
  describe('Dialog', () => {
    it('should render dialog trigger and content', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
              <DialogDescription>Dialog Description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByText('Open Dialog');
      expect(trigger).toBeInTheDocument();

      fireEvent.click(trigger);

      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
      expect(screen.getByText('Dialog Description')).toBeInTheDocument();
    });

    it('should render dialog with footer', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <button>Cancel</button>
              <button>Save</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  describe('DialogContent', () => {
    it('should apply custom className', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent className="custom-content">
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const content = screen.getByRole('dialog');
      expect(content).toHaveClass('custom-content');
    });

    it('should pass through additional props', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent data-testid="dialog-content">
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const content = screen.getByTestId('dialog-content');
      expect(content).toBeInTheDocument();
    });
  });

  describe('DialogHeader', () => {
    it('should render with default classes', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader data-testid="dialog-header">
              <DialogTitle>Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const header = screen.getByTestId('dialog-header');
      expect(header).toHaveClass('flex flex-col space-y-2 text-center sm:text-left');
    });

    it('should apply custom className', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader className="custom-header" data-testid="dialog-header">
              <DialogTitle>Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const header = screen.getByTestId('dialog-header');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('DialogTitle', () => {
    it('should render with correct classes', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByText('Dialog Title');
      expect(title).toHaveClass('text-lg font-bold');
    });

    it('should apply custom className', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle className="custom-title">Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByText('Dialog Title');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('DialogDescription', () => {
    it('should render with correct classes', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const description = screen.getByText('Dialog Description');
      expect(description).toHaveClass('text-sm text-muted-foreground');
    });

    it('should apply custom className', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogDescription className="custom-description">
              Dialog Description
            </DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const description = screen.getByText('Dialog Description');
      expect(description).toHaveClass('custom-description');
    });
  });

  describe('DialogFooter', () => {
    it('should render with default classes', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogFooter data-testid="dialog-footer">
              <button>Close</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const footer = screen.getByTestId('dialog-footer');
      expect(footer).toHaveClass('flex flex-col-reverse sm:flex-row sm:justify-end gap-2');
    });

    it('should apply custom className', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogFooter className="custom-footer" data-testid="dialog-footer">
              <button>Close</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const footer = screen.getByTestId('dialog-footer');
      expect(footer).toHaveClass('custom-footer');
    });
  });
});