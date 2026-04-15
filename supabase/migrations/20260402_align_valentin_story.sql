begin;

insert into public.stories (
  id,
  slug,
  title,
  age_range,
  cover_image,
  short_description,
  full_description,
  base_price_usd,
  base_price_ars,
  digital_price_ars,
  print_price_ars,
  target_gender,
  print_specs,
  active
)
values (
  '3',
  'valentin-y-la-noche-de-los-dinosaurios',
  'Valentín y la noche de los dinosaurios',
  '3-6 años',
  '/stories/valentin-noche-dinosaurios/cover.png',
  'Un cuento tierno para acompañar el miedo a dormir solo.',
  'A veces, cuando llega la noche, todo se siente más silencioso y un poquito más difícil. Junto a su amigo Dino, Valentín descubre que ser valiente no es dejar de sentir miedo, sino animarse incluso cuando el miedo está.',
  29.99,
  null,
  9990,
  29990,
  'niño',
  '{"format":"Tapa dura","size":"21 x 21 cm","pages":20,"paper":"Satinado color"}'::jsonb,
  true
)
on conflict (id) do update
set slug = excluded.slug,
    title = excluded.title,
    age_range = excluded.age_range,
    cover_image = excluded.cover_image,
    short_description = excluded.short_description,
    full_description = excluded.full_description,
    base_price_usd = excluded.base_price_usd,
    base_price_ars = excluded.base_price_ars,
    digital_price_ars = excluded.digital_price_ars,
    print_price_ars = excluded.print_price_ars,
    target_gender = excluded.target_gender,
    print_specs = excluded.print_specs,
    active = excluded.active,
    updated_at = now();

commit;
