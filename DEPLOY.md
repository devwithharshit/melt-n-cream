# Melt N Cream — Deploy Guide

## 1. Push to GitHub
```sh
git init
git add .
git commit -m "Melt N Cream"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

## 2. Database (Supabase)
1. Create a free project at https://supabase.com
2. In the SQL Editor, run the migrations in `drizzle/migrations/` in order.
3. Copy your project URL, publishable key and service-role key into `.env`
   (see `.env.example`). Never commit `.env` — it is already in `.gitignore`.
4. In Authentication → Sign In / Providers, disable new sign-ups
   (staff accounts are created manually). Enable email auth.

## 3. Install & run locally
```sh
bun install   # or: npm install
bun dev       # http://localhost:8080
```

## 4. Deploy
This is a TanStack Start app that builds to a Cloudflare-Workers-style
server bundle (`bun run build`). Easiest options:

- **Cloudflare Workers / Pages**: `bun run build`, then deploy the `.output`
  folder with Wrangler. Set the env vars from `.env.example` as secrets.
- **Any Node host**: build output is standard; set the same env vars.

## 5. Staff access
Sign up once with the owner email, confirm the email, then insert the admin
role in the database:
```sql
insert into public.user_roles (user_id, role)
values ('<your-user-uuid>', 'admin');
```
Staff dashboard lives at `/admin`.

## Notes
- Prices, hours and payment status are validated server-side.
- Payment is manual: customer pays via the Google Pay QR and enters the UTR;
  staff confirm in `/admin`.
