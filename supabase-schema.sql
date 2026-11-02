-- CINEVA catalogue schema (Supabase SQL Editor)
create extension if not exists pgcrypto;

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  poster_url text,
  backdrop_url text,
  video_url text,
  trailer_url text,
  year integer,
  rating numeric(3,1),
  age_rating text default 'All Ages',
  genre text not null default 'Drama',
  content_type text not null default 'Movie' check (content_type in ('Movie','Series')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists movies_created_at_idx on public.movies(created_at desc);
create index if not exists movies_genre_idx on public.movies(genre);
create index if not exists movies_featured_idx on public.movies(is_featured) where is_featured=true;

alter table public.movies enable row level security;

-- Public visitors can read the catalogue. Do NOT allow anonymous public uploads or edits.
drop policy if exists "Public can read movies" on public.movies;
create policy "Public can read movies" on public.movies
for select to anon, authenticated using (true);

-- Optional: store videos/posters in a Supabase Storage bucket named "cineva-media".
-- Make poster/backdrop objects publicly readable if you use public image URLs.
-- For paid/private video, use a private bucket and generate short-lived signed URLs
-- from a trusted server/Edge Function after checking the viewer's subscription.

-- Sample row (replace image/video URLs with media you own or have licensed):
insert into public.movies (title,slug,description,year,genre,content_type,age_rating,is_featured)
values ('Welcome to CINEVA','welcome-to-cineva','Your streaming destination for stories worth staying up for.',2026,'Drama','Movie','All Ages',true)
on conflict (slug) do nothing;
