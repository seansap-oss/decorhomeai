-- ==============================================================================
-- AI Home Design Platform (DecorHome AI Architecture) - Supabase SQL Schema
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE (Linked to Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    credits INTEGER DEFAULT 5 NOT NULL CHECK (credits >= 0),
    subscription_tier TEXT DEFAULT 'free' NOT NULL, -- 'free', 'starter', 'pro', 'enterprise'
    stripe_customer_id TEXT UNIQUE,
    razorpay_customer_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. PROJECTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Untitled Project',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. GENERATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    original_image_url TEXT NOT NULL,
    generated_image_url TEXT NOT NULL,
    style_prompt TEXT NOT NULL,
    room_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. SUBSCRIPTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    gateway TEXT NOT NULL, -- 'stripe' or 'razorpay'
    subscription_id TEXT UNIQUE,
    plan_tier TEXT NOT NULL, -- 'starter', 'pro', 'enterprise'
    status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. WEBHOOK IDEMPOTENCY TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT UNIQUE NOT NULL,
    gateway TEXT NOT NULL, -- 'stripe' or 'razorpay'
    event_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. AUTOMATIC USER PROFILE TRIGGER ON AUTH SIGNUP
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, credits, subscription_tier)
    VALUES (
        NEW.id,
        NEW.email,
        5, -- Complimentary starter credits
        'free'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if existing and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- USERS Table Policies
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- PROJECTS Table Policies
CREATE POLICY "Users can select own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

-- GENERATIONS Table Policies
CREATE POLICY "Users can select own generations"
    ON public.generations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
    ON public.generations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations"
    ON public.generations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations"
    ON public.generations FOR DELETE
    USING (auth.uid() = user_id);

-- SUBSCRIPTIONS Table Policies
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- PROCESSED WEBHOOK EVENTS (Service Role only)
CREATE POLICY "Service role manages webhook events"
    ON public.processed_webhook_events
    FOR ALL
    USING (auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- 8. STORAGE BUCKET CONFIGURATION & RLS POLICIES
-- ------------------------------------------------------------------------------

-- Create the 'home_designs' bucket if not already present
INSERT INTO storage.buckets (id, name, public)
VALUES ('home_designs', 'home_designs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy: Allow authenticated users to upload objects to their own user_id directory
CREATE POLICY "Authenticated users can upload home designs"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'home_designs' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy: Allow users to update their own objects
CREATE POLICY "Authenticated users can update own home designs"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'home_designs' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy: Allow users to delete their own objects
CREATE POLICY "Authenticated users can delete own home designs"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'home_designs' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy: Allow public read access to home designs images (or authenticated if private)
CREATE POLICY "Public read access to home designs"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'home_designs');
