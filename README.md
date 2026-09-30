# InvoiceForge 📄

InvoiceForge is an invoice generator and PDF stamping tool designed for desktop (Electron), mobile (Android/iOS PWA), and web browsers.

---

## 📱 How to Host on GitHub Pages & Run on iPhone (100% Free)

You do **not** need Xcode, a Mac, or an Apple Developer account to run InvoiceForge on your iPhone.

### Step 1: Push Code to GitHub
Ensure all code (including `.github/workflows/deploy.yml`) is pushed to your GitHub repository:
```bash
git add .
git commit -m "Add GitHub Pages & PWA support for iPhone"
git push origin main
```

### Step 2: Enable GitHub Pages
1. On GitHub, go to your repository **Settings**.
2. Click **Pages** on the left menu under "Code and automation".
3. Under **Build and deployment -> Source**, select **GitHub Actions**.
4. The automated GitHub Action (`Deploy to GitHub Pages`) will build and publish your app automatically whenever you push changes.

Your live app URL will be:  
`https://<your-github-username>.github.io/<your-repo-name>/`

---

### Step 3: Run as an App on iPhone
1. Open **Safari** on your iPhone and visit your GitHub Pages URL.
2. Tap the **Share** button (the square with an arrow pointing up `⎕↑`) at the bottom of Safari.
3. Scroll down and tap **Add to Home Screen** (`+`).
4. Tap **Add** in the top right.
5. An **InvoiceForge** app icon will appear on your iPhone home screen. Tap it anytime to launch InvoiceForge full-screen as a Web App!

---

## ✨ Web & iPhone Capabilities
- **Full Offline Support**: Uses Progressive Web App (PWA) caching so you can generate invoices without an internet connection.
- **PDF Generation & Downloads**: PDFs are generated in-memory and saved directly to iPhone Files / Safari Downloads.
- **Payment Stamping**: Stamp invoices as paid with custom dates, payment methods, and reference codes.
- **Local Persistence**: Client records, business details, and invoice history remain safely stored in your browser's local storage.
