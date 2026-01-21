# Dondlinger GC Website

## Deployment
This site is deployed using **GitHub Pages** with a custom domain (dondlingergc.com).

### How to Deploy
1. Push changes to the `main` branch
2. GitHub Pages automatically deploys from the repository root
3. Changes are live within minutes

## Features
- Interactive 3D architectural previews with Three.js
- Blueprints gallery with embedded PDFs and images
- Contact form via Formspree
- Modern glassmorphism UI with View Transitions API

## Contact Form Setup
The contact form uses [Formspree](https://formspree.io) for handling submissions:

1. Sign up for a free Formspree account
2. Create a new form and get your form ID
3. Replace `YOUR_FORM_ID` in `index.html` with your actual form ID
4. Form submissions will be emailed to you

## File Structure
- `index.html` - Main website
- `blueprints/` - Architectural drawings and PDFs
- `CNAME` - Custom domain configuration
- `.gitignore` - Git ignore rules

## Development
- Edit `index.html` for content changes
- Add new blueprints to the `blueprints/` folder
- Commit and push to deploy