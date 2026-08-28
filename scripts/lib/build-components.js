const crypto = require('crypto');

function normalizeText(value) {
  return String(value).replace(/\r\n?/g, '\n');
}

function componentBanner(relativePath) {
  return `/* component-source: ${relativePath} */`;
}

function buildComponentBundle(componentSources, readSource) {
  const sections = componentSources.map((relativePath) => {
    const source = normalizeText(readSource(relativePath)).trimEnd();
    return `${componentBanner(relativePath)}\n${source}`;
  });
  return `${sections.join('\n\n')}\n`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceComponentScripts(indexHtml, componentSources, bundlePath) {
  const normalizedHtml = normalizeText(indexHtml);
  const scriptPatterns = componentSources.map((relativePath) =>
    `[ \\t]*<script\\s+src=["']${escapeRegExp(relativePath)}["']\\s*><\\/script>`,
  );
  const sequence = new RegExp(scriptPatterns.join('\\s*'), 'g');
  const matches = normalizedHtml.match(sequence) || [];
  if (matches.length !== 1) {
    throw new Error(`Expected one declared component script sequence, found ${matches.length}.`);
  }
  return normalizedHtml.replace(sequence, `    <script src="${bundlePath}"></script>`);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

module.exports = {
  buildComponentBundle,
  componentBanner,
  normalizeText,
  replaceComponentScripts,
  sha256,
};
