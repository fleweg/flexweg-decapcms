# Claude.md - Technical Architecture

This document explains the technical architecture and design decisions for the Flexweg Fleox static site generator.

## Overview

Flexweg Fleox is a custom static site generator built with Node.js that transforms Markdown content and JSON configuration into a production-ready static website.

## Architecture

### Build Pipeline

```
Content (Markdown + JSON) → Build Script → Static HTML → Deploy
         ↑
    Admin Panel (Decap CMS)
```

1. **Source Files** - Markdown articles/pages, JSON configs, Handlebars templates
2. **Admin Panel** - Visual content management interface (optional)
3. **Build Process** - Parse, transform, compile, generate
4. **Output** - Static HTML/CSS/JS files in `public/`
5. **Deployment** - Sync to Flexweg infrastructure

### Key Components

#### 1. Build Script (`build.js`)

Main orchestrator that:
- Loads configuration from JSON files
- Compiles Handlebars templates
- Parses Markdown with gray-matter front-matter
- Generates HTML pages
- Copies assets
- Creates theme CSS from JSON config

**Technologies:**
- `handlebars` - Template engine
- `markdown-it` - Markdown parser
- `gray-matter` - YAML front-matter parser
- `fs-extra` - Enhanced file system operations

#### 2. Template System

**Standalone Template Pattern:**
Each template is a complete HTML document with full structure (DOCTYPE, head, header, footer).
This simplifies template management and avoids partial inheritance complexity.

**Templates:**
- `base.hbs` - Layout wrapper (header, footer, meta tags)
- `home.hbs` - Home page with article feed
- `article.hbs` - Individual article page
- `articles-index.hbs` - All articles listing
- `page.hbs` - Generic page template

**Handlebars Helpers:**
- `formatDate` - Format dates in French locale
- `isActive` - Add 'active' class to current nav item
- `truncate` - Truncate text to specified length

#### 3. Content Management

**Articles** (`content/articles/*.md`):
- Written in Markdown with YAML front-matter
- Automatically sorted by date (newest first)
- Generated URLs: `/articles/{slug}.html`
- Supports metadata: title, date, author, tags, image, excerpt

**Pages** (`content/pages/**/*.md`):
- Hierarchical directory structure
- Maps 1:1 to URL structure
- Example: `pages/about.md` → `public/about.html`
- Example: `pages/services/index.md` → `public/services/index.html`

**Front-matter Schema:**
```yaml
---
title: "Article Title"           # Required
date: 2024-03-27                # Required for articles
author: "Author Name"            # Optional
description: "SEO description"   # Optional
image: "/path/to/image.jpg"     # Optional
tags: ["tag1", "tag2"]          # Optional
excerpt: "Preview text"          # Optional
---
```

#### 4. Configuration System

**Site Config** (`config/site.json`):
- Global site metadata
- SEO defaults
- Social media links
- Passed to all templates

**Theme Config** (`config/theme.json`):
- Design tokens (colors, fonts, spacing)
- Auto-generates CSS custom properties
- Single source of truth for design system
- No need to edit CSS for theme changes

**Navigation Config** (`config/navigation.json`):
- Header and footer menus
- Centralized link management
- Easy to update without touching templates

#### 5. Design System

**CSS Architecture:**
- Bootstrap 5.3+ for grid and components
- Custom CSS for Apple-inspired aesthetics
- CSS Custom Properties from `theme.json`
- Mobile-first responsive design

**Design Principles:**
- Minimalism (Apple-inspired)
- Content-first approach
- Generous whitespace
- Smooth transitions
- Accessible contrast ratios

**Key Features:**
- Sticky header with blur effect
- Card-based article previews
- Smooth hover states
- Responsive typography (clamp)
- System font stack for performance

#### 6. Development Workflow

**Dev Server** (`dev-server.js`):
- File watcher using `chokidar`
- Auto-rebuild on changes to src/, content/, config/
- Live reload using `live-server`
- Runs on http://localhost:8080

**Helper Scripts:**
- `new-article.js` - Scaffolds new article with template
- Auto-generates slug from title
- Validates uniqueness

#### 7. Deployment

**Sync Script** (`sync-flexweg.js`):
- Detects added/modified/deleted files via Git
- Uploads to Flexweg API
- Supports text and binary files (base64 encoding)
- Error tracking and reporting
- Batch uploads for performance

**Environment Variables:**
- `FLEXWEG_API_KEY` - Authentication
- `FLEXWEG_BASE_URL` - API endpoint

## Design Decisions

### Why Static Generation?

1. **Performance** - Pre-rendered HTML loads instantly
2. **Security** - No database or backend to compromise
3. **Scalability** - CDN-friendly, handles traffic spikes
4. **Cost** - Cheap hosting (even free options)
5. **Version Control** - All content in Git

### Why Custom Generator vs. Jekyll/Hugo/Gatsby?

1. **Simplicity** - No learning curve, pure JavaScript
2. **Flexibility** - Full control over build process
3. **Customization** - Easy to modify templates/logic
4. **Dependencies** - Minimal, well-maintained packages
5. **French-first** - Date formatting, localization built-in

### Why Handlebars?

1. **Logic-less** - Forces separation of concerns
2. **Simple syntax** - Easy to learn and read
3. **Partial support** - Template composition
4. **Helpers** - Extensible for custom logic
5. **Performance** - Pre-compiles templates

### Why Bootstrap?

1. **Rapid prototyping** - Component library included
2. **Responsive grid** - Mobile-first out of the box
3. **Accessibility** - ARIA attributes built-in
4. **Customization** - Easy to override with custom CSS
5. **Familiar** - Well-documented, widely used

### Why Decap CMS?

1. **Zero backend code** - Client-side only, no server to maintain
2. **Git-friendly** - Directly edits Markdown files with front-matter
3. **Professional UI** - Rich editor, media library, live preview
4. **Simple setup** - One HTML file + one YAML config
5. **No database** - Works with file system only
6. **Local development** - Test mode doesn't require Git authentication

## Admin Panel Architecture

### Overview

The admin panel is powered by **Decap CMS** (formerly Netlify CMS), a Git-based headless CMS that runs entirely in the browser. It provides a visual interface for managing content without requiring a backend server or database.

### How It Works

```
Browser → Decap CMS UI → Local File System → Content Files
                                            ↓
                                      Auto Rebuild
                                            ↓
                                     Updated Site
```

1. **Decap CMS** loads as a Single Page Application (SPA) in the browser
2. User edits content through the visual interface
3. Changes are written directly to Markdown/JSON files
4. File watcher detects changes and triggers rebuild
5. Live server refreshes the preview automatically

### Components

#### 1. Admin Interface (`admin/index.html`)

Minimal HTML file that loads Decap CMS from CDN:

```html
<script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
```

**Features:**
- Loads the entire CMS UI (React-based)
- No build step required
- ~500KB gzipped from CDN

#### 2. Configuration (`admin/config.yml`)

YAML file that defines:
- **Collections** - Content types (articles, pages)
- **Fields** - Form inputs for each content type
- **Widgets** - Input types (string, text, markdown, image, etc.)
- **Backend** - Storage configuration (local test mode for development)
- **Media** - Upload folder and public path

**Key Configuration Sections:**

```yaml
collections:
  - name: "articles"
    folder: "content/articles"
    fields:
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Body", name: "body", widget: "markdown"}
```

#### 3. Dev Server Integration (`dev-server.js`)

Express server that:
- Serves the admin panel at `/admin`
- Provides CORS headers for local development
- Runs alongside the build watcher and live server
- Handles API requests (future: trigger builds manually)

**Ports:**
- `3333` - Admin panel (Express)
- `8080` - Site preview (live-server)

### Content Management Flow

#### Creating an Article

1. User opens http://localhost:3333/admin
2. Clicks "Collections" → "Articles" → "New Article"
3. Fills form fields:
   - **String widgets** - Title, author
   - **Datetime widget** - Publication date
   - **List widget** - Tags (multi-entry)
   - **Image widget** - Featured image upload
   - **Markdown widget** - Article body with preview
4. Clicks "Save"
5. Decap CMS writes to `content/articles/article-slug.md`
6. File watcher detects change → triggers build
7. Site preview auto-refreshes

#### Front-matter Generation

Decap CMS automatically generates YAML front-matter:

```yaml
---
title: "Article Title"
date: 2024-03-27
author: "Frederic Leaux"
description: "Article description"
image: "/assets/img/uploaded-image.jpg"
tags: ["tag1", "tag2"]
excerpt: "Short excerpt"
---

Article body content...
```

#### Image Upload

1. User clicks "Choose an image" or drags file
2. Decap CMS uploads to `src/assets/img/`
3. Returns path as `/assets/img/filename.jpg`
4. Path is saved in the field value
5. Image is included in next build

### Widget Types Used

| Widget | Use Case | Example |
|--------|----------|---------|
| `string` | Short text | Title, author |
| `text` | Multi-line text | Description, excerpt |
| `markdown` | Rich content | Article body |
| `datetime` | Dates | Publication date |
| `image` | File upload | Featured images |
| `list` | Multiple values | Tags |
| `object` | Nested fields | Social links |
| `select` | Dropdown | Language selector |

### Configuration Files Management

Decap CMS can edit JSON configuration files directly:

```yaml
collections:
  - name: "config"
    files:
      - label: "Site Settings"
        file: "config/site.json"
        fields:
          - {label: "Title", name: "title", widget: "string"}
```

Changes to config files:
1. Edited through visual form
2. Saved directly to JSON file
3. Trigger rebuild
4. New settings applied

### Local vs Production Mode

**Development (local_backend: true):**
- Uses browser's LocalStorage
- No Git authentication required
- Perfect for testing

**Production (Git backend):**
- Integrates with Git provider (GitHub, GitLab, Bitbucket)
- Requires authentication
- Commits changes directly to repository
- Can trigger CI/CD pipelines

For this project, we use **local_backend** for development simplicity.

### Advantages

1. **No backend to maintain** - Pure client-side
2. **No database** - Files are the database
3. **Git-friendly** - All changes are file-based
4. **Type-safe** - Schema validation in config
5. **Extensible** - Custom widgets possible
6. **Professional UX** - Rich editor, preview, media library

### Limitations

1. **No authentication** - Local mode only (fine for single-user dev)
2. **No version history** - Use Git for this
3. **No multi-user** - Git backend needed for collaboration
4. **No real-time** - Manual save required

### Future Enhancements

Possible improvements:
- Add Git backend for production use
- Custom preview templates
- Workflow (draft/review/publish)
- Custom widgets for specific needs
- Editorial workflow for teams

## File Generation Rules

### URL Structure

```
content/articles/my-post.md        → public/articles/my-post.html
                                    URL: /articles/my-post.html

content/pages/about.md             → public/about.html
                                    URL: /about.html

content/pages/services/index.md    → public/services/index.html
                                    URL: /services/

content/pages/services/web.md      → public/services/web.html
                                    URL: /services/web.html
```

### Asset Copying

```
src/assets/css/style.css      → public/assets/css/style.css
src/assets/js/main.js         → public/assets/js/main.js
src/assets/img/logo.png       → public/assets/img/logo.png
```

Plus auto-generated:
```
config/theme.json → public/assets/css/theme.css
```

## Performance Considerations

1. **Build Time** - Optimized for 100s of articles, may need pagination for 1000s
2. **Parallel Processing** - Articles built sequentially (could be parallelized)
3. **Caching** - No build cache yet (rebuilds all on each run)
4. **Image Optimization** - Not implemented (future enhancement)

## Future Enhancements

### Planned

- [ ] Client-side search (JSON index)
- [ ] Image optimization (resize, compress)
- [ ] Sitemap.xml generation
- [ ] RSS feed generation
- [ ] Pagination for article listing
- [ ] Draft/published status for articles
- [ ] Multi-language support
- [ ] Syntax highlighting for code blocks
- [ ] Related articles suggestions

### Under Consideration

- [ ] Incremental builds (only rebuild changed files)
- [ ] Build cache
- [ ] Comment system integration
- [ ] Analytics integration
- [ ] Newsletter signup
- [ ] Social share buttons

## Development Workflow with Admin Panel

### Daily Workflow

**Starting development:**
```bash
npm run dev
```

This starts:
1. Express server (port 3333) - Admin panel
2. Live-server (port 8080) - Site preview
3. File watcher - Auto-rebuild on changes

**Two ways to work:**

**Option A: Visual editing (recommended for content)**
1. Open http://localhost:3333/admin
2. Create/edit content through UI
3. Save changes
4. Site rebuilds automatically
5. Preview updates at http://localhost:8080

**Option B: Direct file editing (recommended for code)**
1. Edit files in IDE (VSCode, etc.)
2. Save file
3. Watcher detects change
4. Site rebuilds automatically
5. Preview updates at http://localhost:8080

**Both methods work simultaneously** - use whichever is more convenient.

### Recommended Workflow by Task

| Task | Recommended Method | Why |
|------|-------------------|-----|
| Writing articles | Admin Panel | Rich editor, live preview, easier |
| Editing pages | Admin Panel | Visual forms, validation |
| Uploading images | Admin Panel | Drag & drop, automatic path generation |
| Changing theme colors | Admin Panel | Visual forms with validation |
| Editing templates | IDE | Code editing, syntax highlighting |
| Modifying CSS | IDE | Live preview works great |
| Debugging build | Terminal + IDE | Need to see error messages |

### Admin Panel Tips

1. **Always use "Work with Local Git Repository"** - No authentication needed
2. **Save frequently** - Changes trigger rebuild
3. **Check terminal** - Build logs show errors
4. **Preview before deploying** - Use localhost:8080
5. **Images auto-optimize path** - Upload directly, paths handled automatically

## Maintenance

### Adding Features

1. **New Template** - Add to `src/templates/`, update `build.js`
2. **New Helper** - Register in `registerHelpers()` in `build.js`
3. **New CMS Collection** - Add to `admin/config.yml`
4. **New CMS Field** - Add to collection in `admin/config.yml`
3. **New Config** - Add JSON file, load in `loadConfig()`
4. **New Asset Type** - Update `ALLOWED_EXTENSIONS` in `sync-flexweg.js`

### Updating Dependencies

```bash
npm update
npm audit fix
```

Test thoroughly after updates, especially:
- `markdown-it` - May change HTML output
- `handlebars` - Template syntax changes
- `bootstrap` - CSS class changes

### Debugging

**Build Issues:**
```bash
node build.js  # Run build directly to see full errors
```

**Template Issues:**
```javascript
// Add to build.js for debugging
console.log(JSON.stringify(data, null, 2));
```

**Markdown Issues:**
```javascript
// Test Markdown parsing
const md = new MarkdownIt();
console.log(md.render('# Test'));
```

## Code Style

- **English comments** - All code comments in English
- **Descriptive names** - Clear function/variable names
- **Console feedback** - Build progress visible
- **Error handling** - Try/catch with useful messages
- **Async/Await** - Modern async patterns

## Testing Strategy

Currently manual testing via:
1. Build and inspect output
2. Visual inspection in browser
3. Link checking
4. Responsive testing

Future: Add automated tests for:
- Template rendering
- Markdown parsing
- URL generation
- Config loading

## Conclusion

This architecture balances simplicity, maintainability, and performance. It's designed to be easy to understand, modify, and extend as needs evolve.

The system is opinionated about structure but flexible in content, making it ideal for frequent updates while maintaining a consistent design system.
