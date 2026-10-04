const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const sourceDirectory = path.resolve(__dirname, "..", "..", "libassi images");
const outputDirectory = path.join(sourceDirectory, "enhanced");
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function enhanceImages() {
  await fs.mkdir(outputDirectory, { recursive: true });
  const names = await fs.readdir(sourceDirectory);
  const images = names.filter((name) => supportedExtensions.has(path.extname(name).toLowerCase()));

  for (const name of images) {
    const sourcePath = path.join(sourceDirectory, name);
    const outputPath = path.join(outputDirectory, `${path.parse(name).name}.webp`);
    const metadata = await sharp(sourcePath).metadata();
    const targetWidth = Math.min(metadata.width < 1000 ? metadata.width * 2 : metadata.width, 2400);

    await sharp(sourcePath)
      .resize({ width: targetWidth, kernel: "lanczos3" })
      .sharpen({ sigma: 0.7, m1: 0.5, m2: 1 })
      .webp({ quality: 90, effort: 6 })
      .toFile(outputPath);
  }

  console.log(`Enhanced ${images.length} product and editorial images in ${outputDirectory}`);
}

enhanceImages().catch((error) => {
  console.error("Image enhancement failed", error);
  process.exitCode = 1;
});