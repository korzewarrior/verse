# Verse

A minimal, immersive web experience for reading scripture with focus and contemplation. Scroll through the Bible with smooth navigation, multiple translations, and elegant typography.

## 🚀 Quick Start

1. Simply open `index.html` in a modern web browser
2. No build step required — it's a static site!

## ✨ Features

- **One line at a time** — Focus on each verse through a centered viewing slit
- **Elastic drag** — Pull up/down with mouse or touch to reveal lines
- **Keyboard navigation** — Arrow keys, Page Up/Down, Home/End
- **Shareable links** — Copy URL to share exact passage and line
- **Dark mode** — Toggle between light and dark themes
- **Accessible** — Screen reader support, keyboard navigation, respects reduced motion
- **Offline-ready** — Works as a static site, optionally cache with service worker

## 📖 How to Use

### Interaction
- **Drag** — Click/touch and drag vertically to scroll through lines
- **Keyboard** — Use ↑/↓ arrows for line-by-line, Page Up/Down for larger jumps
- **Controls** — Select translation, passage, share link, toggle theme

### Keyboard Shortcuts
- `↓` / `↑` — Next/previous line
- `Page Down` / `Page Up` — Jump 3 lines
- `Home` / `End` — First/last line

## 📝 Adding More Translations

The app includes complete Bible translations (KJV and BBE). To add more translations:

1. Download a public domain Bible translation in JSON format (same structure as `kjv.json`)
2. Place the JSON file in the project root
3. Update the `TRANSLATIONS` object in `bible-loader.js`:

```javascript
const TRANSLATIONS = {
  'KJV': { filename: 'kjv.json', name: 'King James Version' },
  'BBE': { filename: 'bbe.json', name: 'Bible in Basic English' },
  'ASV': { filename: 'asv.json', name: 'American Standard Version' } // Add here
};
```

4. Update the `<select>` options in `index.html`

**Note**: Ensure the JSON structure matches (array of book objects with chapters containing verse arrays).

## 📝 Adding More Passages

To add more pre-selected passages, edit the `popularPassages` array in `bible-loader.js`:

```javascript
const popularPassages = [
  { name: 'Psalm 23', book: 'Psalms', chapter: 22, verses: null },
  { name: 'John 3:16-21', book: 'John', chapter: 2, verses: [15, 20] },
  // Add your passages here
];
```

**Notes**: 
- Chapter numbers are 0-indexed (chapter 1 = index 0)
- Verse numbers are also 0-indexed
- Set `verses: null` to show the entire chapter
- Use `verses: [start, end]` for specific verse ranges

**Important**: Only use **public domain** translations (KJV, BBE, ASV, etc.). Do not modify scripture text.

## 🎨 Customization

### Typography
Edit the constants at the top of `main.js`:

```javascript
// ==== TWEAK POINT 1: Typography ====
const FONT_SIZE = 'clamp(18px, 4vw, 28px)';
const LINE_HEIGHT = 1.6;
```

### Spring Physics
Adjust the spring feel by modifying these values in `main.js`:

```javascript
// ==== TWEAK POINT 2: Spring Physics ====
const SPRING_STIFFNESS = 300;  // Higher = snappier (200-400)
const SPRING_DAMPING = 28;     // Higher = less bounce (20-35)
const SPRING_MASS = 1;         // Usually keep at 1
```

- **Increase stiffness** for faster, snappier motion
- **Increase damping** to reduce bounce/oscillation
- **Decrease both** for a slower, floatier feel

### Overscroll Amount
Control how far you can drag beyond the first/last line:

```javascript
// ==== TWEAK POINT 3: Overscroll ====
const OVERSCROLL_FACTOR = 0.6;  // 0.6 = 60% of line height
```

### Design Tokens
Edit CSS variables in `styles.css`:

```css
:root {
  --bg: #f9f7f3;        /* Background color */
  --ink: #1b1b1b;       /* Text color */
  --muted: #6b6b6b;     /* Secondary text */
  --accent: #7a5af8;    /* Accent color */
  --fontSize: clamp(18px, 4vw, 28px);
  --lineHeight: 1.6;
  --radius: 14px;       /* Border radius */
}
```

## 🛠️ Technical Details

### Browser Support
- Modern browsers with ES6+ support
- Pointer Events API for touch/mouse
- Web Audio API for optional tick sound
- CSS Grid and Flexbox for layout

### Performance
- No frameworks, vanilla JS (~300 lines)
- Core bundle < 50KB gzipped
- Minimal DOM manipulation
- Respects `prefers-reduced-motion`

### Accessibility
- ARIA live regions announce current line
- Keyboard navigable
- Semantic HTML
- Focus indicators
- Screen reader tested

## 📄 License & Attribution

### Scripture Text
- **King James Version** (KJV) — Public Domain
- **World English Bible** (WEB) — Public Domain  
- **American Standard Version** (ASV) — Public Domain
- **Bible in Basic English** (BBE) — Public Domain

All four translations are complete Bibles (Old and New Testament) in JSON format.

### Code
This project is open source. Feel free to use, modify, and share.

## 🌐 Deployment

Since this is a static site, you can deploy to:
- GitHub Pages
- Netlify (drag & drop)
- Vercel
- Any static hosting service

Just upload all files maintaining the directory structure.

## 🎯 Testing Checklist

- [ ] Single line visible at all viewport widths
- [ ] Drag and snap works smoothly
- [ ] Keyboard navigation functional
- [ ] Share button copies correct URL
- [ ] Reload from shared URL restores state
- [ ] Lines reflow correctly on resize
- [ ] Screen reader announces lines
- [ ] Reduced motion respected
- [ ] Dark theme toggle works
- [ ] No console errors

## 💡 Tips

1. **Audio toggle** — The tick sound is off by default. Enable it in the info modal (ⓘ button)
2. **Reduced motion** — If you have "reduce motion" enabled in your OS, animations will be instant
3. **Share links** — URLs update as you scroll, making it easy to bookmark specific lines
4. **Mobile** — Works great on touch devices with vertical swipe gestures

---

**Verse** · Made with vanilla HTML, CSS, and JavaScript

