DROP POLICY IF EXISTS coupons_public_read ON public.discount_coupons;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.discount_coupons FROM anon;

REVOKE ALL ON FUNCTION public.admin_exists() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;