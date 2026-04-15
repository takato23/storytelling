#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const projectRoot = path.resolve(process.cwd());
dotenv.config({ path: path.join(projectRoot, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const storyPayload = {
  id: '3',
  slug: 'valentin-y-la-noche-de-los-dinosaurios',
  title: 'Valentín y la noche de los dinosaurios',
  age_range: '3-6 años',
  cover_image: '/stories/valentin-noche-dinosaurios/cover.png',
  short_description: 'Un cuento tierno para acompañar el miedo a dormir solo.',
  full_description:
    'A veces, cuando llega la noche, todo se siente más silencioso y un poquito más difícil. Junto a su amigo Dino, Valentín descubre que ser valiente no es dejar de sentir miedo, sino animarse incluso cuando el miedo está.',
  base_price_usd: 29.99,
  base_price_ars: null,
  digital_price_ars: 9990,
  print_price_ars: 29990,
  target_gender: 'niño',
  print_specs: {
    format: 'Tapa dura',
    size: '21 x 21 cm',
    pages: 20,
    paper: 'Satinado color',
  },
  active: true,
};

async function ensureBucket(bucketName, isPublic) {
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) throw bucketsError;
  const existing = (buckets ?? []).find((bucket) => bucket.id === bucketName || bucket.name === bucketName);
  if (existing) {
    if (Boolean(existing.public) !== isPublic) {
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: isPublic,
        fileSizeLimit: '10MB',
      });
      if (updateError) throw updateError;
      console.log(`Updated bucket ${bucketName} visibility to public=${isPublic}.`);
      return;
    }
    console.log(`Bucket ${bucketName} already exists.`);
    return;
  }

  const { error } = await supabase.storage.createBucket(bucketName, {
    public: isPublic,
    fileSizeLimit: '10MB',
  });
  if (error) throw error;
  console.log(`Created bucket ${bucketName}.`);
}

async function main() {
  const { error: storyError } = await supabase
    .from('stories')
    .upsert(storyPayload, { onConflict: 'id' });

  if (storyError) throw storyError;

  await ensureBucket('book-renders', false);
  await ensureBucket('reference-looks', false);

  const summary = {
    story: {
      id: storyPayload.id,
      slug: storyPayload.slug,
      title: storyPayload.title,
    },
    buckets: ['book-renders(private)', 'reference-looks(private)'],
  };

  await fs.writeFile(
    path.join(projectRoot, 'tmp', 'valentin-story-sync.json'),
    JSON.stringify(summary, null, 2),
    'utf8',
  );

  console.log('Valentín story synced successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
