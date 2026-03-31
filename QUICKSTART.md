# Quick Start Guide - Flexweg Fleox

Get your static site up and running in 5 minutes!

## Prerequisites

- Node.js 16+ installed
- Basic knowledge of Markdown (optional)
- A text editor (VSCode recommended)

## Step 1: Install Dependencies

```bash
npm install
```

This installs all required packages (~300 packages, takes ~30 seconds).

## Step 2: Start Development Server

```bash
npm run dev
```

This starts **three services simultaneously**:

1. **Admin Panel** → http://localhost:3333/admin
2. **Site Preview** → http://localhost:8080
3. **File Watcher** → Auto-rebuilds on changes

## Step 3: Access the Admin Panel

1. Open http://localhost:3333/admin in your browser
2. Click **"Work with Local Git Repository"**
3. You're in! 🎉

## Step 4: Create Your First Article

### Using the Admin Panel (Easy Way)

1. In the admin panel, click **"Collections"** → **"Articles"**
2. Click **"New Article"**
3. Fill in the form:
   - **Title**: Your article title
   - **Date**: Choose today's date
   - **Author**: Your name
   - **Description**: SEO-friendly description
   - **Tags**: Add some tags (press Enter after each)
   - **Body**: Write your content in Markdown
4. Click **"Save"**
5. Watch the terminal - your site rebuilds automatically!
6. Open http://localhost:8080 to see your article

### Using Command Line (Quick Way)

```bash
npm run new-article "My First Article"
```

Then edit `content/articles/my-first-article.md` in your editor.

## Step 5: Customize Your Site

### Change Site Settings

1. In admin panel: **"Site Configuration"** → **"Site Settings"**
2. Update:
   - Site Title
   - Description
   - Your name
   - Social media links
3. Click **"Save"**

### Change Colors & Theme

1. In admin panel: **"Site Configuration"** → **"Theme Settings"**
2. Modify colors (e.g., change accent color to your brand)
3. Click **"Save"**
4. Your site rebuilds with new colors!

### Edit Navigation Menu

1. In admin panel: **"Site Configuration"** → **"Navigation"**
2. Add/remove/edit menu links
3. Click **"Save"**

## Step 6: Add Images

### Via Admin Panel

1. When editing an article, find **"Featured Image"** field
2. Click **"Choose an image"** or drag & drop
3. Image is automatically uploaded to `src/assets/img/`
4. Path is auto-generated (e.g., `/assets/img/my-image.jpg`)

### Via File System

1. Copy images to `src/assets/img/`
2. Reference in Markdown: `![Alt text](/assets/img/my-image.jpg)`

## Step 7: Preview & Test

- **Preview**: http://localhost:8080
- **Admin**: http://localhost:3333/admin
- Changes rebuild automatically (check terminal for build status)
- Page refreshes automatically after rebuild

## Step 8: Deploy to Production

### First time setup:

```bash
export FLEXWEG_API_KEY="your-api-key"
export FLEXWEG_BASE_URL="http://static-host.local"
```

### Deploy:

```bash
npm run deploy
```

This:
1. Builds the site
2. Syncs to your Flexweg infrastructure
3. Shows upload progress

## Common Tasks

### Create a New Page

**Admin Panel:**
1. **"Collections"** → **"Pages"** → **"New Page"**
2. Fill form & save

**Command Line:**
```bash
# Create content/pages/about.md manually
# Builds automatically to public/about.html
```

### Delete an Article

**Admin Panel:**
1. Open the article
2. Click **"Delete entry"**
3. Confirm

**File System:**
```bash
rm content/articles/article-slug.md
# Rebuilds automatically
```

### Change Article Date

**Admin Panel:**
1. Open the article
2. Change the **"Publish Date"** field
3. Save

Home page updates automatically (articles sorted by date).

## Troubleshooting

### Port already in use

If port 3333 or 8080 is busy:
1. Stop other servers
2. Or modify ports in `dev-server.js`

### Build fails

Check terminal for error messages. Common issues:
- **Invalid YAML** in front-matter → fix syntax
- **Missing required field** → add title/date
- **Invalid JSON** in config → validate JSON syntax

### Admin not loading

1. Check terminal - ensure dev server started
2. Clear browser cache
3. Try incognito mode
4. Check console for errors (F12)

### Changes not appearing

1. Check terminal for build errors
2. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
3. Clear `public/` folder: `npm run clean && npm run build`

## Tips & Best Practices

### Content Writing

✅ **Do:**
- Write in Markdown for easy formatting
- Use descriptive titles and descriptions for SEO
- Add relevant tags to articles
- Upload optimized images (< 1MB)
- Preview before deploying

❌ **Don't:**
- Use HTML in Markdown (breaks preview)
- Skip required fields (title, date)
- Use special characters in filenames
- Upload huge images (slows site)

### Development

✅ **Do:**
- Keep dev server running while working
- Check terminal for build status
- Test on localhost before deploying
- Commit changes to Git regularly
- Use admin panel for content, IDE for code

❌ **Don't:**
- Edit `public/` folder (gets overwritten)
- Modify generated CSS (edit source instead)
- Skip testing after changes
- Deploy without building first

### Configuration

✅ **Do:**
- Use relative URLs for links (`/about.html`)
- Keep color schemes consistent
- Test navigation changes
- Backup config files before major changes

❌ **Don't:**
- Hard-code colors in CSS (use theme.json)
- Create circular navigation links
- Use absolute URLs for internal links

## Next Steps

1. **Read the docs**: Check [README.md](README.md) for full documentation
2. **Understand architecture**: See [CLAUDE.md](CLAUDE.md) for technical details
3. **Customize design**: Edit `src/assets/css/style.css`
4. **Add more features**: Modify templates in `src/templates/`
5. **Deploy regularly**: `npm run deploy` when ready

## Getting Help

- **Build errors**: Check terminal output
- **Admin issues**: Check browser console (F12)
- **Questions**: See [README.md](README.md) or [CLAUDE.md](CLAUDE.md)

## Summary of Commands

```bash
npm install              # Install dependencies
npm run dev              # Start development (admin + preview)
npm run build            # Build site only
npm run deploy           # Build & deploy to Flexweg
npm run new-article "Title"  # Create article via CLI
npm run clean            # Clean public/ folder
```

---

**You're all set!** 🚀

Start creating content at http://localhost:3333/admin and preview at http://localhost:8080.
