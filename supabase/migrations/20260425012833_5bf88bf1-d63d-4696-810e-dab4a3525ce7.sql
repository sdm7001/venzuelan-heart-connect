-- 1. Add new badge kind
ALTER TYPE public.trust_badge_kind ADD VALUE IF NOT EXISTS 'founding_member';
