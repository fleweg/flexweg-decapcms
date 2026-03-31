const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

// Load configuration
const imagesConfig = require('../config/images.json');

// Source directory for original images (uploaded via Decap CMS)
const SOURCE_DIR = path.resolve(__dirname, '../src/media');
// Output directory for processed WebP variants
const OUTPUT_DIR = path.resolve(__dirname, '../src/assets/img');

/**
 * Get the base name without extension
 * @param {string} filename - Original filename
 * @returns {string} Base name without extension
 */
function getBaseName(filename) {
  return path.parse(filename).name;
}

/**
 * Check if file is a supported input format
 * @param {string} filename - Filename to check
 * @returns {boolean} True if supported
 */
function isSupportedFormat(filename) {
  const ext = path.extname(filename).toLowerCase();
  return imagesConfig.inputFormats.includes(ext);
}

/**
 * Process a single image and generate all format variants
 * @param {string} imagePath - Full path to the original image
 */
async function processImage(imagePath) {
  const filename = path.basename(imagePath);
  const ext = path.extname(filename);
  const baseName = getBaseName(filename);

  console.log(`\n📸 Processing: ${filename}`);

  try {
    // Load image and get metadata
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    console.log(`   Original: ${metadata.width}x${metadata.height} ${metadata.format}`);

    // Ensure output directory exists
    await fs.ensureDir(OUTPUT_DIR);

    // Generate each format variant
    for (const [formatName, formatConfig] of Object.entries(imagesConfig.formats)) {
      const outputFilename = `${baseName}-${formatName}.${imagesConfig.outputFormat}`;
      const outputPath = path.join(OUTPUT_DIR, outputFilename);

      try {
        await sharp(imagePath)
          .resize(formatConfig.width, formatConfig.height, {
            fit: formatConfig.fit,
            position: 'center',
            withoutEnlargement: false
          })
          .webp({ quality: imagesConfig.quality })
          .toFile(outputPath);

        const stats = await fs.stat(outputPath);
        console.log(`   ✓ ${formatName}: ${formatConfig.width}x${formatConfig.height} → ${outputFilename} (${stats.size} bytes)`);
      } catch (error) {
        console.error(`   ❌ Error generating ${formatName}:`, error.message);
        throw error;
      }
    }

    // Original stays in src/media/ (visible in Decap CMS)
    console.log(`   ✓ Original kept in src/media/ (visible in Decap CMS)`);
    console.log(`✅ Successfully processed: ${baseName}`);

  } catch (error) {
    console.error(`❌ Error processing ${filename}:`, error.message);
    throw error;
  }
}

/**
 * Process all images in the source directory
 */
async function processAllImages() {
  console.log('🚀 Starting image processing...\n');
  console.log(`📁 Source directory (originals): ${SOURCE_DIR}`);
  console.log(`📁 Output directory (WebP variants): ${OUTPUT_DIR}`);

  // Ensure source directory exists
  if (!fs.existsSync(SOURCE_DIR)) {
    console.log(`⚠️  Creating directory: ${SOURCE_DIR}`);
    await fs.ensureDir(SOURCE_DIR);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log(`⚠️  Creating directory: ${OUTPUT_DIR}`);
    await fs.ensureDir(OUTPUT_DIR);
  }

  // Get all files in source directory
  const files = await fs.readdir(SOURCE_DIR);

  // Filter for supported image formats (exclude .webp outputs)
  const imageFiles = files.filter(isSupportedFormat);

  if (imageFiles.length === 0) {
    console.log('\n📭 No images to process.');
    console.log(`   Looking for: ${imagesConfig.inputFormats.join(', ')}`);
    return;
  }

  console.log(`\n🖼️  Found ${imageFiles.length} image(s) to process:`);
  imageFiles.forEach(file => console.log(`   - ${file}`));

  // Process each image
  let successCount = 0;
  let errorCount = 0;

  for (const file of imageFiles) {
    const filePath = path.join(SOURCE_DIR, file);
    try {
      await processImage(filePath);
      successCount++;
    } catch (error) {
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully processed: ${successCount}`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount}`);
  }
  console.log('='.repeat(50));
  console.log('\n💡 Originals kept in src/media/');
  console.log('💡 WebP variants saved to src/assets/img/');
  console.log('💡 Next step: Run "npm run build" to copy WebP to public/');
}

// Run the script
processAllImages().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
