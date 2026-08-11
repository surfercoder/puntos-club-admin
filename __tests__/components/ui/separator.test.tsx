import { render } from '@testing-library/react';

import { Separator } from '@/components/ui/separator';

describe('Separator', () => {
  it('is horizontal and decorative by default', () => {
    const { container } = render(<Separator />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    // decorative separators are hidden from the accessibility tree
    expect(separator).toHaveAttribute('role', 'none');
  });

  it('exposes itself to assistive tech when not decorative', () => {
    const { container } = render(<Separator decorative={false} orientation="vertical" />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
    expect(separator).toHaveAttribute('role', 'separator');
  });

  it('merges a custom className', () => {
    const { container } = render(<Separator className="custom" />);
    expect(container.querySelector('[data-slot="separator"]')).toHaveClass('custom', 'shrink-0');
  });
});
