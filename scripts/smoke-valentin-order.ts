import fs from 'node:fs/promises';
import path from 'node:path';
import { createOrderDraft } from '@/lib/orders';
import { generateValentinDinoPreviewBundle } from '@/lib/dino-story-pipeline';
import { processOrderGeneration } from '@/lib/generation';
import { createSupabaseAdminClient } from '@/lib/supabase';

async function main() {
  const adminClient = createSupabaseAdminClient();

  const [{ data: profiles, error: profilesError }, imageBytes] = await Promise.all([
    adminClient.from('profiles').select('id').limit(1),
    fs.readFile(path.join(process.cwd(), 'tests/fixtures/child.png')),
  ]);

  if (profilesError || !profiles?.[0]?.id) {
    throw new Error(profilesError?.message ?? 'No profiles available to create smoke order');
  }

  const userId = String(profiles[0].id);
  const imageBase64 = `data:image/png;base64,${imageBytes.toString('base64')}`;

  console.log('Generating preview bundle...');
  const previewBundle = await generateValentinDinoPreviewBundle({
    adminClient,
    childName: 'Smoke Dino',
    childFeatures: {
      approximateAge: 6,
      gender: 'niño',
      hairColor: 'castaño',
      hairType: 'ondulado',
      skinTone: 'medio',
      eyeColor: 'marrón',
    },
    childPhotoDataUrl: imageBase64,
  });

  console.log(`Preview ready: ${previewBundle.previewSessionId}`);

  const orderId = await createOrderDraft(adminClient, {
    userId,
    storyId: '3',
    format: 'digital',
    currency: 'ARS',
    paymentProvider: 'mercadopago',
    subtotal: 9990,
    shippingFee: 0,
    total: 9990,
    fxRateSnapshot: 1200,
    printOptions: {
      productId: 'photo_book_21x21_hard',
      includeGiftWrap: false,
    },
    childProfile: {
      name: 'Smoke Dino',
      age: 6,
      child_gender: 'niño',
      detected_features: {
        approximateAge: 6,
        gender: 'niño',
        hairColor: 'castaño',
        hairType: 'ondulado',
        skinTone: 'medio',
        eyeColor: 'marrón',
      },
    },
    personalizationPayload: {
      selected_story: '3',
      selected_style: 'cinematic-3d',
      reading_level: 'intermediate',
      preview_session_id: previewBundle.previewSessionId,
      preview_bundle: previewBundle,
      preview_image_url: previewBundle.cover.imageUrl,
    },
  });

  const { error: paymentError } = await adminClient.from('payments').insert({
    order_id: orderId,
    provider: 'mercadopago',
    provider_payment_intent: `smoke-${Date.now()}`,
    status: 'paid',
    amount: 9990,
    currency: 'ARS',
    raw_payload: { source: 'smoke-script' },
  });

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  const { error: orderUpdateError } = await adminClient
    .from('orders')
    .update({ status: 'paid', payment_provider: 'mercadopago' })
    .eq('id', orderId);

  if (orderUpdateError) {
    throw new Error(orderUpdateError.message);
  }

  console.log(`Order paid: ${orderId}`);

  const generation = await processOrderGeneration(adminClient, {
    orderId,
    triggerSource: 'manual_start',
  });

  const { data: generatedPages, error: pagesError } = await adminClient
    .from('generated_pages')
    .select('page_number,status,image_url,error_message')
    .eq('order_id', orderId)
    .order('page_number', { ascending: true });

  if (pagesError) {
    throw new Error(pagesError.message);
  }

  const summary = {
    orderId,
    previewSessionId: previewBundle.previewSessionId,
    generation,
    generatedPages,
  };

  const outPath = path.join(process.cwd(), 'tmp', `smoke-valentin-order-${orderId}.json`);
  await fs.writeFile(outPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log(`Smoke completed. Summary: ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
