// @ts-check
import { Jimp } from 'jimp';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { globSync } from 'glob';
import allContributors from '../src/components/HomepageContributors/all-contributors.json' with { type: 'json' };

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function collectAvatar(imageUrl, imageFinalPath, squaredSize) {
  let image = await Jimp.read(imageUrl);
  await image.resize({ h: squaredSize, w: squaredSize }).write(imageFinalPath, { quality: 80 });
}

const quotes = [
  'https://github.com/TomerAberbach.png',
  'https://github.com/ssalbdivad.png',
  'https://github.com/abrgr.png',
  'https://github.com/emilianbold.png',
  'https://github.com/jakebailey.png',
  'https://github.com/Andarist.png',
];
const authorsOfPosts = ['https://github.com/dubzzz.png'];
const allAvatars = [
  ...allContributors.contributors.map((contributor) => ({
    url: contributor.avatar_url,
    login: contributor.login,
    size: 64,
  })),
  ...quotes.map((quote) => ({
    url: quote,
    login: quote.split('/').at(-1).split('.').slice(0, -1).join('.'),
    size: 64,
  })),
  ...authorsOfPosts.map((quote) => ({
    url: quote,
    login: quote.split('/').at(-1).split('.').slice(0, -1).join('.'),
    size: 48,
  })),
];

const pathFinalAvatarDirectory = join(__dirname, '..', 'static', 'img', '_');
for (const avatar of allAvatars) {
  const { url, login, size } = avatar;
  const pathFinalImage = join(pathFinalAvatarDirectory, `avatar_${size}_${login}.jpg`);
  if (!existsSync(pathFinalImage)) {
    console.log(`Importing avatar ${size}x${size} for ${url}`);
    mkdirSync(pathFinalAvatarDirectory, { recursive: true });
    collectAvatar(url, pathFinalImage, 64);
  } else {
    console.log(`Skipped import of avatar ${size}x${size} for ${url}`);
  }
}

async function syncPngImages() {
  const imageMatcherRegex = /@site\/static\/img\/([A-Za-z0-9./-]+\.(png|gif))/g;
  const pathFinalImageDirectory = join(__dirname, '..', 'static', 'img');
  const pendingImages = new Map();
  const pendingScans = globSync(`./{blog,docs,src}/**/*.{js,ts,jsx,tsx,md}`, {
    withFileTypes: true,
    nodir: true,
  }).map(async (fileDescriptor) => {
    const fileContentBuffer = await readFile(fileDescriptor.fullpath());
    const fileContent = fileContentBuffer.toString();
    for (const m of fileContent.matchAll(imageMatcherRegex)) {
      if (!pendingImages.has(m[1])) {
        const resultingFileDirectoryPath = path.join(pathFinalImageDirectory, ...m[1].split('/').slice(0, -1));
        const resultingFilePath = path.join(pathFinalImageDirectory, ...m[1].split('/'));
        if (existsSync(resultingFilePath)) {
          console.log(`Skipped import of image ${m[1]}`);
          pendingImages.set(m[1], Promise.resolve());
        } else {
          console.log(`Importing image for ${m[1]}`);
          mkdirSync(resultingFileDirectoryPath, { recursive: true });
          pendingImages.set(
            m[1],
            fetch(`https://github.com/dubzzz/fast-check-assets/blob/main/${m[1]}?raw=true`)
              .then((response) => response.bytes())
              .then((bytes) => writeFile(resultingFilePath, bytes)),
          );
        }
      }
    }
  });
  await Promise.all(pendingScans);
  await Promise.all([...pendingImages.values()]);
}

syncPngImages();

// https://www.npmjs.com/package/ignore
// glob src/ blog/ .md .js -- '{src,blog}/**/*.{js,ts,jsx,tsx,md}'
// @site\/static\/img\/(.*\.png)
// https://github.com/dubzzz/fast-check-assets/blob/main/$1?raw=true
