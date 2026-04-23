-- 1. Create trigger function to decrement stock when a redemption is created
CREATE OR REPLACE FUNCTION decrement_stock_on_redemption()
RETURNS TRIGGER AS $$
DECLARE
  stock_record RECORD;
  qty_to_decrement INTEGER;
BEGIN
  qty_to_decrement := COALESCE(NEW.quantity, 1);

  -- Find the first stock record with available quantity for this product
  SELECT id, quantity INTO stock_record
  FROM stock
  WHERE product_id = NEW.product_id AND quantity > 0
  ORDER BY id
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    UPDATE stock
    SET quantity = GREATEST(stock_record.quantity - qty_to_decrement, 0)
    WHERE id = stock_record.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger on redemption INSERT
CREATE TRIGGER trg_decrement_stock_on_redemption
AFTER INSERT ON redemption
FOR EACH ROW
EXECUTE FUNCTION decrement_stock_on_redemption();

-- 3. Add product and stock tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.product;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock;
