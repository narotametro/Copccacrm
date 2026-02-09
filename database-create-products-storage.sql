-- Create storage bucket for product photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the products bucket
CREATE POLICY "Product images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'products'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products'
    AND auth.role() = 'authenticated'
  );