import { notFound } from 'next/navigation';
import { render, screen } from '@testing-library/react';

import EditAppUserPage from '@/app/dashboard/app_user/edit/[id]/page';

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => Promise.resolve((key: string) => key)),
}));
jest.mock('@/components/dashboard/app_user/app_user-form', () => function Mock(props: {
  branches?: { id: string; name: string }[];
}) {
  return <div data-testid="form">{JSON.stringify(props.branches)}</div>;
});
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// La página hace dos consultas sobre el mismo cliente: el app_user (single) y
// las sucursales de su organización (order).
let userResult: { data: unknown; error: unknown } = {
  data: { id: '1', first_name: 'Test', organization_id: 3 },
  error: null,
};
let branchResult: { data: unknown; error?: unknown } = { data: [{ id: 9, name: 'Centro' }] };

const single = jest.fn(() => Promise.resolve(userResult));
const order = jest.fn(() => Promise.resolve(branchResult));
const eq = jest.fn(() => ({ single, order, eq }));
const select = jest.fn(() => ({ eq }));
const from = jest.fn(() => ({ select }));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ from: (...a: unknown[]) => from(...a) })),
}));

describe('EditAppUserPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userResult = { data: { id: '1', first_name: 'Test', organization_id: 3 }, error: null };
    branchResult = { data: [{ id: 9, name: 'Centro' }] };
  });

  it('le pasa al form las sucursales activas de la organización del usuario', async () => {
    render(await EditAppUserPage({ params: Promise.resolve({ id: '1' }) }));
    expect(screen.getByTestId('form')).toHaveTextContent('[{"id":"9","name":"Centro"}]');
    expect(from).toHaveBeenCalledWith('branch');
    expect(eq).toHaveBeenCalledWith('organization_id', 3);
    expect(eq).toHaveBeenCalledWith('active', true);
  });

  it('sobrevive a un select de sucursales vacío', async () => {
    branchResult = { data: null };
    render(await EditAppUserPage({ params: Promise.resolve({ id: '1' }) }));
    expect(screen.getByTestId('form')).toHaveTextContent('[]');
  });

  it('muestra el error cuando falla la consulta de sucursales', async () => {
    branchResult = { data: null, error: { message: 'fail' } };
    render(await EditAppUserPage({ params: Promise.resolve({ id: '1' }) }));
    expect(screen.queryByTestId('form')).toBeNull();
    expect(screen.getByText('fetchError')).toBeInTheDocument();
  });

  it('llama a notFound cuando el usuario no existe', async () => {
    userResult = { data: null, error: null };
    await EditAppUserPage({ params: Promise.resolve({ id: '999' }) });
    expect(notFound).toHaveBeenCalled();
  });

  it('muestra el error cuando falla la consulta', async () => {
    userResult = { data: null, error: { message: 'fail' } };
    const result = await EditAppUserPage({ params: Promise.resolve({ id: '999' }) });
    expect(result).toBeTruthy();
    expect(from).toHaveBeenCalledTimes(1);
  });
});
