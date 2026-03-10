# Setup Supabase Storage Bucket for Product Images

## Error: "Bucket not found"

The image upload feature requires a Supabase Storage bucket named `products`.

## Step-by-Step Instructions

### 1. Go to Supabase Storage

1. Open your Supabase project: https://supabase.com/dashboard
2. Click on **Storage** in the left sidebar
3. Click **"New bucket"** button

### 2. Create the Bucket

**Bucket Configuration:**
- **Name:** `products`
- **Public bucket:** ✅ **YES** (Check this box - images need to be publicly accessible)
- **File size limit:** Leave default (50MB) or set to 5MB
- **Allowed MIME types:** Leave empty (or add: `image/jpeg, image/png, image/gif, image/webp`)

Click **"Create bucket"**

### 3. Set Bucket Policies (RLS)

After creating the bucket, you need to set proper access policies:

#### Go to Storage Policies:
1. Click on the `products` bucket
2. Click **"Policies"** tab
3. Click **"New Policy"**

#### Policy 1: Allow INSERT (Upload)
- **Policy Name:** `Enable insert for authenticated users`
- **Allowed operation:** INSERT
- **Target roles:** authenticated
- **Policy definition:** 
```sql
(bucket_id = 'products')
```

#### Policy 2: Allow SELECT (Read/Download)
- **Policy Name:** `Public access to product images`
- **Allowed operation:** SELECT
- **Target roles:** public, authenticated
- **Policy definition:**
```sql
(bucket_id = 'products')
```

#### Policy 3: Allow UPDATE (Optional - for replacing images)
- **Policy Name:** `Enable update for authenticated users`
- **Allowed operation:** UPDATE
- **Target roles:** authenticated
- **Policy definition:**
```sql
(bucket_id = 'products')
```

#### Policy 4: Allow DELETE (Optional - for removing images)
- **Policy Name:** `Enable delete for authenticated users`
- **Allowed operation:** DELETE
- **Target roles:** authenticated
- **Policy definition:**
```sql
(bucket_id = 'products')
```

### 4. Test the Setup

After creating the bucket and policies:

1. **Clear browser cache:**
   - Press `Ctrl + Shift + Delete`
   - Clear cached images and files
   - Close settings

2. **Hard refresh your app:**
   - Press `Ctrl + Shift + R` (Windows)
   - Press `Cmd + Shift + R` (Mac)

3. **Test image upload:**
   - Go to Sales Hub → Products
   - Click "Add Product" or edit existing product
   - Look for "Product Image" section
   - Click "Choose Image"
   - Select an image (max 5MB)
   - Should see preview immediately
   - Save product
   - Image should upload successfully

## Verify Bucket URL

Your bucket URL should look like:
```
https://bpydcrdvytnnjzytkptd.supabase.co/storage/v1/object/public/products/product-images/[filename]
```

## Troubleshooting

### Still getting "Bucket not found"?
- Verify bucket name is exactly `products` (lowercase, no spaces)
- Check bucket is marked as **Public**
- Wait 30 seconds after creating bucket (cache refresh)
- Hard refresh browser

### Images not uploading?
- Check INSERT policy is enabled for authenticated users
- Verify you're logged in to the app
- Check browser console for detailed error messages
- Verify file size is under 5MB
- Verify file type is an image (jpg, png, gif, webp)

### Images not displaying?
- Check SELECT policy is enabled for public/authenticated
- Verify bucket is marked as **Public**
- Check image URL in database (should start with https://)
- Hard refresh browser

## Quick Policy SQL (Alternative Method)

If you prefer SQL, run this in Supabase SQL Editor after creating the bucket:

```sql
-- Enable INSERT for authenticated users
CREATE POLICY "Enable insert for authenticated users"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Enable SELECT for everyone
CREATE POLICY "Public access to product images"
ON storage.objects FOR SELECT
TO public, authenticated
USING (bucket_id = 'products');

-- Enable UPDATE for authenticated users
CREATE POLICY "Enable update for authenticated users"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

-- Enable DELETE for authenticated users
CREATE POLICY "Enable delete for authenticated users"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');
```

## Summary

✅ Create bucket named `products` (public)  
✅ Add INSERT policy for authenticated users  
✅ Add SELECT policy for public access  
✅ Add UPDATE policy for authenticated users (optional)  
✅ Add DELETE policy for authenticated users (optional)  
✅ Hard refresh browser  
✅ Test image upload  

---

**Need Help?** Check Supabase Storage documentation: https://supabase.com/docs/guides/storage
