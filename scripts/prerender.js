import { readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.html');
const serverDir = path.join(distDir, 'server');
const serverEntryPath = path.join(serverDir, 'entry-prerender.js');

function installBrowserStubs() {
  const noop = () => {};
  const storage = new Map();
  const localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear(),
  };

  const navigatorStub = {
    userAgent: '',
    vendor: '',
    platform: '',
    maxTouchPoints: 0,
  };

  globalThis.window = {
    addEventListener: noop,
    removeEventListener: noop,
    localStorage,
    navigator: navigatorStub,
    history: {
      replaceState: noop,
      pushState: noop,
    },
    location: {
      href: 'https://skilleditor.com/',
      origin: 'https://skilleditor.com',
      pathname: '/',
      search: '',
      hash: '',
    },
  };
  globalThis.document = {
    documentElement: {
      style: {},
    },
    addEventListener: noop,
    removeEventListener: noop,
    createElement: () => ({
      click: noop,
      setAttribute: noop,
      style: {},
    }),
    body: {
      style: {},
      appendChild: noop,
      removeChild: noop,
    },
  };
  Object.defineProperty(globalThis, 'navigator', {
    value: navigatorStub,
    configurable: true,
  });
  globalThis.localStorage = localStorage;
  globalThis.indexedDB = undefined;
}

async function prerender() {
  installBrowserStubs();

  const [{ render }, html] = await Promise.all([
    import(pathToFileURL(serverEntryPath).href),
    readFile(indexPath, 'utf8'),
  ]);

  const renderedHtml = render();
  const rootPattern = /<div id="root"><\/div>/;

  if (!rootPattern.test(html)) {
    throw new Error('Could not find empty <div id="root"></div> in dist/index.html');
  }

  await writeFile(
    indexPath,
    html.replace(rootPattern, `<div id="root">${renderedHtml}</div>`),
    'utf8'
  );

  await rm(serverDir, { recursive: true, force: true });
}

prerender().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
