# CINEVA — starter streaming website

A responsive HTML/CSS/JavaScript frontend with a Supabase connection point. No build step is required.

## Run locally
Open `index.html` in a browser, or serve this folder with VS Code Live Server. The homepage displays sample demo titles until Supabase is configured.

## Connect Supabase
1. Open `js/config.js`.
2. Set `SUPABASE_URL` to your project URL and `SUPABASE_ANON_KEY` to your project's **anon/public** key.
3. Keep the service-role key private; never put it in browser code.
4. Confirm the table names in `TABLES` match your project.

The starter expects:
- `movies`: `id`, `title`, `category`, `created_at`, `is_active`, `poster_url` or `poster`, `banner_url` or `banner`, `description`, `release_year`, `quality`, `video_url`, `download_links` (JSON array), `views`.
- `series`: similar title fields, with `type` or `role` identifying series where needed.
- `episodes`: `id`, `series_id`, `season_number`, `episode_number`, `title`, `description`, `video_url`.
- `comments`: `id`, `content_id`, `name`, `comment`, `created_at`.

The code also maps common existing field names such as `worker_url`, `role`, `poster`, `overview`, and `year`. Adjust `normalize()` in `js/app.js` / `js/watch.js` if your database uses different names.

## Important production work still needed
- Add Supabase Row Level Security policies. Public visitors should only read active published content. Only authenticated admins should insert/update/delete titles and episodes.
- Add Supabase Auth for admin dashboard, profiles and My List.
- Add a secure video delivery strategy (private storage + signed URLs or an authorized streaming provider). Do not expose private storage credentials.
- Add an age-verification gate and ensure the 18+ section follows local law and host/provider rules.
- Configure comments/likes with moderation, rate limits and spam protection.
- Add a proper episode query if your schema uses a different foreign-key name.

## Current scope
Included: homepage, featured hero, latest-added row, trending row, category rows, search overlay, responsive navigation, watch page, video/embed player, download link, series episode selector, comments UI, sample demo content.
Not included yet: admin dashboard, authentication, watch history, real user lists, likes persistence, recommendation engine, upload UI, payments/subscriptions.

Additional page: `discover.html` provides category, type, text search and sorting filters.
