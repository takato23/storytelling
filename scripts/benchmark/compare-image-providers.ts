#!/usr/bin/env -S npx tsx
/**
 * Side-by-side benchmark of the configured image providers.
 *
 * Runs the same (prompt, reference photo) pair through every provider
 * that is currently configured, measures latency, saves the outputs to
 * disk, and writes a Markdown report you can show the client for a
 * blind quality comparison.
 *
 * Usage:
 *   npx tsx scripts/benchmark/compare-image-providers.ts \
 *     --photo ./tmp/child1.jpg \
 *     --prompt "Pixar 3D style, a curious child exploring a sunny jungle" \
 *     --out ./tmp/bench-run-1
 *
 * Required env (set only for the providers you want included):
 *   GEMINI_API_KEY  or  STORY_IMAGE_EDGE_URL
 *   FAL_KEY         (enables flux-kontext-pro, flux-kontext-max, seedream)
 *
 * Optional env overrides:
 *   FAL_FLUX_KONTEXT_MODEL, FAL_SEEDREAM_MODEL
 *
 * The script DOES NOT send any request to providers that are not
 * configured. Cost is therefore bounded by the env you populate.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { generateImage, listProviders } from "../../lib/image-providers";
import type { ImageProviderName } from "../../lib/image-providers/types";

interface CliArgs {
  photo: string;
  prompt: string;
  out: string;
  size: "1K" | "2K" | "4K";
  aspectRatio: string;
}

function parseArgs(): CliArgs {
  const args: Record<string, string> = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = process.argv[i]?.replace(/^--/, "");
    const value = process.argv[i + 1];
    if (key && value) args[key] = value;
  }
  if (!args.photo || !args.prompt) {
    throw new Error("Missing required args. Usage: --photo <path> --prompt <text> [--out <dir>] [--size 1K|2K|4K]");
  }
  return {
    photo: args.photo,
    prompt: args.prompt,
    out: args.out ?? `./tmp/bench-${Date.now()}`,
    size: (args.size as CliArgs["size"]) ?? "1K",
    aspectRatio: args["aspect-ratio"] ?? "1:1",
  };
}

async function readPhotoAsDataUrl(photoPath: string): Promise<string> {
  const buffer = await fs.readFile(photoPath);
  const extension = path.extname(photoPath).toLowerCase();
  const mime = extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function extensionForDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/);
  const mimeSuffix = match?.[1] ?? "png";
  return mimeSuffix.replace("jpeg", "jpg");
}

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
  return Buffer.from(base64, "base64");
}

interface ProviderRun {
  name: ImageProviderName;
  ok: boolean;
  latencyMs: number;
  model: string;
  outputPath: string | null;
  errorMessage?: string | null;
}

async function run() {
  const cli = parseArgs();
  await fs.mkdir(cli.out, { recursive: true });

  console.log(`[bench] reading ${cli.photo}`);
  const referenceDataUrl = await readPhotoAsDataUrl(cli.photo);

  const providers = listProviders();
  const runs: ProviderRun[] = [];

  for (const provider of providers) {
    const label = provider.name;
    if (!provider.isConfigured()) {
      console.log(`[bench] skip ${label} (not configured)`);
      runs.push({
        name: label,
        ok: false,
        latencyMs: 0,
        model: "-",
        outputPath: null,
        errorMessage: "not configured",
      });
      continue;
    }

    console.log(`[bench] running ${label}…`);
    const startedAt = Date.now();
    const result = await generateImage(
      {
        prompt: cli.prompt,
        references: [referenceDataUrl],
        imageSize: cli.size,
        aspectRatio: cli.aspectRatio,
      },
      { provider: label, disableFallback: true },
    );
    const latencyMs = result.latencyMs ?? Date.now() - startedAt;

    if (!result.imageDataUrl) {
      console.warn(`[bench] ${label} failed: ${result.errorMessage ?? "unknown"}`);
      runs.push({
        name: label,
        ok: false,
        latencyMs,
        model: result.model,
        outputPath: null,
        errorMessage: result.errorMessage,
      });
      continue;
    }

    const extension = extensionForDataUrl(result.imageDataUrl);
    const outputPath = path.join(cli.out, `${label}.${extension}`);
    await fs.writeFile(outputPath, dataUrlToBuffer(result.imageDataUrl));
    console.log(`[bench] ${label} ok in ${latencyMs}ms → ${outputPath}`);
    runs.push({
      name: label,
      ok: true,
      latencyMs,
      model: result.model,
      outputPath,
    });
  }

  const reportPath = path.join(cli.out, "report.md");
  const lines: string[] = [];
  lines.push(`# Image provider benchmark — ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`- **Reference photo:** \`${cli.photo}\``);
  lines.push(`- **Prompt:** ${cli.prompt}`);
  lines.push(`- **Size:** ${cli.size}, aspect ratio ${cli.aspectRatio}`);
  lines.push("");
  lines.push("| Provider | Status | Latency (ms) | Model | Output |");
  lines.push("|---|---|---|---|---|");
  for (const run of runs) {
    const output = run.outputPath ? `![${run.name}](${path.basename(run.outputPath)})` : run.errorMessage ?? "-";
    lines.push(`| ${run.name} | ${run.ok ? "ok" : "failed"} | ${run.latencyMs} | ${run.model} | ${output} |`);
  }
  lines.push("");
  lines.push("## Instructions for blind review");
  lines.push("");
  lines.push("1. Rename the image files so the provider name is hidden (e.g. `A.png`, `B.png`, ...).");
  lines.push("2. Show the renamed images to the client without telling them which model produced each.");
  lines.push("3. Record the preference and map it back to the provider in this report.");
  await fs.writeFile(reportPath, lines.join("\n"));
  console.log(`[bench] report written to ${reportPath}`);
}

run().catch((error) => {
  console.error("[bench] fatal:", error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
