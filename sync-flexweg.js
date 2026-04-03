const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.FLEXWEG_API_KEY;
const BASE_URL = process.env.FLEXWEG_BASE_URL || 'http://static-host.local';
const BUILD_DIR = './public'; // Adaptez selon votre projet

// Rate limiting configuration
const RATE_LIMIT_PER_MINUTE = 50; // Use 9 instead of 10 to be safe
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute in milliseconds
const MIN_REQUEST_INTERVAL_MS = 100; // Minimum delay between requests
const MAX_RETRIES = 3; // Maximum number of retries for rate-limited requests

// Rate limiting state
let requestTimestamps = [];
let lastRequestTime = 0;

// Error tracking
let uploadErrors = [];
let deleteErrors = [];

// Extensions supportées par Flexweg
const ALLOWED_EXTENSIONS = [
  'html', 'css', 'js',
  'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico',
  'pdf', 'woff', 'woff2', 'ttf', 'otf',
  'json', 'xml', 'txt',
  'mp4', 'webm', 'ogg', 'mov' // Video formats
];

// Extensions binaires nécessitant base64
const BINARY_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'ico',
  'pdf', 'woff', 'woff2', 'ttf', 'otf'
];

// Extensions vidéo (utiliseront l'API /api/v1/videos/upload)
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov'];

function isFileAllowed(filename) {
  const ext = path.extname(filename).toLowerCase().slice(1);
  return ALLOWED_EXTENSIONS.includes(ext);
}

function isBinaryFile(filename) {
  const ext = path.extname(filename).toLowerCase().slice(1);
  return BINARY_EXTENSIONS.includes(ext);
}

function isVideoFile(filename) {
  const ext = path.extname(filename).toLowerCase().slice(1);
  return VIDEO_EXTENSIONS.includes(ext);
}

/**
 * Enforces rate limiting by pausing execution if needed
 * Ensures we don't exceed RATE_LIMIT_PER_MINUTE requests
 */
async function enforceRateLimit() {
  const now = Date.now();

  // Ensure minimum interval between requests
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest));
  }

  // Remove timestamps older than the rate limit window
  requestTimestamps = requestTimestamps.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  // If we've reached the limit, wait until the oldest request expires
  if (requestTimestamps.length >= RATE_LIMIT_PER_MINUTE) {
    const oldestTimestamp = requestTimestamps[0];
    const timeToWait = RATE_LIMIT_WINDOW_MS - (now - oldestTimestamp) + 500; // +500ms buffer for safety

    if (timeToWait > 0) {
      const seconds = (timeToWait / 1000).toFixed(1);
      console.log(`⏳ Rate limit reached (${RATE_LIMIT_PER_MINUTE + 1}/min), waiting ${seconds}s...`);
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }

    // Clean up again after waiting
    const nowAfterWait = Date.now();
    requestTimestamps = requestTimestamps.filter(
      timestamp => nowAfterWait - timestamp < RATE_LIMIT_WINDOW_MS
    );
  }

  // Record this request
  const finalNow = Date.now();
  requestTimestamps.push(finalNow);
  lastRequestTime = finalNow;
}

async function uploadVideo(filePath, fullPath, retryCount = 0) {
  try {
    // Enforce rate limiting before making the request
    await enforceRateLimit();

    const FormData = require('form-data');
    const formData = new FormData();

    // Add file as stream
    formData.append('file', fs.createReadStream(fullPath));
    formData.append('path', filePath);

    const response = await axios.post(
      `${BASE_URL}/api/v1/videos/upload`,
      formData,
      {
        headers: {
          'X-API-Key': API_KEY,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    const sizeMB = (response.data.size / (1024 * 1024)).toFixed(2);
    console.log(`✓ ${filePath} (${sizeMB} MB) [VIDEO]`);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    const isRateLimitError = error.response?.status === 429 || errorMsg.includes('Rate limit');

    // Retry logic for rate limit errors
    if (isRateLimitError && retryCount < MAX_RETRIES) {
      const waitTime = RATE_LIMIT_WINDOW_MS + 1000;
      const seconds = (waitTime / 1000).toFixed(1);
      console.log(`⏳ Rate limit hit for ${filePath}, waiting ${seconds}s before retry ${retryCount + 1}/${MAX_RETRIES}...`);

      requestTimestamps = [];
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return uploadVideo(filePath, fullPath, retryCount + 1);
    }

    console.error(`✗ ${filePath}: ${errorMsg}`);
    uploadErrors.push({ file: filePath, error: errorMsg });
    return null;
  }
}

async function uploadFile(filePath, fullPath, retryCount = 0) {
  // Use dedicated video upload API for video files
  if (isVideoFile(filePath)) {
    return uploadVideo(filePath, fullPath, retryCount);
  }

  try {
    // Enforce rate limiting before making the request
    await enforceRateLimit();

    const isBinary = isBinaryFile(filePath);

    // Lire le fichier (texte ou binaire)
    const content = isBinary
      ? fs.readFileSync(fullPath).toString('base64')
      : fs.readFileSync(fullPath, 'utf8');

    const payload = {
      path: filePath,
      content: content
    };

    // Ajouter l'encoding pour les fichiers binaires
    if (isBinary) {
      payload.encoding = 'base64';
    }

    const response = await axios.post(
      `${BASE_URL}/api/v1/files/upload`,
      payload,
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const sizeFormatted = response.data.size_formatted || '';
    console.log(`✓ ${filePath} (${sizeFormatted})`);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    const isRateLimitError = error.response?.status === 429 || errorMsg.includes('Rate limit');

    // Retry logic for rate limit errors
    if (isRateLimitError && retryCount < MAX_RETRIES) {
      const waitTime = RATE_LIMIT_WINDOW_MS + 1000; // Wait full minute + 1 second buffer
      const seconds = (waitTime / 1000).toFixed(1);
      console.log(`⏳ Rate limit hit for ${filePath}, waiting ${seconds}s before retry ${retryCount + 1}/${MAX_RETRIES}...`);

      // Reset rate limiting state to start fresh
      requestTimestamps = [];

      await new Promise(resolve => setTimeout(resolve, waitTime));
      return uploadFile(filePath, fullPath, retryCount + 1);
    }

    // Log error and track it
    console.error(`✗ ${filePath}: ${errorMsg}`);
    uploadErrors.push({ file: filePath, error: errorMsg });
    return null;
  }
}

async function deleteFile(filePath, retryCount = 0) {
  try {
    // Enforce rate limiting before making the request
    await enforceRateLimit();

    await axios.delete(
      `${BASE_URL}/api/v1/files/delete?path=${encodeURIComponent(filePath)}`,
      {
        headers: {
          'X-API-Key': API_KEY
        }
      }
    );
    console.log(`🗑️  ${filePath}`);
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    const isRateLimitError = error.response?.status === 429 || errorMsg.includes('Rate limit');

    // Retry logic for rate limit errors
    if (isRateLimitError && retryCount < MAX_RETRIES) {
      const waitTime = RATE_LIMIT_WINDOW_MS + 1000; // Wait full minute + 1 second buffer
      const seconds = (waitTime / 1000).toFixed(1);
      console.log(`⏳ Rate limit hit for ${filePath}, waiting ${seconds}s before retry ${retryCount + 1}/${MAX_RETRIES}...`);

      // Reset rate limiting state to start fresh
      requestTimestamps = [];

      await new Promise(resolve => setTimeout(resolve, waitTime));
      return deleteFile(filePath, retryCount + 1);
    }

    // Log error and track it
    console.error(`✗ Delete failed for ${filePath}: ${errorMsg}`);
    deleteErrors.push({ file: filePath, error: errorMsg });
  }
}

async function deleteFolder(folderPath, retryCount = 0) {
  try {
    // Enforce rate limiting before making the request
    await enforceRateLimit();

    await axios.delete(
      `${BASE_URL}/api/v1/files/delete-folder?path=${encodeURIComponent(folderPath)}`,
      {
        headers: {
          'X-API-Key': API_KEY
        }
      }
    );
    console.log(`🗑️  ${folderPath}/ (folder)`);
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    const isRateLimitError = error.response?.status === 429 || errorMsg.includes('Rate limit');

    // Retry logic for rate limit errors
    if (isRateLimitError && retryCount < MAX_RETRIES) {
      const waitTime = RATE_LIMIT_WINDOW_MS + 1000; // Wait full minute + 1 second buffer
      const seconds = (waitTime / 1000).toFixed(1);
      console.log(`⏳ Rate limit hit for ${folderPath}, waiting ${seconds}s before retry ${retryCount + 1}/${MAX_RETRIES}...`);

      // Reset rate limiting state to start fresh
      requestTimestamps = [];

      await new Promise(resolve => setTimeout(resolve, waitTime));
      return deleteFolder(folderPath, retryCount + 1);
    }

    // Log error and track it
    console.error(`✗ Delete folder failed for ${folderPath}: ${errorMsg}`);
    deleteErrors.push({ file: folderPath, error: errorMsg });
  }
}

/**
 * Get files that were modified or added in the last commit
 * Returns relative paths from BUILD_DIR
 */
function getModifiedAndAddedFiles() {
  const { execSync } = require('child_process');
  try {
    let output;
    try {
      // Get added and modified files (A=Added, M=Modified, C=Copied, R=Renamed)
      output = execSync('git diff --name-status --diff-filter=AMCR HEAD~1 HEAD', {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (error) {
      // First commit or shallow clone - try alternative approach
      try {
        output = execSync('git diff-tree --no-commit-id --name-status --diff-filter=AMCR -r HEAD', {
          encoding: 'utf8',
          cwd: process.cwd(),
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (e) {
        // No git history - return empty (will upload all files as fallback)
        console.log('ℹ️  No git history available - will sync all files');
        return null;
      }
    }

    const modifiedFiles = output
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Format: "A\tpath" or "M\tpath" or "R100\told\tnew"
        const parts = line.split('\t');
        const status = parts[0];
        let filePath;

        if (status.startsWith('R')) {
          // Renamed file - use the new name (last part)
          filePath = parts[parts.length - 1];
        } else {
          // Added/Modified - use the path
          filePath = parts[1];
        }

        // Only keep files in BUILD_DIR
        const buildDirPrefix = BUILD_DIR.replace('./', '');
        if (!filePath.startsWith(buildDirPrefix)) {
          return null;
        }

        // Remove BUILD_DIR prefix to get relative path
        const relativePath = filePath.substring(buildDirPrefix.length + 1);
        return relativePath;
      })
      .filter(filePath => filePath && isFileAllowed(path.basename(filePath)));

    return modifiedFiles;
  } catch (error) {
    // No git or error - return null to indicate fallback to full sync
    return null;
  }
}

/**
 * Get files and folders that were deleted in the last commit
 */
function getDeletedItems() {
  const { execSync } = require('child_process');
  try {
    let output;
    try {
      output = execSync('git diff --name-status --diff-filter=D HEAD~1 HEAD', {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (error) {
      try {
        output = execSync('git diff-tree --no-commit-id --name-status --diff-filter=D -r HEAD', {
          encoding: 'utf8',
          cwd: process.cwd(),
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (e) {
        console.log('ℹ️  No git history available - skipping deletion detection');
        return { files: [], folders: [] };
      }
    }

    const deletedPaths = output
      .split('\n')
      .filter(line => line.startsWith('D\t') || line.startsWith('D '))
      .map(line => {
        const filePath = line.substring(2).trim();
        const buildDirPrefix = BUILD_DIR.replace('./', '');
        const relativePath = filePath.startsWith(buildDirPrefix)
          ? filePath.substring(buildDirPrefix.length + 1)
          : filePath;
        return relativePath;
      })
      .filter(filePath => filePath);

    // Separate files and folders
    const folders = new Set();
    const files = [];

    deletedPaths.forEach(itemPath => {
      if (isFileAllowed(path.basename(itemPath))) {
        files.push(itemPath);
      }

      const pathParts = itemPath.split('/');
      if (pathParts.length > 1) {
        for (let i = 1; i < pathParts.length; i++) {
          folders.add(pathParts.slice(0, i).join('/'));
        }
      }
    });

    const sortedFolders = Array.from(folders).sort((a, b) => {
      return b.split('/').length - a.split('/').length;
    });

    return { files, folders: sortedFolders };
  } catch (error) {
    return { files: [], folders: [] };
  }
}

async function syncDirectory(dirPath, baseDir = dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      // Recursion into subdirectories
      await syncDirectory(fullPath, baseDir);
    } else if (entry.isFile() && isFileAllowed(entry.name)) {
      // Upload files sequentially with automatic rate limiting
      await uploadFile(relativePath, fullPath);
    }
  }
}

async function syncSpecificFiles(filePaths, baseDir) {
  for (const relativePath of filePaths) {
    const fullPath = path.join(baseDir, relativePath);

    // Check if file exists (might have been deleted after git diff)
    if (fs.existsSync(fullPath)) {
      await uploadFile(relativePath, fullPath);
    }
  }
}

async function main() {
  if (!API_KEY) {
    console.error('ERROR: FLEXWEG_API_KEY environment variable is not set');
    process.exit(1);
  }

  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`ERROR: Build directory ${BUILD_DIR} does not exist`);
    process.exit(1);
  }

  console.log('🚀 Starting sync to Flexweg...');
  console.log(`📁 Build directory: ${BUILD_DIR}`);
  console.log(`📝 Allowed file types: ${ALLOWED_EXTENSIONS.join(', ')}\n`);

  try {
    // 1. Detect and delete removed files/folders
    const { files: deletedFiles, folders: deletedFolders } = getDeletedItems();
    const totalDeleted = deletedFiles.length + deletedFolders.length;

    if (totalDeleted > 0) {
      console.log(`🗑️  Deleting ${totalDeleted} removed item(s)...`);

      // Delete individual files first
      for (const filePath of deletedFiles) {
        await deleteFile(filePath);
      }

      // Then delete folders (deepest to shallowest)
      for (const folderPath of deletedFolders) {
        await deleteFolder(folderPath);
      }

      console.log('');
    }

    // 2. Upload modified/added files only (or all files if git detection fails)
    const modifiedFiles = getModifiedAndAddedFiles();

    if (modifiedFiles === null) {
      // No git history - fallback to syncing all files
      console.log('📤 Syncing all files (no git history detected)...\n');
      await syncDirectory(BUILD_DIR);
    } else if (modifiedFiles.length === 0) {
      console.log('ℹ️  No files to sync (no changes detected)\n');
    } else {
      console.log(`📤 Syncing ${modifiedFiles.length} modified/added file(s)...\n`);
      await syncSpecificFiles(modifiedFiles, BUILD_DIR);
    }

    // 3. Check for errors and fail if any
    const totalErrors = uploadErrors.length + deleteErrors.length;

    if (totalErrors > 0) {
      console.error('\n❌ Sync completed with errors:\n');

      if (deleteErrors.length > 0) {
        console.error(`📛 Delete errors (${deleteErrors.length}):`);
        deleteErrors.forEach(({ file, error }) => {
          console.error(`   - ${file}: ${error}`);
        });
        console.error('');
      }

      if (uploadErrors.length > 0) {
        console.error(`📛 Upload errors (${uploadErrors.length}):`);
        uploadErrors.forEach(({ file, error }) => {
          console.error(`   - ${file}: ${error}`);
        });
        console.error('');
      }

      console.error(`❌ Failed to sync ${totalErrors} file(s). Please fix the errors above.`);
      process.exit(1);
    }

    console.log('\n✅ All files synced successfully!');
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

main();
