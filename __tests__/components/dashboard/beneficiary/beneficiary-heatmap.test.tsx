import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { BeneficiaryHeatmap } from '@/components/dashboard/beneficiary/beneficiary-heatmap';

const createHeatmapOverlay = jest.fn();
const importLibrary = jest.fn();

jest.mock('@/components/dashboard/beneficiary/heatmap-overlay', () => ({
  createHeatmapOverlay: (...args: unknown[]) => createHeatmapOverlay(...args),
}));

jest.mock('@googlemaps/js-api-loader', () => ({
  importLibrary: (...args: unknown[]) => importLibrary(...args),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div>
      <span data-testid="range">{value}</span>
      <button data-testid="set-range" onClick={() => onValueChange('12')} />
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span />,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

const fitBounds = jest.fn();
const Map = jest.fn(() => ({ fitBounds }));

beforeEach(() => {
  jest.clearAllMocks();
  importLibrary.mockResolvedValue({ Map });
  (globalThis as any).google = {
    maps: {
      LatLngBounds: class {
        extend = jest.fn();
        getCenter = jest.fn(() => ({ lat: 0, lng: 0 }));
      },
    },
  };
});

const recentPoint = {
  latitude: -32.889458,
  longitude: -68.845839,
  registrationDate: new Date().toISOString(),
};

describe('BeneficiaryHeatmap', () => {
  it('shows the empty state when nobody has an address in range', () => {
    render(<BeneficiaryHeatmap points={[]} />);
    expect(screen.getByText('empty')).toBeInTheDocument();
    expect(Map).not.toHaveBeenCalled();
  });

  it('rounds the coordinates before drawing so exact homes are never shown', async () => {
    render(<BeneficiaryHeatmap points={[recentPoint]} />);
    await waitFor(() => expect(createHeatmapOverlay).toHaveBeenCalled());
    expect(createHeatmapOverlay.mock.calls[0][1]).toEqual([{ lat: -32.89, lng: -68.85 }]);
    expect(fitBounds).toHaveBeenCalled();
    expect(screen.queryByText('loading')).not.toBeInTheDocument();
  });

  it('drops points registered before the selected period', async () => {
    const old = { ...recentPoint, registrationDate: '2000-01-01T00:00:00.000Z' };
    render(<BeneficiaryHeatmap points={[old]} />);
    expect(await screen.findByText('empty')).toBeInTheDocument();
  });

  it('re-renders when the period changes', async () => {
    render(<BeneficiaryHeatmap points={[recentPoint]} />);
    await waitFor(() => expect(createHeatmapOverlay).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByTestId('set-range'));
    await waitFor(() => expect(createHeatmapOverlay).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('range')).toHaveTextContent('12');
  });

  it('stops drawing if the panel unmounts while the library loads', async () => {
    let resolveLibrary: (value: unknown) => void = () => {};
    importLibrary.mockReturnValueOnce(new Promise((resolve) => { resolveLibrary = resolve; }));
    const { unmount } = render(<BeneficiaryHeatmap points={[recentPoint]} />);
    unmount();
    resolveLibrary({ Map });
    await waitFor(() => expect(importLibrary).toHaveBeenCalled());
    expect(createHeatmapOverlay).not.toHaveBeenCalled();
  });

  it('surfaces an error when the maps library fails to load', async () => {
    importLibrary.mockRejectedValueOnce(new Error('offline'));
    render(<BeneficiaryHeatmap points={[recentPoint]} />);
    expect(await screen.findByText('error')).toBeInTheDocument();
  });
});
