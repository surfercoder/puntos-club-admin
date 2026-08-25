import React from 'react';
import { render, screen } from '@testing-library/react';

import { ClubiSidebar } from '@/components/onboarding/clubi-sidebar';

describe('ClubiSidebar', () => {
  it('greets and explains the current step', () => {
    render(<ClubiSidebar step={1} />);
    expect(screen.getByText('greeting')).toBeInTheDocument();
    expect(screen.getByText('messages.step1')).toBeInTheDocument();
    expect(screen.getByText('safeTitle')).toBeInTheDocument();
  });

  it('adds a tip on the steps that have one', () => {
    render(<ClubiSidebar step={3} />);
    expect(screen.getByText('tipTitle')).toBeInTheDocument();
    expect(screen.getByText('tips.step3')).toBeInTheDocument();
  });

  it('skips the tip on the final step', () => {
    render(<ClubiSidebar step={6} />);
    expect(screen.queryByText('tipTitle')).not.toBeInTheDocument();
  });
});
