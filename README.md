# Focus Redirect - Browser Extension

A powerful browser extension designed to help you maintain focus by redirecting distracting websites to a motivational inspiration page featuring your personal motivation and powerful quotes from top motivational books.

![Focus Redirect Preview](focus-redirect/inspiration/preview.png)

## 🎯 Features

### ✨ **Personal Motivation**
- **Your personal photo** prominently displayed as inspiration
- **Sentimental messaging** that connects your daily choices to your family
- **Beautiful dark theme** with animated gradients and glassmorphism effects

### 📚 **Powerful Quotes**
- **20+ carefully curated quotes** from top motivational books including:
  - Atomic Habits by James Clear
  - The Compound Effect by Darren Hardy
  - The 7 Habits of Highly Effective People by Stephen Covey
  - And many more from renowned leaders and thinkers

### 🛡️ **Focus Protection**
- **Website blocking** - Add any distracting websites to your banned list
- **Smart redirection** - Automatically redirects blocked sites to inspiration page
- **Commitment-based override** - Must write a commitment if you choose to continue
- **Statistics tracking** - Monitor your daily redirects

### 🎨 **Modern Design**
- **Sophisticated dark theme** with rich blue gradients
- **Smooth animations** and transitions throughout
- **Glassmorphism effects** for modern, elegant appearance
- **Typography**: Space Grotesk & Outfit fonts for impact and readability

## 📁 Project Structure

```
focus-redirect/
├── background.js              # Extension background script
├── manifest.json             # Extension configuration
├── icons/                    # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup/                    # Extension popup interface
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
└── inspiration/              # Main inspiration page
    ├── inspiration.html      # Motivation page layout
    ├── inspiration.css       # Styling and animations
    ├── inspiration.js        # Quote rotation and interactions
    └── idris.gif            # Personal motivation photo
```

## 🚀 Installation

### For Development:
1. Clone this repository
2. Add your personal photo as `focus-redirect/inspiration/idris.gif`
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the `focus-redirect` directory

### For Production:
1. Package the extension as a `.crx` file
2. Install through Chrome Web Store (when published)

## 💡 Usage

### Setting Up Blocked Websites:
1. Click the Focus Redirect icon in your browser toolbar
2. Toggle the extension "Enabled"
3. Add websites to your banned list (e.g., `facebook.com`, `twitter.com`)
4. The extension will automatically redirect these sites

### Inspiration Page Experience:
When you visit a blocked website, you'll see:
- **Your personal photo** as motivation
- **Rotating inspirational quotes** every 10 seconds
- **Personal message** about building a better future
- **Choice to refocus** or continue with commitment

### Managing Settings:
- **Enable/Disable**: Toggle the extension on/off
- **Add Sites**: Enter domains to block
- **Remove Sites**: Click the X next to any blocked site
- **View Stats**: See your daily redirect count

## 🎨 Customization

### Adding Your Personal Photo:
1. Replace `focus-redirect/inspiration/idris.gif` with your photo
2. Recommended size: 280x280 pixels
3. Supported formats: `.jpg`, `.png`, `.gif`

### Customizing Messages:
Edit these sections in `inspiration.html`:
- **Header**: `"My Reason to Push Forward"`
- **Photo overlay**: `"Every day I work harder for you"`
- **Personal motivation**: The main quote about building the future
- **Reminder text**: Questions about choices and discipline

### Adding More Quotes:
In `inspiration.js`, add new quotes to the `quotes` array:
```javascript
{
  text: "Your inspiring quote here.",
  author: "Book Title - Author Name"
}
```

### Theme Customization:
Modify CSS variables in `inspiration.css`:
```css
:root {
  --color-bg-start: #0d1b2a;    /* Background gradient start */
  --color-bg-mid: #1b263b;      /* Background gradient middle */
  --color-bg-end: #415a77;      /* Background gradient end */
  --color-accent: #1ee3cf;      /* Accent color (cyan) */
  --color-text: #e0e1dd;        /* Main text color */
}
```

## 🔧 Technical Details

### Technologies Used:
- **HTML5** - Semantic structure
- **CSS3** - Advanced styling with custom properties
- **Vanilla JavaScript** - No frameworks for optimal performance
- **Chrome Extension APIs** - Background scripts and content injection

### Browser Compatibility:
- **Chrome** ✅ (Primary target)
- **Edge** ✅ (Chromium-based)
- **Firefox** ⚠️ (May require manifest adjustments)
- **Safari** ❌ (Not supported)

### Performance Features:
- **Lazy loading** of inspiration page assets
- **Optimized animations** with CSS transforms
- **Minimal memory footprint**
- **Fast quote transitions** with smooth animations

## 📊 Quote Transition System

The inspiration page features an advanced quote rotation system:

### Transition Effects:
- **Fade out** current quote with slight vertical movement
- **Staggered fade in** of new content
- **Quote appears first**, followed by author attribution
- **10-second intervals** for optimal reading time

### Animation Details:
```javascript
// Smooth transition sequence:
1. Fade out container (400ms)
2. Update content
3. Fade in container (100ms delay)
4. Animate quote text (300ms)
5. Animate author citation (500ms total)
```

## 🛠️ Development

### Local Development:
```bash
# Navigate to project directory
cd focus-redirect

# Open in browser for testing
# (Load as unpacked extension in Chrome)

# For file watching during development:
# Use your preferred file watcher or IDE
```

### Code Style:
- **ES6+** JavaScript features
- **CSS Grid & Flexbox** for layouts
- **CSS Custom Properties** for theming
- **Semantic HTML** structure
- **BEM methodology** for CSS classes

### Testing:
- Test on multiple websites for blocking functionality
- Verify quote transitions work smoothly
- Check responsive design on different screen sizes
- Validate extension permissions and security

## 📈 Future Enhancements

### Planned Features:
- [ ] **Time-based blocking** (e.g., block social media during work hours)
- [ ] **Productivity goals** integration
- [ ] **Weekly/monthly statistics** dashboard
- [ ] **Custom quote categories** (productivity, motivation, success)
- [ ] **Sound notifications** for redirects
- [ ] **Sync settings** across devices

### Technical Improvements:
- [ ] **Manifest V3** migration for better security
- [ ] **TypeScript** conversion for better development experience
- [ ] **Unit tests** for JavaScript functions
- [ ] **Build system** with minification and optimization

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contribution Guidelines:
- Follow existing code style and conventions
- Test your changes thoroughly
- Update documentation as needed
- Add meaningful commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💖 Acknowledgments

- **Motivational book authors** for the inspiring quotes
- **Google Fonts** for the beautiful typography (Space Grotesk & Outfit)
- **CSS-Tricks** and **MDN** for web development resources
- **Chrome Extension documentation** for technical guidance

## 📞 Support

If you encounter any issues or have questions:

1. **Check existing issues** in the GitHub repository
2. **Create a new issue** with detailed information
3. **Provide screenshots** if applicable
4. **Include browser version** and extension version

---

**Built with ❤️ for better focus and productivity**

*"Every moment you choose focus over distraction, you're building the future you deserve."* 