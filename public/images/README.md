# Images Folder Structure

This folder contains static images that can be accessed directly via URL paths.

## Folder Organization

- `icons/` - Small icons, buttons, UI elements
- `backgrounds/` - Background images, banners, hero images  
- `logos/` - Company logos, brand assets

## Usage in React Components

Since these are in the `public` folder, you can reference them directly:

```jsx
// Direct URL reference (recommended for static assets)
<img src="/images/logos/company-logo.png" alt="Company Logo" />
<img src="/images/icons/user-icon.svg" alt="User" />
<img src="/images/backgrounds/hero-bg.jpg" alt="Hero Background" />
```

## Supported Formats

- PNG (.png)
- JPEG (.jpg, .jpeg)
- SVG (.svg)
- WebP (.webp)
- GIF (.gif)

## Best Practices

1. Use descriptive filenames (e.g., `login-button-icon.png` instead of `icon1.png`)
2. Optimize images for web (compress before uploading)
3. Use SVG for icons when possible (scalable and smaller file size)
4. Consider using WebP format for better compression
