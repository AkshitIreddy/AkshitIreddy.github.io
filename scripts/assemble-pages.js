const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const destination = path.join(root, 'dist');
const siteFiles = [
  'index.html',
  '.nojekyll',
  'LICENSE',
  'MEDIA_NOTICE.md',
  'THIRD_PARTY_NOTICES.md',
  'styles/museum.css',
  'styles/premium/base.css',
  'styles/premium/alcove.css',
  'styles/premium/pet.css',
  'styles/premium/archive.css',
  'styles/premium/tools.css',
  'styles/calm.css',
  'scripts/museum.js',
  'scripts/premium/localized-motion.js',
  'scripts/premium/alcove.js',
  'scripts/premium/pet.js',
  'scripts/premium/archive.js',
  'scripts/premium/bootstrap.js',
  'public/favicon-aperture.svg',
  'public/favicon-aperture-16.png',
  'public/favicon-aperture-32.png',
  'public/favicon-aperture-48.png',
  'public/favicon-aperture-180.png',
  'public/favicon-aperture-mask.svg',
  'public/site.webmanifest',
  'public/social-preview.png',
  'public/fonts/OFL-1.1.txt',
  'public/fonts/dm-sans-latin-variable.woff2',
  'public/fonts/fraunces-latin-variable.woff2',
  'public/fonts/ibm-plex-mono-400.woff2',
  'public/fonts/ibm-plex-mono-600.woff2',
  'public/fonts/ibm-plex-mono-700.woff2',
  'public/media/akshit-avatar.webp',
  'public/media/generated/hero-studio-night-v1.webp',
  'public/media/features/alcove-poster.webp',
  'public/media/features/alcove.webm',
  'public/media/features/alcove.mp4',
  'public/media/features/pet-poster.webp',
  'public/media/features/pet.webm',
  'public/media/features/pet.mp4',
  'public/media/features/keyscape-poster.webp',
  'public/media/features/keyscape.webm',
  'public/media/features/keyscape.mp4',
  'public/media/features/email-poster.webp',
  'public/media/features/email.webm',
  'public/media/features/email.mp4',
  'public/media/features/gifsmith-poster.webp',
  'public/media/features/gifsmith.webm',
  'public/media/features/gifsmith.mp4',
  'public/media/features/compendium-poster.webp',
  'public/media/features/compendium.webm',
  'public/media/features/compendium.mp4',
  'public/media/features/transparency.webp',
  'public/media/archive/interactive-llm-npcs-poster.webp',
  'public/media/archive/interactive-llm-npcs.webm',
  'public/media/archive/interactive-llm-npcs.mp4',
  'public/media/archive/video-tutorial-poster.webp',
  'public/media/archive/video-tutorial.webm',
  'public/media/archive/video-tutorial.mp4',
  'public/media/archive/cupcakeagi-poster.webp',
  'public/media/archive/cupcakeagi.webm',
  'public/media/archive/cupcakeagi.mp4',
];

const missing = siteFiles.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
if (missing.length) {
  throw new Error(`Pages build is missing required files:\n${missing.join('\n')}`);
}

const referencedPublicFiles = new Set();
for (const relativePath of ['index.html', 'styles/museum.css', 'styles/premium/base.css', 'styles/premium/alcove.css', 'styles/premium/pet.css', 'styles/premium/archive.css', 'styles/premium/tools.css', 'styles/calm.css', 'scripts/museum.js', 'scripts/premium/localized-motion.js', 'scripts/premium/alcove.js', 'scripts/premium/pet.js', 'scripts/premium/archive.js', 'scripts/premium/bootstrap.js']) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  for (const match of source.matchAll(/public\/[A-Za-z0-9_./-]+/g)) referencedPublicFiles.add(match[0]);
}
const omittedReferences = [...referencedPublicFiles].filter((relativePath) => !siteFiles.includes(relativePath));
if (omittedReferences.length) {
  throw new Error(`Pages build omits referenced public files:\n${omittedReferences.join('\n')}`);
}

fs.rmSync(destination, { recursive: true, force: true });
for (const relativePath of siteFiles) {
  const source = path.join(root, relativePath);
  const target = path.join(destination, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

const bytes = siteFiles.reduce((total, relativePath) => total + fs.statSync(path.join(destination, relativePath)).size, 0);
console.log(`Assembled ${siteFiles.length} files in dist (${(bytes / 1024 / 1024).toFixed(2)} MiB).`);
