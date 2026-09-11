import es from '@/messages/es.json';
import en from '@/messages/en.json';
import { errorDescriptor, RPC_TOKENS } from '@/lib/errors';

// Una excepcion de la base sin mensaje en messages/*.json llega al usuario como
// la clave cruda ("rpc.purchasePointsSpent"). Es el unico error del mapeo que no
// se nota hasta que un cliente lo ve, porque el token igual matchea.
// La lista sale de RPC_TOKENS y no de una copia: un token nuevo sin traduccion
// tiene que romper este test solo, sin que nadie se acuerde de agregarlo aca.
const RPC_ERRORS = RPC_TOKENS.map(([token]) => token);

const lookup = (dict: Record<string, unknown>, key: string): unknown =>
  key.split('.').reduce<unknown>(
    (node, part) =>
      node && typeof node === 'object'
        ? (node as Record<string, unknown>)[part]
        : undefined,
    dict.Errors,
  );

describe('errorDescriptor / RPC_TOKENS', () => {
  it.each(RPC_ERRORS)('%s tiene texto en los dos idiomas', (token) => {
    const { key } = errorDescriptor({ code: 'P0001', message: token });

    expect(key).not.toBe('unexpected');
    expect(typeof lookup(es as never, key)).toBe('string');
    expect(typeof lookup(en as never, key)).toBe('string');
  });

  it('el token se reconoce aunque Postgres lo envuelva en su propio texto', () => {
    const { key } = errorDescriptor({
      code: 'P0001',
      message: 'DB error: PURCHASE_POINTS_ALREADY_SPENT (SQLSTATE P0001)',
    });
    expect(key).toBe('rpc.purchasePointsSpent');
  });

  // El CHECK de la tabla sigue existiendo como ultima red. Si alguna vez vuelve
  // a saltar, que no se confunda con el motivo con nombre.
  it('un 23514 crudo sigue cayendo en el mensaje generico', () => {
    const { key } = errorDescriptor({
      code: '23514',
      message: 'new row violates check constraint',
    });
    expect(key).toBe('db.invalidValue');
  });
});
