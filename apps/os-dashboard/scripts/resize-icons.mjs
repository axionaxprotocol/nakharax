// Render the canonical Nakharax SVG token into PNGs used by Next.js.
//
// Source:
//   public/brand/nakharax-token.svg
//
// Outputs:
//   public/logo.png        -> 512x512 UI/logo fallback
//   src/app/icon.png       -> 256x256 Next.js favicon/app icon
//   src/app/apple-icon.png -> 180x180 Apple touch icon
//
// Usage: pnpm icons:resize

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const SOURCE = path.join(root, "public", "brand", "nakharax-token.svg");

const TARGETS = [
  { out: path.join(root, "public", "logo.png"), size: 512 },
  { out: path.join(root, "src", "app", "icon.png"), size: 256 },
  { out: path.join(root, "src", "app", "apple-icon.png"), size: 180 },
];

async function main() {
  const svg = await fs.readFile(SOURCE);

  for (const { out, size } of TARGETS) {
    await fs.mkdir(path.dirname(out), { recursive: true });
    await sharp(svg, { density: 384 })
      .resize(size, size, {
        fit: "cover",
      })
      .png({ compressionLevel: 9, palette: true })
      .toFile(out);

    const { size: bytes } = await fs.stat(out);
    console.log(
      `${path.relative(root, out).padEnd(34)} ${size}x${size} ${(bytes / 1024).toFixed(1)} KB`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
