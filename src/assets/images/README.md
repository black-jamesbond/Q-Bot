# Assets Images Folder

This folder contains images that are imported as modules in React components.

## Folder Organization

- `icons/` - Small icons, buttons, UI elements
- `backgrounds/` - Background images, banners, hero images  
- `logos/` - Company logos, brand assets

## Usage in React Components

Images in this folder need to be imported before use:

```jsx
// Import the image first
import companyLogo from '../assets/images/logos/company-logo.png';
import userIcon from '../assets/images/icons/user-icon.svg';
import heroBg from '../assets/images/backgrounds/hero-bg.jpg';

// Then use in JSX
<img src={companyLogo} alt="Company Logo" />
<img src={userIcon} alt="User" />
<div style={{backgroundImage: `url(${heroBg})`}}>Content</div>
```

## When to Use This vs Public Folder

**Use src/assets/images/ when:**
- Images are imported and used in components
- You want Vite to process and optimize the images
- Images are part of the component logic

**Use public/images/ when:**
- Images are referenced by direct URL
- Images are static and don't change
- You want simple URL-based access

## Supported Formats

- PNG (.png)
- JPEG (.jpg, .jpeg)
- SVG (.svg)
- WebP (.webp)
- GIF (.gif)
