-- 1) Reviews must be moderated
ALTER TABLE public.product_reviews ALTER COLUMN is_approved SET DEFAULT false;
DROP POLICY IF EXISTS "anyone can create review" ON public.product_reviews;
CREATE POLICY "anyone can create pending review"
ON public.product_reviews FOR INSERT
WITH CHECK (rating >= 1 AND rating <= 5 AND is_approved = false);

-- 2) Lock down bootstrap admin function
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM authenticated;