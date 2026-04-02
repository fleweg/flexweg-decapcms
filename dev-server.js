const chokidar = require('chokidar');
const { spawn } = require('child_process');
const path = require('path');
const express = require('express');
const cors = require('cors');

console.log('🔧 Starting development server...\n');

let buildInProgress = false;
let decapServerProcess = null;
let imageWatcherProcess = null;

// Function to run build
function runBuild() {
  if (buildInProgress) {
    console.log('⏳ Build already in progress, skipping...');
    return;
  }

  buildInProgress = true;
  console.log('🔨 Building site...');

  const build = spawn('node', ['build.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });

  build.on('close', (code) => {
    buildInProgress = false;
    if (code === 0) {
      console.log('✅ Build completed\n');
    } else {
      console.error('❌ Build failed\n');
    }
  });
}

// Initial build
runBuild();

// Start Decap CMS local backend server
console.log('🎛️  Starting Decap CMS local backend on port 8081...');
decapServerProcess = spawn('npx', ['decap-server'], {
  cwd: __dirname,
  shell: true
});

// Log decap-server output
decapServerProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.log(`[Decap] ${output}`);
  }
});

decapServerProcess.stderr.on('data', (data) => {
  const output = data.toString().trim();
  if (output && !output.includes('DeprecationWarning')) {
    console.error(`[Decap Error] ${output}`);
  }
});

// Give decap-server time to start
setTimeout(() => {
  console.log('✅ Decap CMS backend should be ready\n');
}, 3000);

// Start image watcher for automatic processing
console.log('📸 Starting image watcher...');
imageWatcherProcess = spawn('node', ['scripts/watch-images.js'], {
  cwd: __dirname,
  shell: true
});

// Log image watcher output
imageWatcherProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.log(output);
  }
});

imageWatcherProcess.stderr.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.error(`[Image Watcher Error] ${output}`);
  }
});

// Start Express server for Admin Panel
const app = express();
const ADMIN_PORT = 3333;
const http = require('http');

// Enable CORS for local development
app.use(cors());

// Proxy for Decap CMS backend API - must be before static middleware
app.use('/api/v1', (req, res) => {
  const targetPath = '/api/v1' + req.url;
  console.log(`[Proxy] ${req.method} ${targetPath}`);

  const options = {
    hostname: 'localhost',
    port: 8081,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: 'localhost:8081'
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    console.log(`[Proxy] Response: ${proxyRes.statusCode}`);

    // Copy headers from proxy response
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    res.writeHead(proxyRes.statusCode);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[Proxy] Error:', err.message);
    res.status(502).send('Bad Gateway');
  });

  // Pipe request body for POST/PUT requests
  req.pipe(proxyReq);
});

// Serve static files from public/ (for image previews in Decap CMS)
app.use(express.static(path.join(__dirname, 'public')));

// Serve config files for admin panel (needed for CDN URLs)
app.use('/config', express.static(path.join(__dirname, 'config')));

// Serve admin panel
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// API endpoint to trigger build from admin
app.post('/api/build', (req, res) => {
  console.log('🔨 Build triggered from admin panel...');
  runBuild();
  res.json({ success: true, message: 'Build started' });
});

// Start admin server
app.listen(ADMIN_PORT, () => {
  console.log(`📝 Admin Panel: http://localhost:${ADMIN_PORT}/admin`);
  console.log('   Click "Work with Local Git Repository" to start\n');
});

// Watch for changes
const watcher = chokidar.watch([
  'src/**/*',
  'content/**/*',
  'config/**/*'
], {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true
});

watcher
  .on('add', path => {
    console.log(`📄 File added: ${path}`);
    runBuild();
  })
  .on('change', path => {
    console.log(`📝 File changed: ${path}`);
    runBuild();
  })
  .on('unlink', path => {
    console.log(`🗑️  File removed: ${path}`);
    runBuild();
  });

console.log('👀 Watching for changes...');
console.log('📁 Watched directories: src/, content/, config/');
console.log('\nPress Ctrl+C to stop\n');

// Start live-server for auto-reload
console.log('🌐 Site Preview: http://localhost:8080\n');
const liveServer = spawn('npx', ['live-server', 'public', '--port=8080', '--no-browser'], {
  stdio: 'inherit',
  cwd: __dirname,
  shell: true
});

// Handle exit
process.on('SIGINT', () => {
  console.log('\n👋 Stopping development server...');
  watcher.close();
  liveServer.kill();
  if (decapServerProcess) {
    decapServerProcess.kill();
  }
  if (imageWatcherProcess) {
    imageWatcherProcess.kill();
  }
  process.exit(0);
});
