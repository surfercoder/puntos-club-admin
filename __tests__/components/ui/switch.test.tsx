import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Switch } from '@/components/ui/switch';

describe('Switch', () => {
  it('toggles on click and reports the new state', async () => {
    const onCheckedChange = jest.fn();
    render(<Switch aria-label="Notificaciones" onCheckedChange={onCheckedChange} />);

    const toggle = screen.getByRole('switch', { name: 'Notificaciones' });
    expect(toggle).toHaveAttribute('data-state', 'unchecked');

    await userEvent.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute('data-state', 'checked');
  });

  it('defaults to the medium size', () => {
    render(<Switch aria-label="Notificaciones" />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-size', 'default');
  });

  it('honors the sm size', () => {
    render(<Switch aria-label="Notificaciones" size="sm" />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-size', 'sm');
  });

  it('renders a thumb and merges a custom className', () => {
    const { container } = render(<Switch aria-label="Notificaciones" className="custom" />);
    expect(screen.getByRole('switch')).toHaveClass('custom', 'rounded-full');
    expect(container.querySelector('[data-slot="switch-thumb"]')).toBeInTheDocument();
  });

  it('stays inert while disabled', async () => {
    const onCheckedChange = jest.fn();
    render(<Switch aria-label="Notificaciones" disabled onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole('switch'));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
