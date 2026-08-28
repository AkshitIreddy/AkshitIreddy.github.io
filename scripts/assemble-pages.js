const fs = require('fs');
const path = require('path');
const { buildComponentBundle, replaceComponentScripts, sha256 } = require('./lib/build-components');

const root = path.resolve(__dirname, '..');
const destination = path.join(root, 'dist');
const componentSources = [
  'scripts/components/alcove.js',
  'scripts/components/pet.js',
  'scripts/components/archive.js',
  'scripts/components/workbench.js',
  'scripts/components/keyscape.js',
  'scripts/components/motion.js',
];
const deployedScripts = [
  'scripts/museum.js',
  'scripts/lib/localized-motion.js',
  'scripts/components.bundle.js',
];
const copiedSiteFiles = [
  'index.html',
  '.nojekyll',
  'LICENSE',
  'MEDIA_NOTICE.md',
  'THIRD_PARTY_NOTICES.md',
  'styles/site.css',
  'styles/rooms.css',
  'scripts/museum.js',
  'scripts/lib/localized-motion.js',
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
const referenceInputs = [
  'index.html',
  'styles/site.css',
  'styles/rooms.css',
  'scripts/museum.js',
  'scripts/lib/localized-motion.js',
  ...componentSources,
];

const requiredSources = [...new Set([...copiedSiteFiles, ...componentSources])];
const missing = requiredSources.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
if (missing.length) {
  throw new Error(`Pages build is missing required files:\n${missing.join('\n')}`);
}

const referencedPublicFiles = new Set();
for (const relativePath of referenceInputs) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  for (const match of source.matchAll(/public\/[A-Za-z0-9_./-]+/g)) referencedPublicFiles.add(match[0]);
}
const omittedReferences = [...referencedPublicFiles].filter((relativePath) => !copiedSiteFiles.includes(relativePath));
if (omittedReferences.length) {
  throw new Error(`Pages build omits referenced public files:\n${omittedReferences.join('\n')}`);
}

function copy(relativePath) {
  const source = path.join(root, relativePath);
  const target = path.join(destination, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function transformDeployedIndex() {
  const deployedIndex = path.join(destination, 'index.html');
  const html = replaceComponentScripts(
    fs.readFileSync(deployedIndex, 'utf8'),
    componentSources,
    'scripts/components.bundle.js',
  );
  fs.writeFileSync(deployedIndex, html);
}

function writeJson(relativePath, value) {
  const target = path.join(destination, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

fs.rmSync(destination, { recursive: true, force: true });
for (const relativePath of copiedSiteFiles) copy(relativePath);

const bundle = buildComponentBundle(
  componentSources,
  (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8'),
);
const bundlePath = path.join(destination, 'scripts/components.bundle.js');
fs.mkdirSync(path.dirname(bundlePath), { recursive: true });
fs.writeFileSync(bundlePath, bundle);
transformDeployedIndex();

const sourceManifest = {
  entry: 'index.html',
  scripts: ['scripts/museum.js', 'scripts/lib/localized-motion.js', ...componentSources],
  componentSources,
  publicReferenceScanInputs: referenceInputs,
};
const deploymentManifest = {
  entry: 'index.html',
  scripts: deployedScripts,
  componentBundle: {
    path: 'scripts/components.bundle.js',
    orderedSources: componentSources,
    bytes: Buffer.byteLength(bundle),
    sha256: sha256(bundle),
  },
  omittedSourceFiles: componentSources,
};
writeJson('source-manifest.json', sourceManifest);
writeJson('deployment-manifest.json', deploymentManifest);

const emittedFiles = [
  ...copiedSiteFiles,
  'scripts/components.bundle.js',
  'source-manifest.json',
  'deployment-manifest.json',
];
const bytes = emittedFiles.reduce((total, relativePath) => total + fs.statSync(path.join(destination, relativePath)).size, 0);
console.log(`Assembled ${emittedFiles.length} files in dist (${(bytes / 1024 / 1024).toFixed(2)} MiB).`);
console.log(`Bundled ${componentSources.length} components in declared order (${Buffer.byteLength(bundle)} bytes).`);
