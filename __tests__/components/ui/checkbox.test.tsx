import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Checkbox } from '@/components/ui/checkbox';

describe('Checkbox', () => {
  it('toggles on click and reports the new state', async () => {
    const onCheckedChange = jest.fn();
    render(<Checkbox aria-label="Acepto" onCheckedChange={onCheckedChange} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Acepto' });
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');

    await userEvent.click(checkbox);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });

  it('shows the check indicator only once checked', () => {
    const { container, rerender } = render(<Checkbox aria-label="Acepto" checked={false} />);
    expect(container.querySelector('[data-slot="checkbox-indicator"]')).not.toBeInTheDocument();

    rerender(<Checkbox aria-label="Acepto" checked />);
    expect(container.querySelector('[data-slot="checkbox-indicator"]')).toBeInTheDocument();
  });

  it('stays inert while disabled', async () => {
    const onCheckedChange = jest.fn();
    render(<Checkbox aria-label="Acepto" disabled onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Acepto' }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('merges a custom className', () => {
    render(<Checkbox aria-label="Acepto" className="custom" />);
    expect(screen.getByRole('checkbox', { name: 'Acepto' })).toHaveClass('custom', 'size-4');
  });
});
