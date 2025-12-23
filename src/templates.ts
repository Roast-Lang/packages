/**
 * HTML Templates for the Roast Package Registry Web UI
 * 
 * Enhanced with modern glassmorphism design, smooth animations,
 * and security-first approach with input sanitization.
 */

// HTML escape function to prevent XSS attacks
function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Roast Logo path (served as static asset)
const ROAST_LOGO = '/assets/logo.png';

// CSS Styles - Premium dark theme with glassmorphism
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  --bg-primary: #0a0e17;
  --bg-secondary: rgba(22, 27, 34, 0.8);
  --bg-tertiary: rgba(33, 38, 45, 0.9);
  --bg-glass: rgba(255, 255, 255, 0.03);
  --text-primary: #f0f6fc;
  --text-secondary: #8b949e;
  --text-muted: #6e7681;
  --accent: #ff6b35;
  --accent-glow: rgba(255, 107, 53, 0.4);
  --accent-hover: #ff8c5a;
  --accent-gradient: linear-gradient(135deg, #ff6b35 0%, #ff9f1c 50%, #ffcc33 100%);
  --border: rgba(48, 54, 61, 0.6);
  --border-glow: rgba(255, 107, 53, 0.2);
  --success: #3fb950;
  --warning: #d29922;
  --error: #f85149;
  --link: #58a6ff;
  --glass-blur: 20px;
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
  --transition-slow: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 30px var(--accent-glow);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
  overflow-x: hidden;
}

/* Animated background */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(ellipse at 20% 20%, rgba(255, 107, 53, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(88, 166, 255, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(255, 159, 28, 0.04) 0%, transparent 60%);
  pointer-events: none;
  z-index: -1;
  animation: bgPulse 15s ease-in-out infinite alternate;
}

@keyframes bgPulse {
  0% { opacity: 0.8; }
  100% { opacity: 1; }
}

a {
  color: var(--link);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--accent);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Header with glassmorphism */
header {
  background: var(--bg-secondary);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--border);
  padding: 16px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all var(--transition-normal);
}

header:hover {
  border-bottom-color: var(--border-glow);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  text-decoration: none;
  transition: all var(--transition-normal);
}

.logo:hover {
  transform: scale(1.03);
  color: var(--text-primary);
}

.logo-img {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  animation: logoFloat 3s ease-in-out infinite;
  filter: drop-shadow(0 0 8px var(--accent-glow));
  transition: all var(--transition-normal);
}

.logo:hover .logo-img {
  filter: drop-shadow(0 0 16px var(--accent-glow));
  transform: scale(1.1);
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-2px) rotate(-1deg); }
  50% { transform: translateY(0) rotate(0deg); }
  75% { transform: translateY(2px) rotate(1deg); }
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.logo-text .brand {
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.logo-text .tagline {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

nav {
  display: flex;
  gap: 32px;
}

nav a {
  color: var(--text-secondary);
  font-weight: 500;
  position: relative;
  padding: 4px 0;
  transition: all var(--transition-fast);
}

nav a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--accent-gradient);
  transition: width var(--transition-normal);
}

nav a:hover {
  color: var(--text-primary);
}

nav a:hover::after {
  width: 100%;
}

/* Search with glow effect */
.search-container {
  flex: 1;
  max-width: 480px;
}

.search-box {
  display: flex;
  background: var(--bg-glass);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
}

.search-box:focus-within {
  border-color: var(--accent);
  box-shadow: var(--shadow-glow);
}

.search-box input {
  flex: 1;
  padding: 14px 18px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 15px;
  font-family: inherit;
  outline: none;
}

.search-box input::placeholder {
  color: var(--text-muted);
}

.search-box button {
  padding: 14px 24px;
  background: var(--accent-gradient);
  border: none;
  color: white;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.search-box button:hover {
  filter: brightness(1.1);
  transform: scale(1.02);
}

/* Hero Section with animated gradient */
.hero {
  position: relative;
  padding: 100px 0 80px;
  text-align: center;
  overflow: hidden;
  background: linear-gradient(180deg, var(--bg-primary) 0%, rgba(10, 14, 23, 0.95) 100%);
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 20% 30%, rgba(255, 107, 53, 0.18) 0%, transparent 35%),
    radial-gradient(circle at 80% 70%, rgba(255, 159, 28, 0.12) 0%, transparent 35%),
    radial-gradient(circle at 50% 50%, rgba(88, 166, 255, 0.08) 0%, transparent 50%);
  animation: heroGlow 10s ease-in-out infinite alternate;
}

.hero::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-glow), transparent);
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

@keyframes heroGlow {
  0% { opacity: 0.6; transform: scale(1) rotate(0deg); }
  100% { opacity: 1; transform: scale(1.08) rotate(1deg); }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-logo {
  width: 100px;
  height: 100px;
  margin: 0 auto 32px;
  animation: heroLogoFloat 4s ease-in-out infinite;
  filter: drop-shadow(0 0 24px var(--accent-glow));
}

@keyframes heroLogoFloat {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-12px) scale(1.05); }
}

.hero h1 {
  font-size: 60px;
  font-weight: 800;
  margin-bottom: 24px;
  letter-spacing: -1.5px;
  line-height: 1.1;
}

.hero h1 span {
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  display: inline-block;
}

.hero h1 span::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 4px;
  background: var(--accent-gradient);
  border-radius: 2px;
  opacity: 0.6;
  animation: underlineGlow 2s ease-in-out infinite alternate;
}

@keyframes underlineGlow {
  0% { opacity: 0.4; width: 60%; }
  100% { opacity: 0.8; width: 100%; }
}

.hero p {
  font-size: 20px;
  color: var(--text-secondary);
  margin-bottom: 48px;
  max-width: 550px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

/* Stats with counter animation */
.stats {
  display: flex;
  justify-content: center;
  gap: 56px;
  margin-top: 48px;
}

.stat {
  text-align: center;
  padding: 24px 32px;
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: 16px;
  transition: all var(--transition-normal);
}

.stat:hover {
  transform: translateY(-4px);
  border-color: var(--border-glow);
  box-shadow: var(--shadow-glow);
}

.stat-value {
  font-size: 42px;
  font-weight: 800;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: countUp 1s ease-out forwards;
}

@keyframes countUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-label {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 4px;
}

/* Sections */
.section {
  padding: 64px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Package Cards with glassmorphism */
.package-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.package-card {
  background: var(--bg-secondary);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px;
  display: block;
  color: inherit;
  text-decoration: none;
  transition: all var(--transition-slow);
  position: relative;
  overflow: hidden;
}

.package-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, transparent 50%);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.package-card:hover {
  transform: translateY(-6px) scale(1.01);
  border-color: var(--border-glow);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}

.package-card:hover::before {
  opacity: 1;
}

.package-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
}

.package-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--link);
  transition: color var(--transition-fast);
}

.package-card:hover .package-name {
  color: var(--accent);
}

.package-version {
  background: var(--bg-tertiary);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  color: var(--accent);
  font-weight: 500;
  border: 1px solid var(--border);
}

.package-description {
  color: var(--text-secondary);
  margin-bottom: 18px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  position: relative;
  z-index: 1;
}

.package-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: var(--text-muted);
  position: relative;
  z-index: 1;
}

.package-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Package Detail Page */
.package-detail {
  padding: 48px 0;
}

.package-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  gap: 32px;
}

.package-title {
  font-size: 40px;
  font-weight: 800;
  margin-bottom: 12px;
}

.package-subtitle {
  color: var(--text-secondary);
  font-size: 18px;
  max-width: 600px;
}

/* Install box with premium styling */
.install-box {
  background: var(--bg-secondary);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px 22px;
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all var(--transition-normal);
  min-width: 280px;
}

.install-box:hover {
  border-color: var(--border-glow);
  box-shadow: var(--shadow-md);
}

.install-box code {
  flex: 1;
  color: var(--accent);
  font-size: 14px;
  font-weight: 500;
}

.copy-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 6px;
}

.copy-btn:hover {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
  transform: scale(1.05);
}

.detail-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
}

.detail-main {
  background: var(--bg-secondary);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 36px;
}

.detail-main h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
}

.detail-main h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.detail-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-card {
  background: var(--bg-secondary);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  transition: all var(--transition-normal);
}

.sidebar-card:hover {
  border-color: var(--border-glow);
}

.sidebar-card h3 {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  margin-bottom: 16px;
  font-weight: 600;
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  font-size: 14px;
  transition: all var(--transition-fast);
}

.version-item:hover {
  background: var(--bg-glass);
  border-color: var(--border-glow);
}

.version-item.yanked {
  opacity: 0.4;
  text-decoration: line-through;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword {
  background: var(--bg-tertiary);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  transition: all var(--transition-fast);
}

.keyword:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* Footer */
footer {
  background: var(--bg-secondary);
  backdrop-filter: blur(var(--glass-blur));
  border-top: 1px solid var(--border);
  padding: 32px 0;
  margin-top: 80px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-content > div:first-child {
  color: var(--text-muted);
}

.footer-links {
  display: flex;
  gap: 32px;
}

.footer-links a {
  color: var(--text-secondary);
  font-weight: 500;
  transition: color var(--transition-fast);
}

.footer-links a:hover {
  color: var(--accent);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 24px;
  color: var(--text-secondary);
}

.empty-state h2 {
  font-size: 24px;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.empty-state p {
  margin-bottom: 24px;
}

/* Primary Button */
.btn-primary {
  display: inline-block;
  background: var(--accent-gradient);
  color: white;
  padding: 14px 28px;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: var(--shadow-md), var(--shadow-glow);
  color: white;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .search-container {
    order: 3;
    max-width: 100%;
    width: 100%;
  }
  
  nav {
    gap: 20px;
  }
  
  .hero {
    padding: 48px 0;
  }
  
  .hero h1 {
    font-size: 36px;
  }
  
  .hero p {
    font-size: 16px;
  }
  
  .stats {
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .stat {
    flex: 1;
    min-width: 140px;
    padding: 20px;
  }
  
  .stat-value {
    font-size: 32px;
  }
  
  .package-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .package-detail-header {
    flex-direction: column;
  }
  
  .install-box {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 16px;
  }
  
  .hero h1 {
    font-size: 28px;
  }
  
  .package-card {
    padding: 20px;
  }
  
  .detail-main {
    padding: 24px;
  }
}
`;

interface TemplateData {
  title?: string;
  packages?: Array<{
    name: string;
    description: string;
    latest: string;
    downloads?: number;
    updated_at?: string;
  }>;
  package?: {
    name: string;
    description: string;
    authors: string[];
    license: string;
    repository?: string;
    homepage?: string;
    keywords: string[];
    versions: Array<{
      version: string;
      published_at: string;
      yanked: boolean;
      size: number;
    }>;
    downloads: number;
    created_at: string;
    updated_at: string;
  };
  stats?: {
    totalPackages: number;
    totalDownloads: number;
    totalVersions: number;
  };
  query?: string;
}

// Helper to format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Helper to format file size
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

// Base layout with security headers meta tags
function layout(content: string, data: TemplateData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Roast Package Registry - Discover, share, and reuse packages for the Roast programming language">
  <meta name="theme-color" content="#ff6b35">
  <meta name="robots" content="index, follow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <title>${escapeHtml(data.title || 'Roast Packages')}</title>
  <style>${CSS}</style>
</head>
<body>
  <header>
    <div class="container header-content">
      <a href="/" class="logo">
        <img src="${ROAST_LOGO}" alt="Roast" class="logo-img">
        <div class="logo-text">
          <span class="brand">Roast Packages</span>
          <span class="tagline">The Official Registry</span>
        </div>
      </a>
      
      <div class="search-container">
        <form action="/search" method="GET" class="search-box">
          <input type="text" name="q" placeholder="Search packages..." value="${escapeHtml(data.query || '')}" autocomplete="off">
          <button type="submit">Search</button>
        </form>
      </div>
      
      <nav>
        <a href="/">Browse</a>
        <a href="/docs">Docs</a>
        <a href="https://github.com/roast-lang/roast" target="_blank" rel="noopener noreferrer">GitHub</a>
      </nav>
    </div>
  </header>
  
  <main>
    ${content}
  </main>
  
  <footer>
    <div class="container footer-content">
      <div>© ${new Date().getFullYear()} Roast Language. Built with 🔥</div>
      <div class="footer-links">
        <a href="/api/v1">API</a>
        <a href="/docs">Documentation</a>
        <a href="https://github.com/roast-lang/roast" target="_blank" rel="noopener noreferrer">Source Code</a>
      </div>
    </div>
  </footer>
  
  <script>
    // Minimal clipboard functionality - no external dependencies
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const code = btn.previousElementSibling?.textContent;
        if (code) {
          try {
            await navigator.clipboard.writeText(code);
            const original = btn.innerHTML;
            btn.innerHTML = '✓ Copied';
            btn.style.background = 'var(--success)';
            btn.style.borderColor = 'var(--success)';
            btn.style.color = 'white';
            setTimeout(() => {
              btn.innerHTML = original;
              btn.style.background = '';
              btn.style.borderColor = '';
              btn.style.color = '';
            }, 2000);
          } catch (e) {
            console.error('Copy failed:', e);
          }
        }
      });
    });
  </script>
</body>
</html>`;
}

// Home page
export function homePage(data: TemplateData): string {
  const packagesHtml = data.packages?.length
    ? data.packages.map(pkg => `
        <a href="/packages/${escapeHtml(pkg.name)}" class="package-card">
          <div class="package-header">
            <span class="package-name">${escapeHtml(pkg.name)}</span>
            <span class="package-version">v${escapeHtml(pkg.latest)}</span>
          </div>
          <p class="package-description">${escapeHtml(pkg.description) || 'No description available'}</p>
          <div class="package-meta">
            <span>📥 ${formatNumber(pkg.downloads || 0)} downloads</span>
            <span>📅 ${pkg.updated_at ? formatDate(pkg.updated_at) : 'Unknown'}</span>
          </div>
        </a>
      `).join('')
    : '<div class="empty-state"><h2>No packages yet</h2><p>Be the first to publish a package!</p><a href="/docs" class="btn-primary">Get Started</a></div>';

  const content = `
    <section class="hero">
      <div class="container hero-content">
        <img src="${ROAST_LOGO}" alt="Roast" class="hero-logo">
        <h1>The <span>Roast</span> Package Registry</h1>
        <p>Discover, share, and reuse packages for the Roast programming language</p>
        
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${formatNumber(data.stats?.totalPackages || 0)}</div>
            <div class="stat-label">Packages</div>
          </div>
          <div class="stat">
            <div class="stat-value">${formatNumber(data.stats?.totalDownloads || 0)}</div>
            <div class="stat-label">Downloads</div>
          </div>
          <div class="stat">
            <div class="stat-value">${formatNumber(data.stats?.totalVersions || 0)}</div>
            <div class="stat-label">Versions</div>
          </div>
        </div>
      </div>
    </section>
    
    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">📦 All Packages</h2>
        </div>
        <div class="package-grid">
          ${packagesHtml}
        </div>
      </div>
    </section>
  `;

  return layout(content, { ...data, title: 'Roast Packages - The Package Registry for Roast Language' });
}

// Search results page
export function searchPage(data: TemplateData): string {
  const packagesHtml = data.packages?.length
    ? data.packages.map(pkg => `
        <a href="/packages/${escapeHtml(pkg.name)}" class="package-card">
          <div class="package-header">
            <span class="package-name">${escapeHtml(pkg.name)}</span>
            <span class="package-version">v${escapeHtml(pkg.latest)}</span>
          </div>
          <p class="package-description">${escapeHtml(pkg.description) || 'No description available'}</p>
          <div class="package-meta">
            <span>📥 ${formatNumber(pkg.downloads || 0)} downloads</span>
          </div>
        </a>
      `).join('')
    : `<div class="empty-state"><h2>No packages found</h2><p>Try a different search term</p><a href="/" class="btn-primary">Browse All</a></div>`;

  const content = `
    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">🔍 Search results for "${escapeHtml(data.query || '')}"</h2>
        </div>
        <div class="package-grid">
          ${packagesHtml}
        </div>
      </div>
    </section>
  `;

  return layout(content, { ...data, title: `Search: ${escapeHtml(data.query || '')} - Roast Packages` });
}

// Package detail page
export function packagePage(data: TemplateData): string {
  const pkg = data.package!;
  const latestVersion = pkg.versions.find(v => !v.yanked) || pkg.versions[0];

  const versionsHtml = pkg.versions.slice(0, 10).map(v => `
    <div class="version-item ${v.yanked ? 'yanked' : ''}">
      <span>v${escapeHtml(v.version)}</span>
      <span>${formatDate(v.published_at)}</span>
    </div>
  `).join('');

  const keywordsHtml = pkg.keywords.length
    ? pkg.keywords.map(k => `<span class="keyword">${escapeHtml(k)}</span>`).join('')
    : '<span class="keyword">No keywords</span>';

  const content = `
    <section class="package-detail">
      <div class="container">
        <div class="package-detail-header">
          <div>
            <h1 class="package-title">${escapeHtml(pkg.name)}</h1>
            <p class="package-subtitle">${escapeHtml(pkg.description) || 'No description available'}</p>
          </div>
          <div class="install-box">
            <code>kitchen add ${escapeHtml(pkg.name)}</code>
            <button class="copy-btn">📋 Copy</button>
          </div>
        </div>
        
        <div class="detail-grid">
          <div class="detail-main">
            <h2>About</h2>
            <p style="margin-top: 16px; color: var(--text-secondary); line-height: 1.7;">
              ${escapeHtml(pkg.description) || 'No detailed description available.'}
            </p>
            
            <h3 style="margin-top: 36px;">Installation</h3>
            <div class="install-box" style="margin-top: 14px;">
              <code>kitchen add ${escapeHtml(pkg.name)}@${escapeHtml(latestVersion?.version || 'latest')}</code>
              <button class="copy-btn">📋 Copy</button>
            </div>
            
            <p style="margin-top: 14px; color: var(--text-secondary);">Or add to your roast.toml:</p>
            <div class="install-box" style="margin-top: 10px;">
              <code>${escapeHtml(pkg.name)} = "${escapeHtml(latestVersion?.version || '*')}"</code>
              <button class="copy-btn">📋 Copy</button>
            </div>
          </div>
          
          <div class="detail-sidebar">
            <div class="sidebar-card">
              <h3>Info</h3>
              <div style="display: flex; flex-direction: column; gap: 12px; color: var(--text-secondary);">
                <div>📥 <strong style="color: var(--text-primary);">${formatNumber(pkg.downloads)}</strong> downloads</div>
                <div>📝 License: <strong style="color: var(--text-primary);">${escapeHtml(pkg.license)}</strong></div>
                <div>👤 By ${escapeHtml(pkg.authors.join(', ')) || 'Unknown'}</div>
                <div>📅 Created ${formatDate(pkg.created_at)}</div>
                <div>🔄 Updated ${formatDate(pkg.updated_at)}</div>
                ${pkg.repository ? `<div><a href="${escapeHtml(pkg.repository)}" target="_blank" rel="noopener noreferrer">📦 Repository</a></div>` : ''}
                ${pkg.homepage ? `<div><a href="${escapeHtml(pkg.homepage)}" target="_blank" rel="noopener noreferrer">🏠 Homepage</a></div>` : ''}
              </div>
            </div>
            
            <div class="sidebar-card">
              <h3>Versions</h3>
              <div class="version-list">
                ${versionsHtml}
              </div>
            </div>
            
            <div class="sidebar-card">
              <h3>Keywords</h3>
              <div class="keywords">
                ${keywordsHtml}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  return layout(content, { ...data, title: `${escapeHtml(pkg.name)} - Roast Packages` });
}

// 404 page
export function notFoundPage(): string {
  const content = `
    <section class="section">
      <div class="container empty-state">
        <h1 style="font-size: 80px; margin-bottom: 16px; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">404</h1>
        <h2>Package not found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/" class="btn-primary" style="margin-top: 24px;">
          Go Home
        </a>
      </div>
    </section>
  `;

  return layout(content, { title: 'Not Found - Roast Packages' });
}

// Documentation page
export function docsPage(): string {
  const content = `
    <section class="section">
      <div class="container">
        <h1 class="section-title" style="margin-bottom: 40px;">📚 Documentation</h1>
        
        <div class="detail-main">
          <h2>Getting Started</h2>
          <p style="margin-top: 16px; color: var(--text-secondary); line-height: 1.7;">
            Use the <strong style="color: var(--accent);">kitchen</strong> package manager to install and manage Roast packages.
          </p>
          
          <h3 style="margin-top: 36px;">Installing Packages</h3>
          <div class="install-box" style="margin-top: 14px;">
            <code>kitchen add package-name</code>
            <button class="copy-btn">📋 Copy</button>
          </div>
          
          <h3 style="margin-top: 36px;">Publishing Packages</h3>
          <p style="margin-top: 14px; color: var(--text-secondary);">
            First, register for an account and get your API token:
          </p>
          <div class="install-box" style="margin-top: 14px;">
            <code>kitchen login</code>
            <button class="copy-btn">📋 Copy</button>
          </div>
          
          <p style="margin-top: 20px; color: var(--text-secondary);">
            Then publish your package:
          </p>
          <div class="install-box" style="margin-top: 14px;">
            <code>kitchen publish</code>
            <button class="copy-btn">📋 Copy</button>
          </div>
          
          <h3 style="margin-top: 36px;">API</h3>
          <p style="margin-top: 14px; color: var(--text-secondary); line-height: 1.7;">
            The registry provides a REST API at <a href="/api/v1">/api/v1</a> for programmatic access.
          </p>
        </div>
      </div>
    </section>
  `;

  return layout(content, { title: 'Documentation - Roast Packages' });
}
