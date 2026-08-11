import { render, screen } from '@testing-library/react';

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar';

describe('Avatar', () => {
  it('defaults to the medium size', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>CS</AvatarFallback>
      </Avatar>,
    );
    expect(container.querySelector('[data-slot="avatar"]')).toHaveAttribute('data-size', 'default');
    expect(screen.getByText('CS')).toBeInTheDocument();
  });

  it.each(['sm', 'lg'] as const)('honors the %s size', (size) => {
    const { container } = render(
      <Avatar size={size}>
        <AvatarFallback>CS</AvatarFallback>
      </Avatar>,
    );
    expect(container.querySelector('[data-slot="avatar"]')).toHaveAttribute('data-size', size);
  });

  it('renders the image, badge and group parts with merged classNames', () => {
    const { container } = render(
      <AvatarGroup className="custom-group">
        <Avatar className="custom-avatar">
          <AvatarImage alt="Carlos" className="custom-image" src="/carlos.png" />
          <AvatarFallback className="custom-fallback">CS</AvatarFallback>
          <AvatarBadge className="custom-badge" />
        </Avatar>
        <AvatarGroupCount className="custom-count">+3</AvatarGroupCount>
      </AvatarGroup>,
    );

    expect(container.querySelector('[data-slot="avatar-group"]')).toHaveClass('custom-group');
    expect(container.querySelector('[data-slot="avatar"]')).toHaveClass('custom-avatar', 'rounded-full');
    expect(container.querySelector('[data-slot="avatar-fallback"]')).toHaveClass('custom-fallback');
    expect(container.querySelector('[data-slot="avatar-badge"]')).toHaveClass('custom-badge');
    expect(container.querySelector('[data-slot="avatar-group-count"]')).toHaveClass('custom-count');
    expect(screen.getByText('+3')).toBeInTheDocument();
  });
});
