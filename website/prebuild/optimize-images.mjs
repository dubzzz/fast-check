import jimp from 'jimp';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { join } from 'path';
import allContributors from '../src/components/HomepageContributors/all-contributors.json' assert { type: 'json' };

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function collectImage(imageUrl, imageFinalPath, squaredSize) {
  const image = await jimp.read(imageUrl);
  await image.resize(squaredSize, squaredSize).quality(80).writeAsync(imageFinalPath);
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

for (const avatar of allAvatars) {
  const { url, login, size } = avatar;
  const pathFinalImage = join(__dirname, '..', 'static', 'img', '_', `avatar_${size}_${login}.jpg`);
  if (!existsSync(pathFinalImage)) {
    console.log(`Importing avatar ${size}x${size} for ${url}`);
    collectImage(url, pathFinalImage, 64);
  } else {
    console.log(`Skipped import of avatar ${size}x${size} for ${url}`);
  }
}
