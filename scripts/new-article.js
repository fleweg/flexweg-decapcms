#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get article title from command line args
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Error: Please provide an article title');
  console.log('Usage: npm run new-article "Your Article Title"');
  process.exit(1);
}

const title = args.join(' ');
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const date = new Date().toISOString().split('T')[0];

// Article template
const template = `---
title: "${title}"
date: ${date}
author: "Frederic Leaux"
description: "Brief description of your article"
image: ""
tags: ["tag1", "tag2"]
excerpt: "A short excerpt for the article preview"
---

# ${title}

Your article content goes here. Write in Markdown format.

## Section 1

Content for section 1...

## Section 2

Content for section 2...

## Conclusion

Wrap up your article here.
`;

// Create file
const articlesDir = path.join(__dirname, '..', 'content', 'articles');
const filePath = path.join(articlesDir, `${slug}.md`);

// Check if file already exists
if (fs.existsSync(filePath)) {
  console.error(`❌ Error: Article "${slug}.md" already exists`);
  process.exit(1);
}

// Ensure articles directory exists
if (!fs.existsSync(articlesDir)) {
  fs.mkdirSync(articlesDir, { recursive: true });
}

// Write file
fs.writeFileSync(filePath, template);

console.log('✅ Article created successfully!');
console.log(`📄 File: content/articles/${slug}.md`);
console.log('\n📝 Next steps:');
console.log('1. Edit the article file with your content');
console.log('2. Run "npm run build" to generate the site');
console.log('3. Run "npm run deploy" to publish');
