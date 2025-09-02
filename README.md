## Renad Amr — Data Engineer & IoT Specialist (Portfolio)

A modern, responsive, single‑page portfolio showcasing data engineering, IoT, and software projects. Built with semantic HTML, modular CSS, and vanilla JavaScript, it features smooth animations, accessible interactions, and a polished, professional visual design.

### Highlights
- **Modern UI**: Glassmorphism cards, gradient accents, soft shadows, and a data‑themed animated background.
- **Performance‑aware animations**: Intersection Observer‑driven reveals, GPU‑friendly keyframes, and rate‑limited effects.
- **Interactive navigation**: Smart sticky navbar with hide/show on scroll, section highlighting, and smooth scrolling.
- **Hero experience**: Typing headline with curated roles and animated tech badges.
- **Skills carousel**: Category slides with animated progress bars.
- **Projects**: Rich cards with media embeds, tags, and external links.
- **Experience timeline**: Hover‑enhanced professional journey with achievements and training.
- **Contact**: Validated form with non‑blocking notifications and clear success feedback.
- **Accessibility & UX**: Keyboard shortcuts, focus management, visible validation, and tooltip support.

### Tech Stack
- **HTML5**, **CSS3**, **JavaScript (vanilla)**
- **Bootstrap 5.3** (via CDN)
- **Font Awesome 6** (icons via CDN)
- **Google Fonts**: Inter, JetBrains Mono

Note: CDNs require an internet connection when previewing locally.

### Project Structure
```text
/workspace
├─ index.html        # Page structure and content
├─ style.css         # Design tokens, layout, animations, components
├─ script.js         # Interactions, animations, accessibility, utilities
└─ images/           # Profile and project images
```

### Getting Started
#### Quick preview
- **Option 1**: Open `index.html` directly in a modern browser
- **Option 2 (recommended)**: Serve locally to ensure correct relative paths and caching

```bash
# From the project root
python3 -m http.server 8080
# Then visit http://localhost:8080
```

### Customization
- **Branding & content** (`index.html`)
  - Update the `<title>` and meta description.
  - Edit sections: `About`, `Education`, `Technical Expertise` (skills), `Projects`, `Professional Journey`, `Contact`.
  - Replace social links and email in the Contact section.
- **Design tokens** (`style.css`)
  - Adjust CSS variables under `:root` (colors, gradients, shadows, border‑radius).
  - Tweak animations such as `dataFlow`, `circuitFlow`, and component styles.
- **Behavior** (`script.js`)
  - Edit `typingTexts` for the hero typing effect.
  - Extend notification copy in `showNotification` and tech badge `techInfo` mapping.
  - Tune scroll behavior, navbar interactions, keyboard shortcuts, and form validation.
- **Assets** (`images/`)
  - Replace `profile.jpg` and add project images/screens with consistent dimensions and compression.

### Deployment
- **GitHub Pages**
  1. Push the repository to GitHub.
  2. In your repo: Settings → Pages → Deploy from `main` (root).
  3. Wait for the build; your site will be available at the Pages URL.
- **Static hosts** (Netlify, Vercel, Cloudflare Pages)
  - New project → Connect repo → Use default static site settings (no build step required).

### Accessibility & Performance
- **Accessibility**: Keyboard shortcuts for major sections, focus loop management on Tab, visible form validation.
- **Performance**: Limited particle count, Intersection Observer usage, and lightweight vanilla JS with CDN caching.

### Attributions
- Icons by Font Awesome. Typography via Google Fonts. Some placeholder imagery from Unsplash.

### Contact
- **Email**: renadamr.bls@gmail.com
- **LinkedIn**: linkedin.com/in/renad-amr
- **GitHub**: github.com/renad29amr

### License
© 2025 Renad Amr. All rights reserved.

