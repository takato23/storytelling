# Supabase Bootstrap

Si el proyecto de Supabase es nuevo, primero hay que crear la estructura base.
El error `relation "public.orders" does not exist` significa exactamente eso:
todavía no se ejecutó el schema inicial.

## Orden correcto

### 1. Ejecutar schema base

En `Supabase -> SQL Editor`, ejecutar completo:

- [supabase/schema.sql](/Users/santiagobalosky/Documents/Storytelling/supabase/schema.sql)

Eso crea:

- tablas
- funciones
- triggers
- policies RLS
- stories seed
- shipping rules seed

### 2. Ejecutar migraciones incrementales

Después del schema base, correr en este orden:

1. [20260318_preview_limits.sql](/Users/santiagobalosky/Documents/Storytelling/supabase/migrations/20260318_preview_limits.sql)
2. [20260319_preview_credits_default.sql](/Users/santiagobalosky/Documents/Storytelling/supabase/migrations/20260319_preview_credits_default.sql)
3. [20260321_print_pipeline_qa.sql](/Users/santiagobalosky/Documents/Storytelling/supabase/migrations/20260321_print_pipeline_qa.sql)

## Variables que ya tiene el repo en local

En [`.env.local`](/Users/santiagobalosky/Documents/Storytelling/.env.local) quedó configurado:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Luego esas mismas variables hay que copiarlas a `Vercel`.

## Primer usuario admin

Después de correr schema + migrations:

1. crear una cuenta normal desde la app
2. ir a SQL Editor
3. ejecutar:

```sql
update public.profiles
set role = 'admin'
where id in (
  select id
  from auth.users
  where email = 'TU_EMAIL_AQUI'
);
```

Sin eso, no vas a poder usar:

- `/admin`
- `/admin/print-jobs`
- `/admin/metrics`

## Check mínimo después del bootstrap

Estas consultas deberían funcionar sin error:

```sql
select count(*) from public.orders;
select count(*) from public.stories;
select count(*) from public.shipping_rate_rules;
select count(*) from public.profiles;
```

## Si vuelve a fallar

Si una migration da error:

- verificar primero que `supabase/schema.sql` se haya ejecutado completo
- no correr las migraciones antes del schema
- revisar si el proyecto quedó a mitad de camino por una ejecución interrumpida
