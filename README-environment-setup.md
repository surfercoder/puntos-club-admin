# Environment Setup Guide

This guide explains how to set up separate environments for development, testing, and production.

## Overview

The project now supports multiple environments:
- **Local Development** (`.env.local`) - Points to test Supabase project
- **E2E Testing** (`.env.test`) - Points to test Supabase project  
- **Production** (`.env.production`) - Points to production Supabase project

## Setup Instructions

### 1. Create Test Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project for testing
3. Copy the same database schema from your production project:
   - Use Supabase CLI: `supabase db dump --project-id YOUR_PROD_PROJECT_ID`
   - Apply to test project: `supabase db push --project-id YOUR_TEST_PROJECT_ID`

### 2. Configure Environment Files

Copy the example files and fill in your credentials:

```bash
# For local development
cp .env.example .env.local
# Edit .env.local with your TEST project credentials

# For E2E testing
cp .env.test.example .env.test
# Edit .env.test with your TEST project credentials

# For production (if needed locally)
cp .env.production.example .env.production
# Edit .env.production with your PRODUCTION project credentials
```

### 3. Environment Variables

Each environment file should contain:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or your domain
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Running Commands

```bash
# Local development (uses .env.local)
npm run dev

# E2E testing with test environment
npm run e2e:test

# Regular E2E testing (uses .env.test via playwright.config.ts)
npm run e2e

# Production build
npm run build
```

## Deployment

### Vercel Deployment

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL` → Production Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Production Supabase anon key
- `NEXT_PUBLIC_SITE_URL` → Your production domain

### Preview Deployments

For branch previews, you can use the test environment by setting the same test credentials in Vercel's preview environment variables.

## Security Notes

- Never commit `.env.local`, `.env.test`, or `.env.production` files
- Use different Supabase projects for test and production
- Test data won't affect production data
- All environment files are already in `.gitignore`

## Troubleshooting

If you see "Missing Supabase environment variables" errors:
1. Ensure your `.env.local` file exists and has the correct variables
2. Restart your development server after creating/modifying env files
3. Check that variable names match exactly (including `NEXT_PUBLIC_` prefix)
