-- Clave de idempotencia de la venta: la caja genera un UUID por venta y lo
-- manda en el insert. Si el insert vence por timeout sin respuesta, la caja
-- reintenta con la misma clave; si la primera ya se habia guardado, el unique
-- la rechaza (23505) y la caja la da por confirmada en vez de duplicarla.
-- Nullable: el admin y las ventas viejas no la mandan (unique admite N nulls).
alter table public.purchase
  add column if not exists client_request_id uuid;

alter table public.purchase
  add constraint purchase_client_request_id_key unique (client_request_id);
