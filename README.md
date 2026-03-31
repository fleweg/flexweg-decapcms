# Flexweg Fleox - Static Site Generator

A modern static site generator with Bootstrap and Apple-inspired design. Built for easy content management and fast deployment.

## Features

- 🚀 **Fast & Static** - Pre-generated HTML for lightning-fast page loads
- 📝 **Markdown Content** - Write articles and pages in Markdown
- 🎨 **Apple-Inspired Design** - Clean, minimalist interface using Bootstrap
- ⚙️ **JSON Configuration** - Centralized theme and site settings
- 🔄 **Auto-Generated Feed** - Home page dynamically lists recent articles
- 📦 **Easy Deployment** - Built-in sync script for Flexweg infrastructure
- 🎛️ **Admin Panel** - Visual content management with Decap CMS

## Project Structure

```
flexweg-fleox/
├── src/                    # Source files
│   ├── templates/          # Handlebars templates
│   │   ├── home.hbs       # Home page
│   │   ├── article.hbs    # Article page
│   │   ├── articles-index.hbs
│   │   └── page.hbs       # Generic page
│   └── assets/            # Static assets
│       ├── css/
│       │   └── style.css  # Main stylesheet
│       ├── js/
│       │   └── main.js    # Main JavaScript
│       └── img/           # Images
│
├── content/               # Content files
│   ├── articles/         # Blog articles (Markdown)
│   └── pages/            # Static pages (Markdown)
│
├── config/               # Configuration files
│   ├── site.json        # Site metadata
│   ├── theme.json       # Design system (colors, fonts)
│   └── navigation.json  # Header & footer navigation
│
├── admin/                # Admin panel (Decap CMS)
│   ├── index.html       # Admin UI entry point
│   └── config.yml       # CMS configuration
│
├── public/              # Generated output (not in git)
│   └── [generated HTML files]
│
├── scripts/             # Helper scripts
│   └── new-article.js   # Create new article template
│
├── build.js            # Main build script
├── dev-server.js       # Development server with watch
└── sync-flexweg.js     # Deploy to Flexweg
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Site

```bash
npm run build
```

This generates the `public/` directory with all static files.

### 3. Development Mode

```bash
npm run dev
```

This starts a development server with:
- **Admin Panel**: http://localhost:3333/admin (Content Management UI)
- **Site Preview**: http://localhost:8080 (Live reload)
- File watching (auto-rebuild on changes)

### 4. Deploy

```bash
npm run deploy
```

Builds and syncs to your Flexweg infrastructure.

## Creating Content

### Option 1: Using the Admin Panel (Recommended)

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the admin panel: http://localhost:3333/admin

3. Click "Work with Local Git Repository" to start

4. Use the visual interface to:
   - Create and edit articles with live Markdown preview
   - Manage pages
   - Upload images (drag & drop)
   - Edit site configuration and theme
   - Manage navigation menus

### Option 2: Using the Command Line

```bash
npm run new-article "My Article Title"
```

This creates a new Markdown file in `content/articles/` with front-matter template.

Edit the generated file:

```markdown
---
title: "My Article Title"
date: 2024-03-27
author: "Your Name"
description: "Brief description"
image: "/assets/img/article-image.jpg"
tags: ["tag1", "tag2"]
excerpt: "Short preview text"
---

# My Article Title

Your content here...
```

### New Page

Create a new `.md` file in `content/pages/`:

```
content/pages/about.md          → public/about.html
content/pages/services/index.md → public/services/index.html
content/pages/services/web.md   → public/services/web.html
```

## Admin Panel

The project includes a powerful visual admin interface powered by Decap CMS.

### Accessing the Admin

1. Start the dev server: `npm run dev`
2. Open http://localhost:3333/admin in your browser
3. Click "Work with Local Git Repository"
4. Start creating and editing content!

### Features

- **📝 Rich Markdown Editor** - Write with live preview
- **🖼️ Media Library** - Upload and manage images with drag & drop
- **⚙️ Configuration Editor** - Visual forms for site, theme, and navigation settings
- **👁️ Live Preview** - See changes before publishing
- **🎯 Validation** - Built-in validation for required fields
- **🏷️ Tag Management** - Easy tag input for articles

### Managing Content

**Articles:**
- Go to "Collections" → "Articles"
- Click "New Article" to create
- Fill in title, author, date, description
- Add tags (press Enter after each tag)
- Upload a featured image (optional)
- Write content in Markdown with live preview
- Click "Save" to publish

**Pages:**
- Go to "Collections" → "Pages"
- Click "New Page"
- Write content in Markdown
- Save to create the page

**Site Configuration:**
- Go to "Collections" → "Site Configuration"
- Edit "Site Settings" for title, description, social links
- Edit "Theme Settings" to customize colors and fonts
- Edit "Navigation" to manage header and footer menus

### Tips

- All changes are saved directly to your file system
- The site rebuilds automatically when you save
- Check the terminal for build status
- Preview the site at http://localhost:8080

## Configuration

### Site Settings (`config/site.json`)

```json
{
  "title": "Your Site Title",
  "description": "Site description",
  "url": "https://yoursite.com",
  "author": "Your Name",
  "language": "fr"
}
```

### Theme Settings (`config/theme.json`)

Customize colors, fonts, spacing:

```json
{
  "colors": {
    "primary": "#000000",
    "accent": "#0071e3",
    ...
  },
  "fonts": {
    "primary": "...",
    ...
  }
}
```

Changes are automatically applied to `public/assets/css/theme.css` on build.

### Navigation (`config/navigation.json`)

Configure header and footer menus:

```json
{
  "header": {
    "links": [
      { "text": "Home", "url": "/" },
      { "text": "Articles", "url": "/articles/" }
    ]
  }
}
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build the site to `public/` |
| `npm run dev` | Start dev server with live reload |
| `npm run deploy` | Build and deploy to Flexweg |
| `npm run new-article "Title"` | Create new article template |
| `npm run clean` | Remove all files from `public/` |

## Deployment

The site deploys to static hosting via the included `sync-flexweg.js` script.

Required environment variables:
- `FLEXWEG_API_KEY` - Your API key
- `FLEXWEG_BASE_URL` - Base URL (default: http://static-host.local)

### GitHub Actions Example

```yaml
- name: Deploy
  env:
    FLEXWEG_API_KEY: ${{ secrets.FLEXWEG_API_KEY }}
  run: npm run deploy
```

## Adding Images

Place images in `src/assets/img/`:

```
src/assets/img/my-image.jpg → /assets/img/my-image.jpg
```

Reference in Markdown:

```markdown
![Alt text](/assets/img/my-image.jpg)
```

## Customization

### Adding Custom CSS

Edit `src/assets/css/style.css` or add new CSS files.

### Modifying Templates

Edit Handlebars templates in `src/templates/`:
- `base.hbs` - Base layout (header, footer)
- `home.hbs` - Home page with article feed
- `article.hbs` - Individual article layout
- `page.hbs` - Generic page layout

### Adding JavaScript

Add scripts to `src/assets/js/` or modify `main.js`.

## Tips

- Keep the `public/` directory out of git (already in `.gitignore`)
- Use relative URLs (`/path`) for links, CSS, JS, images
- Articles are automatically sorted by date (newest first)
- The home page shows the 6 most recent articles
- All file paths in `public/` match Nginx routing

## Troubleshooting

### Build fails

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Dev server not working

Make sure port 8080 is available, or modify `dev-server.js`.

### Deploy fails

Check that `FLEXWEG_API_KEY` environment variable is set.

## License

MIT

## Support

For issues or questions, see [CLAUDE.md](CLAUDE.md) for technical architecture details.