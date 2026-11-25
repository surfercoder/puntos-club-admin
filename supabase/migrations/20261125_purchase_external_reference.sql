-- Número de transacción / comprobante / cupón que el cajero carga (opcional) al
-- hacer una venta, para conciliar después contra el sistema del comercio.
-- Columna propia y no `notes`: notes ya lo llenan las cajas con un texto fijo.
alter table public.purchase
  add column if not exists external_reference text
  check (char_length(external_reference) <= 100);

comment on column public.purchase.external_reference is
  'Nro. de transacción/comprobante del comercio, opcional, para conciliar';
