CREATE POLICY "public read store images" ON storage.objects
FOR SELECT USING (bucket_id = 'store-images');

CREATE POLICY "admin upload store images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'store-images' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "admin update store images" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'store-images' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "admin delete store images" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'store-images' AND public.has_role(auth.uid(),'admin'));