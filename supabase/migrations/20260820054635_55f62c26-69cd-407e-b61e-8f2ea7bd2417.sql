CREATE POLICY "Admins can create store settings"
ON public.store_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));