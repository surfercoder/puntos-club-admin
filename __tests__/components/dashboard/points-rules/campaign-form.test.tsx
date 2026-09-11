import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { CampaignForm } from '@/components/dashboard/points-rules/campaign-form';
import {
  EMPTY_CAMPAIGN,
  type CampaignFormValues,
} from '@/components/dashboard/points-rules/campaign-values';

const createPointsRule = jest.fn();
const updatePointsRule = jest.fn();
const push = jest.fn();
const refresh = jest.fn();
const toastSuccess = jest.fn();
const toastError = jest.fn();

jest.mock('@/actions/dashboard/points-rules/actions', () => ({
  createPointsRule: (...args: unknown[]) => createPointsRule(...args),
  updatePointsRule: (...args: unknown[]) => updatePointsRule(...args),
}));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));
jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      checked={checked}
      onChange={(event) => onCheckedChange(event.target.checked)}
      type="checkbox"
      {...props}
    />
  ),
}));
jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      checked={Boolean(checked)}
      onChange={() => onCheckedChange?.(!checked)}
      type="checkbox"
      {...props}
    />
  ),
}));
jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
}));

const branches = [
  { id: '1', name: 'Casa Central' },
  { id: '2', name: 'Sucursal Belgrano' },
];

const filled: CampaignFormValues = {
  ...EMPTY_CAMPAIGN,
  name: 'Doble Puntos',
  description: 'Sumá el doble los fines de semana',
  startDate: '2026-05-25',
  endDate: '2026-08-25',
  points: '200',
  branchIds: ['1'],
};

const setup = (initial = filled, campaignId?: number) =>
  render(<CampaignForm branches={branches} campaignId={campaignId} initial={initial} />);

const field = (label: RegExp) => screen.getByLabelText(label);
const byId = (id: string) => document.querySelector(`#${id}`) as HTMLElement;
const submit = () => fireEvent.click(screen.getByRole('button', { name: /submit/ }));
const lastInput = () => createPointsRule.mock.calls[0][0];

const okFetch = () =>
  jest
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { id: 'n1' } }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

describe('CampaignForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createPointsRule.mockResolvedValue({ success: true });
    updatePointsRule.mockResolvedValue({ success: true });
    global.fetch = okFetch() as unknown as typeof fetch;
  });

  it('creates a campaign with flat points on the selected branch', async () => {
    setup();
    submit();

    await waitFor(() => expect(createPointsRule).toHaveBeenCalled());
    expect(lastInput()).toMatchObject({
      name: 'Doble Puntos',
      rule_type: 'fixed_per_sale',
      config: { points_per_sale: 200 },
      start_date: '2026-05-25',
      end_date: '2026-08-25',
      branch_ids: [1],
      days_of_week: undefined,
      time_start: undefined,
    });
    expect(toastSuccess).toHaveBeenCalledWith('created');
    expect(push).toHaveBeenCalledWith('/dashboard/points-rules');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('stores "every branch" as no restriction when all are ticked', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /scope.selectAll/ }));
    submit();

    await waitFor(() => expect(createPointsRule).toHaveBeenCalled());
    expect(lastInput().branch_ids).toEqual([]);
  });

  it('switches to a percentage of the sale', async () => {
    setup();
    fireEvent.click(screen.getByDisplayValue('percentage'));
    fireEvent.change(byId('campaign-percentage'), { target: { value: '10' } });
    submit();

    await waitFor(() => expect(createPointsRule).toHaveBeenCalled());
    expect(lastInput()).toMatchObject({
      rule_type: 'percentage',
      config: { percentage: 10 },
    });
  });

  it('sends the chosen week days and time range', async () => {
    setup();
    fireEvent.click(screen.getByRole('checkbox', { name: 'validity.repeat' }));
    fireEvent.click(screen.getByRole('button', { name: 'daysShort.6' }));
    fireEvent.click(screen.getByRole('button', { name: 'daysShort.0' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'validity.schedule' }));
    fireEvent.change(field(/validity\.startTime/), { target: { value: '10:00' } });
    fireEvent.change(field(/validity\.endTime/), { target: { value: '18:00' } });
    submit();

    await waitFor(() => expect(createPointsRule).toHaveBeenCalled());
    expect(lastInput()).toMatchObject({
      days_of_week: [0, 6],
      time_start: '10:00',
      time_end: '18:00',
    });
  });

  it('defaults an empty time range to the whole day', async () => {
    setup();
    fireEvent.click(screen.getByRole('checkbox', { name: 'validity.schedule' }));
    submit();

    await waitFor(() => expect(createPointsRule).toHaveBeenCalled());
    expect(lastInput()).toMatchObject({ time_start: '00:00', time_end: '23:59' });
  });

  it('unticks a day that was already chosen', () => {
    setup({ ...filled, daysOfWeek: [6] });
    fireEvent.click(screen.getByRole('button', { name: 'daysShort.6' }));
    submit();

    expect(toastError).toHaveBeenCalledWith('errors.days');
    expect(createPointsRule).not.toHaveBeenCalled();
  });

  it('creates a campaign typed from scratch', async () => {
    setup(EMPTY_CAMPAIGN);
    fireEvent.change(byId('campaign-name'), { target: { value: 'Semana Loca' } });
    fireEvent.change(byId('campaign-description'), { target: { value: 'Más puntos' } });
    fireEvent.change(byId('campaign-start'), { target: { value: '2026-05-25' } });
    fireEvent.change(byId('campaign-end'), { target: { value: '2026-08-25' } });
    fireEvent.change(byId('campaign-fixed_per_sale'), { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: /scope.selectAll/ }));
    submit();

    await waitFor(() => expect(createPointsRule).toHaveBeenCalled());
    expect(lastInput()).toMatchObject({
      name: 'Semana Loca',
      description: 'Más puntos',
      start_date: '2026-05-25',
      end_date: '2026-08-25',
    });
  });

  it('ticks another branch and retypes the points', async () => {
    // Tres sucursales: marcar una segunda deja una selección parcial, no "todas".
    render(
      <CampaignForm
        branches={[...branches, { id: '3', name: 'Sucursal Palermo' }]}
        initial={filled}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sucursal Belgrano' }));
    fireEvent.change(byId('campaign-fixed_per_sale'), { target: { value: '350' } });
    submit();

    await waitFor(() => expect(createPointsRule).toHaveBeenCalled());
    expect(lastInput()).toMatchObject({
      branch_ids: [1, 2],
      config: { points_per_sale: 350 },
    });
  });

  it('unticks a branch that was already chosen', () => {
    setup();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Casa Central' }));
    submit();
    expect(toastError).toHaveBeenCalledWith('errors.branches');
  });

  it('filters the branch list and reports when nothing matches', () => {
    setup();
    fireEvent.change(screen.getByLabelText('scope.search'), { target: { value: 'belgra' } });
    expect(screen.queryByText('Casa Central')).not.toBeInTheDocument();
    expect(screen.getByText('Sucursal Belgrano')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('scope.search'), { target: { value: 'zzz' } });
    expect(screen.getByText('scope.noResults')).toBeInTheDocument();
  });

  it('clears the selection', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /scope.clear/ }));
    submit();
    expect(toastError).toHaveBeenCalledWith('errors.branches');
  });

  it('appends emojis to the name and to the description', () => {
    setup({ ...filled, name: 'x'.repeat(60) });
    const [nameEmoji, descriptionEmoji] = screen.getAllByRole('button', { name: 'addEmoji' });
    const emoji = (trigger: HTMLElement) =>
      trigger.closest('div')!.parentElement!.querySelectorAll('button')[1];

    // El nombre ya está en el máximo: el emoji no lo hace crecer.
    fireEvent.click(emoji(nameEmoji));
    expect(byId('campaign-name')).toHaveValue('x'.repeat(60));

    fireEvent.click(emoji(descriptionEmoji));
    expect(byId('campaign-description')).toHaveValue(`${filled.description}⭐`);
  });

  it.each([
    ['errors.basicInfo', { name: '  ' }],
    ['errors.basicInfo', { description: '' }],
    ['errors.dates', { startDate: '' }],
    ['errors.dateOrder', { endDate: '2026-01-01' }],
    ['errors.amount', { points: '0' }],
    ['errors.branches', { branchIds: [] }],
  ])('refuses to save and reports %s', (message, patch) => {
    setup({ ...filled, ...patch });
    submit();
    expect(toastError).toHaveBeenCalledWith(message);
    expect(createPointsRule).not.toHaveBeenCalled();
  });

  it('updates an existing campaign', async () => {
    setup(filled, 42);
    submit();

    await waitFor(() => expect(updatePointsRule).toHaveBeenCalled());
    expect(updatePointsRule.mock.calls[0][0]).toBe(42);
    expect(toastSuccess).toHaveBeenCalledWith('saved');
  });

  it('shows the error the action returned', async () => {
    createPointsRule.mockResolvedValue({ success: false, error: 'db.forbidden' });
    setup();
    submit();

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('db.forbidden'));
    expect(push).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when the action gives none', async () => {
    createPointsRule.mockResolvedValue({ success: false });
    setup();
    submit();

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('errors.save'));
  });

  it('announces the campaign with a push notification', async () => {
    setup();
    fireEvent.click(screen.getByRole('checkbox', { name: 'communication.notify' }));
    submit();

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('created'));
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      '/api/notifications',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      '/api/notifications/send',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('keeps the campaign when the notification cannot be created', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ success: false, error: 'limit' }) }) as never;
    setup();
    fireEvent.click(screen.getByRole('checkbox', { name: 'communication.notify' }));
    submit();

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('limit'));
    expect(toastSuccess).toHaveBeenCalledWith('created');
  });

  it('keeps the campaign when sending the notification fails', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { id: 'n1' } }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ success: true }) }) as never;
    setup();
    fireEvent.click(screen.getByRole('checkbox', { name: 'communication.notify' }));
    submit();

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('created'));
    expect(toastError).toHaveBeenCalledWith('errors.notify');
  });

  it('reports the reason the notification route rejected the push', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({ error: 'notifications.noCredits' }) }) as never;
    setup();
    fireEvent.click(screen.getByRole('checkbox', { name: 'communication.notify' }));
    submit();

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('notifications.noCredits'));
    expect(toastSuccess).toHaveBeenCalledWith('created');
  });

  it('reports a non-Error push failure with the generic message', async () => {
    global.fetch = jest.fn().mockRejectedValue('boom') as never;
    setup();
    fireEvent.click(screen.getByRole('checkbox', { name: 'communication.notify' }));
    submit();

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('errors.notify'));
  });

  it('summarises an empty campaign', () => {
    setup(EMPTY_CAMPAIGN);
    expect(screen.getByText('summary.noName')).toBeInTheDocument();
    expect(screen.getByText('summary.noDates')).toBeInTheDocument();
    expect(screen.getByText('summary.everyDay')).toBeInTheDocument();
    expect(screen.getByText('summary.allDay')).toBeInTheDocument();
    expect(screen.getByText('summary.fixed_per_sale')).toBeInTheDocument();
  });

  it('summarises the days and the time range that were configured', () => {
    setup({ ...filled, daysOfWeek: [0, 6], timeStart: '10:00', timeEnd: '18:00' });
    expect(screen.getByText('days.6, days.0')).toBeInTheDocument();
    expect(screen.getByText('10:00 - 18:00')).toBeInTheDocument();
    expect(screen.getByText('summary.dates')).toBeInTheDocument();
  });
});
