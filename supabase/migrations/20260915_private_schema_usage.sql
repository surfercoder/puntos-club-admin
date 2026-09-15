-- =====================================================================
-- El trigger de puntos no podía entrar al schema `private`
-- =====================================================================
-- 20260911_purchase_points_guard movió la aritmética de puntos del cuerpo
-- de update_beneficiary_points_after_purchase a
-- private.apply_purchase_points. El trigger es SECURITY INVOKER (a
-- propósito: así el UPDATE sigue sujeto a las policies de
-- beneficiary_organization), o sea que corre como `authenticated` — y
-- `authenticated` no tiene USAGE sobre el schema `private`.
--
-- Resultado: TODO insert o update de `purchase` aborta con
-- 42501 "permission denied for schema private", desde el 11/09. Ni el
-- cajero virtual del admin ni la app de caja pueden acreditar puntos.
--
-- El GRANT EXECUTE de aquella migración no alcanza: sin USAGE en el
-- schema la función ni siquiera se resuelve. Las otras dos funciones de
-- `private` (is_cashier, has_admin_portal_access) nunca lo necesitaron
-- porque sólo se llaman desde policies, que Postgres evalúa con los
-- permisos del dueño de la tabla.
--
-- `private` no está en los schemas expuestos por PostgREST, así que el
-- USAGE no la hace alcanzable desde el cliente. anon queda afuera y se
-- revoca el EXECUTE que PUBLIC tenía por default.
-- =====================================================================

GRANT USAGE ON SCHEMA private TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION private.apply_purchase_points(bigint, bigint, integer)
  FROM PUBLIC;
