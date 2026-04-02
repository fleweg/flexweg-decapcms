const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');

// Initialize Markdown parser
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

// Paths
const PATHS = {
  src: path.join(__dirname, 'src'),
  content: path.join(__dirname, 'content'),
  config: path.join(__dirname, 'config'),
  public: path.join(__dirname, 'public'),
  templates: path.join(__dirname, 'src/templates'),
  assets: path.join(__dirname, 'src/assets')
};

// Load configuration files
function loadConfig() {
  const site = JSON.parse(fs.readFileSync(path.join(PATHS.config, 'site.json'), 'utf8'));
  const theme = JSON.parse(fs.readFileSync(path.join(PATHS.config, 'theme.json'), 'utf8'));
  const navigation = JSON.parse(fs.readFileSync(path.join(PATHS.config, 'navigation.json'), 'utf8'));
  const images = JSON.parse(fs.readFileSync(path.join(PATHS.config, 'images.json'), 'utf8'));

  return { site, theme, navigation, images };
}

/**
 * Transform image path to image object with all format variants
 * @param {string} imagePath - Original image path from front-matter (e.g., "/media/photo.jpg")
 * @param {string} imageAlt - Alt text for the image
 * @param {object} imagesConfig - Images configuration
 * @returns {object|null} Image object with format variants or null
 */
function transformImagePath(imagePath, imageAlt, imagesConfig) {
  if (!imagePath) return null;

  // Extract base name from original path (e.g., "/media/photo.jpg" → "photo")
  const basename = path.basename(imagePath, path.extname(imagePath));

  // Create object with all format variants
  const imageObject = {
    alt: imageAlt || ''
  };

  // Add each format variant (processed images are in /assets/img/)
  for (const formatName of Object.keys(imagesConfig.formats)) {
    const filename = `${basename}-${formatName}.${imagesConfig.outputFormat}`;
    imageObject[formatName] = `/assets/img/${filename}`;
  }

  return imageObject;
}

/**
 * Transform image URLs in HTML content from /media/ to /assets/img/ WebP variants
 * @param {string} html - HTML content
 * @param {object} imagesConfig - Images configuration
 * @returns {string} Transformed HTML
 */
function transformImagesInHTML(html, imagesConfig) {
  // Match <img> tags with src="/media/..."
  return html.replace(/<img\s+([^>]*\s+)?src="\/media\/([^"]+)"([^>]*)>/gi, (match, before, filename, after) => {
    // Extract basename without extension
    const basename = path.basename(filename, path.extname(filename));

    // Use large format for content images (can be customized)
    const webpFilename = `${basename}-large.${imagesConfig.outputFormat}`;
    const webpPath = `/assets/img/${webpFilename}`;

    // Reconstruct img tag with WebP path
    return `<img ${before || ''}src="${webpPath}"${after}>`;
  });
}

/**
 * Process shortcodes in content and convert them to HTML
 * @param {string} content - Markdown content with shortcodes
 * @returns {string} Content with shortcodes replaced by HTML
 */
function processShortcodes(content) {
  let processed = content;

  // YouTube shortcode: {{< youtube VIDEO_ID_OR_URL >}}
  processed = processed.replace(/{{<\s*youtube\s+(\S+)\s*>}}/g, (match, input) => {
    let videoId = input.trim();

    // Extract video ID from various YouTube URL formats
    if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
      // Handle youtu.be/VIDEO_ID format
      const youtuBeMatch = videoId.match(/youtu\.be\/([^\?&]+)/);
      if (youtuBeMatch) {
        videoId = youtuBeMatch[1];
      } else {
        // Handle youtube.com/watch?v=VIDEO_ID format
        const watchMatch = videoId.match(/[?&]v=([^&]+)/);
        if (watchMatch) {
          videoId = watchMatch[1];
        } else {
          // Handle youtube.com/embed/VIDEO_ID format
          const embedMatch = videoId.match(/\/embed\/([^\?&]+)/);
          if (embedMatch) {
            videoId = embedMatch[1];
          }
        }
      }
    }

    // Remove any query parameters (like ?si=...)
    videoId = videoId.split('?')[0].split('&')[0];

    return `<div class="ratio ratio-16x9 mb-4">
  <iframe src="https://www.youtube.com/embed/${videoId}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
  </iframe>
</div>`;
  });

  // Call to Action shortcode: {{< cta title="..." text="..." buttonText="..." buttonUrl="..." >}}
  processed = processed.replace(/{{<\s*cta\s+title="([^"]+)"\s+text="([^"]+)"\s+buttonText="([^"]+)"\s+buttonUrl="([^"]+)"\s*>}}/g,
    (match, title, text, buttonText, buttonUrl) => {
      return `<div class="alert alert-primary mb-4" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; color: white; padding: 2rem; border-radius: 12px;">
  <h3 style="color: white; margin-bottom: 1rem;">${title}</h3>
  <p style="margin-bottom: 1.5rem;">${text}</p>
  <a href="${buttonUrl}" class="btn btn-light">${buttonText}</a>
</div>`;
    }
  );

  // FAQ shortcode: {{< faq question="..." answer="..." >}}
  processed = processed.replace(/{{<\s*faq\s+question="([^"]+)"\s+answer="([^"]+)"\s*>}}/g,
    (match, question, answer) => {
      return `<div class="card mb-3" itemscope itemtype="https://schema.org/Question">
  <div class="card-body">
    <h5 class="card-title" style="color: #0071e3; margin-bottom: 0.75rem;" itemprop="name">Q: ${question}</h5>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p class="card-text" style="color: #6e6e73;" itemprop="text">A: ${answer}</p>
    </div>
  </div>
</div>`;
    }
  );

  // Alert shortcode: {{< alert type="info|success|warning|danger" text="..." >}}
  processed = processed.replace(/{{<\s*alert\s+type="([^"]+)"\s+text="([^"]+)"\s*>}}/g,
    (match, type, text) => {
      const colors = {
        info: '#0dcaf0',
        success: '#198754',
        warning: '#ffc107',
        danger: '#dc3545'
      };
      return `<div class="alert alert-${type} mb-4" style="border-left: 4px solid ${colors[type]}; padding: 1rem; border-radius: 4px;">
  ${text}
</div>`;
    }
  );

  // Figure shortcode: {{< figure src="..." alt="..." caption="..." >}}
  processed = processed.replace(/{{<\s*figure\s+src="([^"]+)"\s+alt="([^"]+)"(?:\s+caption="([^"]+)")?\s*>}}/g,
    (match, src, alt, caption) => {
      let html = `<figure class="mb-4" style="text-align: center;">
  <img src="${src}" alt="${alt}" class="img-fluid" style="max-width: 100%; height: auto; border-radius: 8px;">`;

      if (caption) {
        html += `
  <figcaption style="margin-top: 0.5rem; color: #6e6e73; font-size: 0.9rem; font-style: italic;">${caption}</figcaption>`;
      }

      html += `
</figure>`;
      return html;
    }
  );

  return processed;
}

// Register Handlebars helpers
function registerHelpers() {
  // Format date helper
  Handlebars.registerHelper('formatDate', function(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  // Active link helper
  Handlebars.registerHelper('isActive', function(url, currentUrl) {
    return url === currentUrl ? 'active' : '';
  });

  // Truncate text helper
  Handlebars.registerHelper('truncate', function(text, length) {
    if (!text || text.length <= length) return text;
    return text.substring(0, length) + '...';
  });
}

// Register Handlebars partials
function registerPartials() {
  const partialsDir = path.join(PATHS.templates, 'partials');

  if (!fs.existsSync(partialsDir)) {
    return;
  }

  const partialFiles = fs.readdirSync(partialsDir).filter(file => file.endsWith('.hbs'));

  partialFiles.forEach(file => {
    const partialName = path.basename(file, '.hbs');
    const partialPath = path.join(partialsDir, file);
    const partialContent = fs.readFileSync(partialPath, 'utf8');
    Handlebars.registerPartial(partialName, partialContent);
    console.log(`  ✓ Registered partial: ${partialName}`);
  });
}

// Load and compile template
function loadTemplate(templateName) {
  const templatePath = path.join(PATHS.templates, `${templateName}.hbs`);
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  return Handlebars.compile(templateContent);
}

// Get all articles with metadata
function getArticles(imagesConfig) {
  const articlesDir = path.join(PATHS.content, 'articles');

  if (!fs.existsSync(articlesDir)) {
    return [];
  }

  const files = fs.readdirSync(articlesDir).filter(file => file.endsWith('.md'));

  const articles = files.map(file => {
    const filePath = path.join(articlesDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);

    const slug = path.basename(file, '.md');

    // Process shortcodes before rendering Markdown
    const processedContent = processShortcodes(content);
    let htmlContent = md.render(processedContent);

    // Transform image URLs in content from /media/ to /assets/img/ WebP
    htmlContent = transformImagesInHTML(htmlContent, imagesConfig);

    // Transform image path to image object with all variants
    const imageObject = transformImagePath(data.image, data.imageAlt, imagesConfig);

    return {
      slug,
      title: data.title || 'Untitled',
      date: data.date || new Date(),
      author: data.author || '',
      description: data.description || '',
      image: imageObject,
      tags: data.tags || [],
      content: htmlContent,
      customCode: data.customCode || '',
      excerpt: data.excerpt || content.substring(0, 200),
      url: `/articles/${slug}.html`
    };
  });

  // Sort by date (newest first)
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  return articles;
}

// Build article pages
function buildArticles(config) {
  console.log('📝 Building articles...');

  const articles = getArticles(config.images);
  const template = loadTemplate('article');
  const outputDir = path.join(PATHS.public, 'articles');

  fs.ensureDirSync(outputDir);

  articles.forEach(article => {
    const html = template({
      ...config,
      article,
      currentUrl: article.url,
      pageTitle: `${article.title} - ${config.site.title}`
    });

    const outputPath = path.join(outputDir, `${article.slug}.html`);
    fs.writeFileSync(outputPath, html);
    console.log(`  ✓ ${article.slug}.html`);
  });

  // Create articles index
  const indexTemplate = loadTemplate('articles-index');
  const indexHtml = indexTemplate({
    ...config,
    articles,
    currentUrl: '/articles/',
    pageTitle: `Articles - ${config.site.title}`
  });

  fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml);
  console.log(`  ✓ articles/index.html`);

  return articles;
}

// Build home page
function buildHome(config, articles) {
  console.log('🏠 Building home page...');

  const template = loadTemplate('home');
  const recentArticles = articles.slice(0, 6); // Latest 6 articles

  const html = template({
    ...config,
    articles: recentArticles,
    currentUrl: '/',
    pageTitle: config.site.title
  });

  fs.writeFileSync(path.join(PATHS.public, 'index.html'), html);
  console.log('  ✓ index.html');
}

// Build 404 page
function build404(config) {
  console.log('🚫 Building 404 page...');

  const template = loadTemplate('404');

  const html = template({
    ...config,
    currentUrl: '/404.html',
    pageTitle: '404 - Page non trouvée'
  });

  fs.writeFileSync(path.join(PATHS.public, '404.html'), html);
  console.log('  ✓ 404.html');
}

// Build static pages from content/pages
function buildPages(config) {
  console.log('📄 Building pages...');

  const pagesDir = path.join(PATHS.content, 'pages');

  if (!fs.existsSync(pagesDir)) {
    console.log('  ℹ️  No pages directory found');
    return;
  }

  const template = loadTemplate('page');

  function processDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    items.forEach(item => {
      const itemPath = path.join(dir, item.name);
      const itemRelativePath = path.join(relativePath, item.name);

      if (item.isDirectory()) {
        // Process subdirectory
        processDirectory(itemPath, itemRelativePath);
      } else if (item.isFile() && item.name.endsWith('.md')) {
        // Process markdown file
        const fileContent = fs.readFileSync(itemPath, 'utf8');
        const { data, content } = matter(fileContent);

        // Process shortcodes before rendering Markdown
        const processedContent = processShortcodes(content);
        let htmlContent = md.render(processedContent);

        // Transform image URLs in content from /media/ to /assets/img/ WebP
        htmlContent = transformImagesInHTML(htmlContent, config.images);

        const slug = path.basename(item.name, '.md');
        const outputRelativeDir = path.dirname(itemRelativePath);
        const outputDir = path.join(PATHS.public, outputRelativeDir);

        fs.ensureDirSync(outputDir);

        const outputFileName = slug === 'index' ? 'index.html' : `${slug}.html`;
        const outputPath = path.join(outputDir, outputFileName);

        const pageUrl = path.join('/', outputRelativeDir, outputFileName).replace(/\\/g, '/');

        const html = template({
          ...config,
          page: {
            title: data.title || 'Page',
            description: data.description || '',
            content: htmlContent,
            customCode: data.customCode || ''
          },
          currentUrl: pageUrl,
          pageTitle: `${data.title || 'Page'} - ${config.site.title}`
        });

        fs.writeFileSync(outputPath, html);
        console.log(`  ✓ ${itemRelativePath.replace('.md', '.html')}`);
      }
    });
  }

  processDirectory(pagesDir);
}

// Copy assets to public
function copyAssets() {
  console.log('📦 Copying assets...');

  if (fs.existsSync(PATHS.assets)) {
    const publicAssetsPath = path.join(PATHS.public, 'assets');

    // Copy CSS and JS directories as-is
    const cssSrc = path.join(PATHS.assets, 'css');
    const jsSrc = path.join(PATHS.assets, 'js');

    if (fs.existsSync(cssSrc)) {
      fs.copySync(cssSrc, path.join(publicAssetsPath, 'css'));
      console.log('  ✓ CSS copied');
    }

    if (fs.existsSync(jsSrc)) {
      fs.copySync(jsSrc, path.join(publicAssetsPath, 'js'));
      console.log('  ✓ JS copied');
    }

    // For images: only copy .webp files (processed variants, not originals)
    const imgSrc = path.join(PATHS.assets, 'img');
    const imgDest = path.join(publicAssetsPath, 'img');

    if (fs.existsSync(imgSrc)) {
      fs.ensureDirSync(imgDest);
      const files = fs.readdirSync(imgSrc);

      let copiedCount = 0;
      files.forEach(file => {
        if (path.extname(file).toLowerCase() === '.webp') {
          fs.copySync(path.join(imgSrc, file), path.join(imgDest, file));
          copiedCount++;
        }
      });

      console.log(`  ✓ Images copied (${copiedCount} WebP files, originals excluded)`);
    }
  }

  // Copy original images to public/media/ for Decap CMS preview
  const mediaSrc = path.join(__dirname, 'src/media');
  const mediaDest = path.join(PATHS.public, 'media');

  if (fs.existsSync(mediaSrc)) {
    fs.copySync(mediaSrc, mediaDest);
    const files = fs.readdirSync(mediaSrc).filter(f => f !== '.gitkeep');
    console.log(`  ✓ Media originals copied (${files.length} files for preview)`);
  }

  // Copy favicon.ico to public root
  const faviconSrc = path.join(__dirname, 'src/favicon.ico');
  const faviconDest = path.join(PATHS.public, 'favicon.ico');

  if (fs.existsSync(faviconSrc)) {
    fs.copySync(faviconSrc, faviconDest);
    console.log('  ✓ Favicon copied');
  }
}

// Generate CSS from theme config
function generateThemeCSS(theme) {
  console.log('🎨 Generating theme CSS...');

  const css = `
/* Auto-generated theme CSS */
:root {
  /* Colors */
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-accent: ${theme.colors.accent};
  --color-text: ${theme.colors.text};
  --color-text-light: ${theme.colors.textLight};
  --color-background: ${theme.colors.background};
  --color-background-alt: ${theme.colors.backgroundAlt};
  --color-border: ${theme.colors.border};

  /* Fonts */
  --font-primary: ${theme.fonts.primary};
  --font-mono: ${theme.fonts.mono};

  /* Spacing */
  --section-padding: ${theme.spacing.sectionPadding};
  --container-max-width: ${theme.spacing.containerMaxWidth};

  /* Other */
  --border-radius: ${theme.borderRadius};
  --transition: ${theme.transition};
}
  `.trim();

  const cssDir = path.join(PATHS.public, 'assets/css');
  fs.ensureDirSync(cssDir);
  fs.writeFileSync(path.join(cssDir, 'theme.css'), css);
  console.log('  ✓ theme.css generated');
}

// Main build function
async function build() {
  console.log('🚀 Starting build...\n');

  try {
    // Clean public directory
    fs.emptyDirSync(PATHS.public);

    // Load configuration
    const config = loadConfig();

    // Register Handlebars helpers
    registerHelpers();

    // Register Handlebars partials
    console.log('🧩 Registering partials...');
    registerPartials();

    // Generate theme CSS
    generateThemeCSS(config.theme);

    // Copy assets
    copyAssets();

    // Build articles
    const articles = buildArticles(config);

    // Build pages
    buildPages(config);

    // Build home page (must be last to include all articles)
    buildHome(config, articles);

    // Build 404 page
    build404(config);

    console.log('\n✅ Build completed successfully!');
    console.log(`📁 Output: ${PATHS.public}`);

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run build
build();
