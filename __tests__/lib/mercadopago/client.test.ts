jest.mock('mercadopago', () =>
  jest.fn(function MercadoPago(this: Record<string, unknown>, opts: unknown) {
    this.opts = opts;
  }),
);

/**
 * The client memoizes across calls, so each case reloads the module. The mercadopago
 * mock must be re-required after the reset — the registry hands out a fresh instance
 * and the pre-reset reference stops recording calls.
 */
const load = (accessToken: string | undefined) => {
  jest.resetModules();
  if (accessToken === undefined) {
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;
  } else {
    process.env.MERCADOPAGO_ACCESS_TOKEN = accessToken;
  }
  return {
    ...require('@/lib/mercadopago/client'),
    MercadoPago: require('mercadopago') as jest.Mock,
  };
};

describe('lib/mercadopago/client', () => {
  const originalToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  afterAll(() => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = originalToken;
  });

  it('builds the client from the access token', () => {
    const { getMercadoPagoClient, MercadoPago } = load('TEST-token');
    expect(getMercadoPagoClient()).toBeDefined();
    expect(MercadoPago).toHaveBeenCalledWith({ accessToken: 'TEST-token' });
  });

  it('memoizes the client across calls', () => {
    const { getMercadoPagoClient, MercadoPago } = load('TEST-token');
    expect(getMercadoPagoClient()).toBe(getMercadoPagoClient());
    expect(MercadoPago).toHaveBeenCalledTimes(1);
  });

  it('throws instead of building an unauthenticated client when the token is missing', () => {
    const { getMercadoPagoClient, MercadoPago } = load(undefined);
    expect(() => getMercadoPagoClient()).toThrow('MERCADOPAGO_ACCESS_TOKEN env var is not set');
    expect(MercadoPago).not.toHaveBeenCalled();
  });

  it('exposes the amount and env var name for each purchasable plan', () => {
    const { PLAN_CONFIG } = load('TEST-token');
    expect(PLAN_CONFIG.advance).toEqual({
      id: 'advance',
      name: 'Plan Advance',
      mpPlanIdEnvVar: 'MP_PLAN_ID_ADVANCE',
      amount: 50,
      currency: 'ARS',
    });
    expect(PLAN_CONFIG.pro).toEqual({
      id: 'pro',
      name: 'Plan Pro',
      mpPlanIdEnvVar: 'MP_PLAN_ID_PRO',
      amount: 89,
      currency: 'ARS',
    });
  });
});
