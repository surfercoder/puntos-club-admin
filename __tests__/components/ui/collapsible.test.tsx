import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

describe('Collapsible', () => {
  it('reveals its content when the trigger is activated', async () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Ver detalle</CollapsibleTrigger>
        <CollapsibleContent>Detalle de la compra</CollapsibleContent>
      </Collapsible>,
    );

    expect(screen.queryByText('Detalle de la compra')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ver detalle' }));
    expect(screen.getByText('Detalle de la compra')).toBeInTheDocument();
  });

  it('tags each part with its data-slot', () => {
    const { container } = render(
      <Collapsible open>
        <CollapsibleTrigger>Ver detalle</CollapsibleTrigger>
        <CollapsibleContent>Detalle</CollapsibleContent>
      </Collapsible>,
    );

    expect(container.querySelector('[data-slot="collapsible"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="collapsible-trigger"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="collapsible-content"]')).toBeInTheDocument();
  });
});
