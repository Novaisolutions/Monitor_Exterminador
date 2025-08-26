# 🚀 Netlify Deployment Guide - Monitor Exterminador

## 📋 Prerequisites

1. **Netlify Account**: Create an account at [netlify.com](https://netlify.com)
2. **Git Repository**: Your project should be in a Git repository (GitHub, GitLab, etc.)
3. **Environment Variables**: Prepare your environment variables

## 🔧 Environment Variables Required

Before deploying, you need to configure these environment variables in Netlify:

### Required Variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Optional Variables:
- `VITE_KOMMO_BASE_URL` - Kommo CRM base URL
- `VITE_KOMMO_ACCESS_TOKEN` - Kommo access token
- `VITE_KOMMO_CLIENT_ID` - Kommo client ID
- `VITE_KOMMO_CLIENT_SECRET` - Kommo client secret
- `VITE_OPENAI_KEY` - OpenAI API key (if using AI features)
- `VITE_SENTRY_DSN` - Sentry DSN for error tracking
- `VITE_N8N_PROMPT_GET` - N8N webhook URL for getting prompts
- `VITE_N8N_PROMPT_SET` - N8N webhook URL for setting prompts

## 🚀 Deployment Steps

### Method 1: Deploy via Netlify CLI (Recommended)

1. **Login to Netlify**:
   ```bash
   netlify login
   ```

2. **Initialize Netlify Site**:
   ```bash
   netlify init
   ```

3. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

4. **Set Environment Variables**:
   ```bash
   netlify env:set VITE_SUPABASE_URL "your_supabase_url"
   netlify env:set VITE_SUPABASE_ANON_KEY "your_supabase_anon_key"
   # Add other environment variables as needed
   ```

5. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

### Method 2: Deploy via Netlify Dashboard

1. **Connect Repository**:
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "New site from Git"
   - Connect your Git repository

2. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

3. **Set Environment Variables**:
   - Go to Site settings > Environment variables
   - Add all required environment variables

4. **Deploy**:
   - Click "Deploy site"

## ⚙️ Netlify Configuration

The project includes a `netlify.toml` file with the following configuration:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[dev]
  command = "npm run dev"
  port = 5174

# Redirects for client-side routing (SPA)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## 🔍 Post-Deployment Checklist

1. **✅ Build Success**: Verify the build completed successfully
2. **✅ Environment Variables**: Confirm all required environment variables are set
3. **✅ Site Loading**: Test that the site loads correctly
4. **✅ Authentication**: Test Supabase authentication
5. **✅ Features**: Test core features like chat, prospects, etc.
6. **✅ Mobile**: Test responsive design on mobile devices

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check Node.js version (should be 18)
   - Verify all dependencies are installed
   - Check for missing environment variables

2. **Environment Variables Not Working**:
   - Ensure variables start with `VITE_`
   - Redeploy after adding environment variables
   - Check variable names for typos

3. **Routing Issues**:
   - Verify the redirect rule in `netlify.toml`
   - Test direct URL access to routes

4. **Supabase Connection Issues**:
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Check Supabase project settings
   - Verify CORS settings in Supabase

## 📞 Support

If you encounter issues:
1. Check the Netlify build logs
2. Verify environment variables are set correctly
3. Test locally with `npm run build` and `npm run preview`
4. Check the browser console for errors

## 🔄 Continuous Deployment

Once deployed, Netlify will automatically redeploy when you push changes to your main branch. Make sure to:

1. Test changes locally before pushing
2. Update environment variables if needed
3. Monitor build status after each push