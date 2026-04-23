-- Add RLS policy for cashiers to read products in their organization
CREATE POLICY "cashier_read_product" ON public.product
  FOR SELECT
  USING (
    private.is_cashier()
    AND organization_id = (
      SELECT au.organization_id
      FROM app_user au
      WHERE au.auth_user_id = auth.uid()
    )
  );

-- Add RLS policy for cashiers to read stock for products in their organization
CREATE POLICY "cashier_read_stock" ON public.stock
  FOR SELECT
  USING (
    private.is_cashier()
    AND EXISTS (
      SELECT 1
      FROM product p
      JOIN app_user au ON au.organization_id = p.organization_id
      WHERE p.id = stock.product_id
        AND au.auth_user_id = auth.uid()
    )
  );
