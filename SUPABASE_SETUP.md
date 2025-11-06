# Supabase Configuration Guide

## Environment Variables

Ensure your `.env.local` file contains the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Updating the Supabase URL

If you change your Supabase project URL:

1. **Update `.env.local`**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-new-project-id.supabase.co
   ```

2. **Restart the development server**:
   ```bash
   npm run dev
   ```

3. **Clear browser cache/storage** (if needed):
   - The browser client will automatically reset when the URL changes
   - You may need to sign out and sign back in

## How It Works

### Browser Client (`src/lib/supabaseBrowser.ts`)
- Automatically detects URL changes and resets the client
- Validates environment variables on initialization
- Provides helpful error messages if configuration is missing

### Server Client (`src/lib/supabaseServer.ts`)
- Creates a new client instance for each request
- Validates environment variables
- Uses cookie-based session management

### Storage URLs
- Storage URLs are generated dynamically using the current Supabase client
- URLs will automatically use the updated project URL
- No hardcoded URLs in the codebase

## Troubleshooting

### "Missing Supabase environment variables"
- Check that `.env.local` exists in the project root
- Verify variable names are correct (case-sensitive)
- Restart the dev server after changing `.env.local`

### "Invalid Supabase URL format"
- Ensure the URL starts with `https://`
- Check that the URL doesn't have trailing slashes
- Verify the URL format: `https://[project-id].supabase.co`

### Images not loading
- Check `next.config.js` remote patterns include your Supabase domain
- Verify the storage bucket is set to public
- Ensure RLS policies allow public read access if needed

