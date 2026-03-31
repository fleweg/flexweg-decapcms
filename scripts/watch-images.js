const chokidar = require('chokidar');
const { spawn } = require('child_process');
const path = require('path');

// Load configuration
const imagesConfig = require('../config/images.json');

const SOURCE_DIR = path.resolve(__dirname, '../src/media');

console.log('👀 Watching for new images...');
console.log(`📁 Directory: ${SOURCE_DIR}`);
console.log(`📸 Supported formats: ${imagesConfig.inputFormats.join(', ')}\n`);

let isProcessing = false;

// Watch only for supported input formats (not .webp)
const watchPattern = SOURCE_DIR + '/*{' + imagesConfig.inputFormats.join(',') + '}';

const watcher = chokidar.watch(watchPattern, {
  persistent: true,
  ignoreInitial: true, // Don't process existing files on start
  awaitWriteFinish: {
    stabilityThreshold: 1000, // Wait 1s for file to finish writing
    pollInterval: 100
  }
});

watcher.on('add', (filePath) => {
  if (isProcessing) {
    console.log('⏳ Processing already in progress, queuing...');
    return;
  }

  const filename = path.basename(filePath);
  console.log(`\n🆕 New image detected: ${filename}`);
  console.log('🔄 Starting automatic processing...\n');

  isProcessing = true;

  const processor = spawn('node', ['scripts/process-images.js'], {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });

  processor.on('close', (code) => {
    isProcessing = false;
    if (code === 0) {
      console.log('\n✅ Automatic processing completed');
      console.log('💡 Build will auto-refresh if dev server is running\n');
    } else {
      console.error('\n❌ Processing failed\n');
    }
  });
});

watcher.on('error', error => {
  console.error('❌ Watcher error:', error);
});

console.log('✅ Watcher started. Upload images via Decap CMS!\n');
console.log('Press Ctrl+C to stop...\n');

// Handle exit
process.on('SIGINT', () => {
  console.log('\n👋 Stopping image watcher...');
  watcher.close();
  process.exit(0);
});
