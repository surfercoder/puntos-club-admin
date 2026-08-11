jest.mock('@/actions/dashboard/usage/actions', () => ({ getAllPlanLimitsAction: jest.fn() }));

// The counter and limit banner interpolate values, so this suite needs a
// translator that renders them rather than echoing the key alone.
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    const t = (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${Object.values(values).join(',')}` : key;
    t.rich = (key: string) => key;
    t.raw = () => ({});
    return t;
  }),
  useLocale: jest.fn(() => 'es'),
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { getAllPlanLimitsAction } from '@/actions/dashboard/usage/actions';
import { Step4Products } from '@/components/onboarding/steps/step-4-products';

const PLAN_LIMITS = {
  trial: { redeemable_products: 2 },
  advance: { redeemable_products: 10 },
  pro: { redeemable_products: 30 },
} as never;

const renderStep = async (props: Partial<React.ComponentProps<typeof Step4Products>> = {}) => {
  const onNext = jest.fn();
  const onBack = jest.fn();
  const onAutoSave = jest.fn();
  render(<Step4Products onAutoSave={onAutoSave} onBack={onBack} onNext={onNext} {...props} />);
  await screen.findByText('categoryName');
  return { onNext, onBack, onAutoSave };
};

const categoryInput = () => screen.getAllByLabelText('categoryName')[0];
const rewardNameInputs = () => screen.getAllByLabelText('rewardName');

const fillFirstReward = (name = 'Café gratis') => {
  fireEvent.change(categoryInput(), { target: { value: 'Bebidas' } });
  fireEvent.change(rewardNameInputs()[0], { target: { value: name } });
};

const submit = () => fireEvent.submit(document.querySelector('form') as HTMLFormElement);

describe('Step4Products', () => {
  beforeEach(() => {
    jest.mocked(getAllPlanLimitsAction).mockResolvedValue(PLAN_LIMITS);
  });

  it('shows a spinner until the plan limits arrive', async () => {
    let finish: (r: unknown) => void = () => {};
    jest.mocked(getAllPlanLimitsAction).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<Step4Products onBack={jest.fn()} onNext={jest.fn()} />);

    expect(screen.queryByText('categoryName')).not.toBeInTheDocument();

    finish(PLAN_LIMITS);
    expect(await screen.findByText('categoryName')).toBeInTheDocument();
  });

  it('stays on the spinner when the limits cannot be loaded', async () => {
    jest.mocked(getAllPlanLimitsAction).mockResolvedValue(null as never);
    render(<Step4Products onBack={jest.fn()} onNext={jest.fn()} />);

    await waitFor(() => expect(getAllPlanLimitsAction).toHaveBeenCalled());
    expect(screen.queryByText('categoryName')).not.toBeInTheDocument();
  });

  it('starts with one empty category holding one empty reward', async () => {
    await renderStep();

    expect(screen.getAllByLabelText('categoryName')).toHaveLength(1);
    expect(rewardNameInputs()).toHaveLength(1);
  });

  it('restores a previously saved catalog', async () => {
    await renderStep({
      initialData: {
        categories: [
          {
            name: 'Bebidas',
            products: [
              { name: 'Café', description: 'Rico', required_points: 100, quantity: 5 },
              { name: 'Té', required_points: 50, quantity: 2 },
            ],
          },
        ],
      } as never,
    });

    expect(categoryInput()).toHaveValue('Bebidas');
    expect(rewardNameInputs()[0]).toHaveValue('Café');
    expect(rewardNameInputs()[1]).toHaveValue('Té');
  });

  it('adds and removes categories, keeping at least one', async () => {
    await renderStep();

    fireEvent.click(screen.getByRole('button', { name: /addCategory/ }));
    expect(screen.getAllByLabelText('categoryName')).toHaveLength(2);

    fireEvent.click(screen.getAllByRole('button', { name: /^delete categoryName/ })[0]);
    expect(screen.getAllByLabelText('categoryName')).toHaveLength(1);

    // the last category has no delete button at all
    expect(screen.queryAllByRole('button', { name: /^delete categoryName/ })).toHaveLength(0);
  });

  it('adds and removes rewards, keeping at least one per category', async () => {
    await renderStep();

    fireEvent.click(screen.getByRole('button', { name: /addReward/ }));
    expect(rewardNameInputs()).toHaveLength(2);

    fireEvent.click(screen.getAllByRole('button', { name: 'delete' })[0]);
    expect(rewardNameInputs()).toHaveLength(1);

    // the last reward has no delete button
    expect(screen.queryAllByRole('button', { name: 'delete' })).toHaveLength(0);
  });

  it('counts only named rewards towards the plan limit', async () => {
    await renderStep({ selectedPlan: 'advance' });

    expect(screen.getByText('productCount:0,10')).toBeInTheDocument();

    fillFirstReward();
    expect(screen.getByText('productCount:1,10')).toBeInTheDocument();
  });

  it('falls back to the trial limits for an unknown plan', async () => {
    await renderStep({ selectedPlan: 'inventado' });
    expect(screen.getByText('productCount:0,2')).toBeInTheDocument();
  });

  it('blocks adding more once the plan limit is reached', async () => {
    await renderStep({ selectedPlan: 'trial' });

    fillFirstReward();
    fireEvent.click(screen.getByRole('button', { name: /addReward/ }));
    fireEvent.change(rewardNameInputs()[1], { target: { value: 'Té' } });

    expect(screen.getByText(/limitReached/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /addCategory/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /addReward/ })).toBeDisabled();
  });

  it('submits the filled catalog, trimming and defaulting the numbers', async () => {
    const { onNext } = await renderStep();

    fireEvent.change(categoryInput(), { target: { value: '  Bebidas  ' } });
    fireEvent.change(rewardNameInputs()[0], { target: { value: '  Café  ' } });

    submit();

    expect(onNext).toHaveBeenCalledWith({
      categories: [
        {
          name: 'Bebidas',
          products: [{ name: 'Café', description: undefined, required_points: 100, quantity: 0 }],
        },
      ],
    });
  });

  it('carries the points and stock the user typed', async () => {
    const { onNext } = await renderStep();

    fillFirstReward();
    fireEvent.change(screen.getByLabelText('pointsRequired'), { target: { value: '250' } });
    fireEvent.change(screen.getByLabelText('initialStock'), { target: { value: '7' } });

    submit();

    expect(onNext.mock.calls[0][0].categories[0].products[0]).toMatchObject({
      required_points: 250,
      quantity: 7,
    });
  });

  it.each(['pointsRequired', 'initialStock'])('lets %s be cleared back to empty', async (label) => {
    await renderStep();

    const field = screen.getByLabelText(label);
    fireEvent.change(field, { target: { value: '250' } });
    expect(field).toHaveValue(250);

    fireEvent.change(field, { target: { value: '' } });
    expect(field).toHaveValue(null);
  });

  it('drops rewards and categories left unnamed', async () => {
    const { onNext } = await renderStep();

    fillFirstReward();
    fireEvent.click(screen.getByRole('button', { name: /addReward/ }));
    fireEvent.click(screen.getByRole('button', { name: /addCategory/ }));

    submit();

    expect(onNext.mock.calls[0][0].categories).toHaveLength(1);
    expect(onNext.mock.calls[0][0].categories[0].products).toHaveLength(1);
  });

  it('refuses to submit a catalog with no named category', async () => {
    const { onNext } = await renderStep();

    fireEvent.change(rewardNameInputs()[0], { target: { value: 'Café' } });
    submit();

    expect(toast.error).toHaveBeenCalledWith('validationError');
    expect(onNext).not.toHaveBeenCalled();
  });

  it('refuses to submit a category with no named reward', async () => {
    const { onNext } = await renderStep();

    fireEvent.change(categoryInput(), { target: { value: 'Bebidas' } });
    submit();

    expect(toast.error).toHaveBeenCalledWith('validationError');
    expect(onNext).not.toHaveBeenCalled();
  });

  it('skips the step entirely', async () => {
    const { onNext } = await renderStep();

    fireEvent.click(screen.getByRole('button', { name: /skip/ }));

    expect(onNext).toHaveBeenCalledWith(null);
  });

  it('autosaves the draft when going back', async () => {
    const { onBack, onAutoSave } = await renderStep();

    fillFirstReward();
    fireEvent.click(screen.getByRole('button', { name: /back/ }));

    expect(onAutoSave).toHaveBeenCalledWith({
      categories: [
        {
          name: 'Bebidas',
          products: [{ name: 'Café gratis', description: undefined, required_points: 100, quantity: 0 }],
        },
      ],
    });
    expect(onBack).toHaveBeenCalled();
  });

  it('keeps a named category whose rewards are still unnamed in the draft', async () => {
    const { onAutoSave } = await renderStep();

    fireEvent.change(categoryInput(), { target: { value: 'Bebidas' } });
    fireEvent.click(screen.getByRole('button', { name: /back/ }));

    expect(onAutoSave).toHaveBeenCalledWith({ categories: [{ name: 'Bebidas', products: [] }] });
  });

  it('autosaves nothing when the form is untouched', async () => {
    const { onBack, onAutoSave } = await renderStep();

    fireEvent.click(screen.getByRole('button', { name: /back/ }));

    expect(onAutoSave).not.toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
  });

  it('goes back without an autosave handler', async () => {
    const onBack = jest.fn();
    render(<Step4Products onBack={onBack} onNext={jest.fn()} />);
    await screen.findByText('categoryName');

    fireEvent.click(screen.getByRole('button', { name: /back/ }));
    expect(onBack).toHaveBeenCalled();
  });

  it('adds and removes rewards only in the targeted category', async () => {
    await renderStep({ selectedPlan: 'pro' });

    fireEvent.click(screen.getByRole('button', { name: /addCategory/ }));
    expect(rewardNameInputs()).toHaveLength(2);

    // add to the second category only
    fireEvent.click(screen.getAllByRole('button', { name: /addReward/ })[1]);
    expect(rewardNameInputs()).toHaveLength(3);

    // and remove from the second category only
    fireEvent.click(screen.getAllByRole('button', { name: 'delete' })[0]);
    expect(rewardNameInputs()).toHaveLength(2);
  });

  it('edits only the targeted category and reward', async () => {
    await renderStep();

    fireEvent.click(screen.getByRole('button', { name: /addCategory/ }));
    fireEvent.change(screen.getAllByLabelText('categoryName')[1], { target: { value: 'Comidas' } });

    expect(screen.getAllByLabelText('categoryName')[0]).toHaveValue('');
    expect(screen.getAllByLabelText('categoryName')[1]).toHaveValue('Comidas');

    fireEvent.change(rewardNameInputs()[1], { target: { value: 'Sandwich' } });
    expect(rewardNameInputs()[0]).toHaveValue('');
    expect(rewardNameInputs()[1]).toHaveValue('Sandwich');
  });
});
