import { Jimp } from 'jimp';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { createHash } from 'crypto';
import allContributors from '../src/components/HomepageContributors/all-contributors.json' with { type: 'json' };

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Collecting AVATARs for contributors

async function collectAvatar(imageUrl, imageFinalPath, squaredSize) {
  const image = await Jimp.read(imageUrl);
  await image.resize({ h: squaredSize, w: squaredSize }).write(imageFinalPath, { quality: 80 });
}
async function syncAvatars() {
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
  const pendingRequests = allAvatars.map(async (avatar) => {
    const { url, login, size } = avatar;
    const pathFinalImage = join(pathFinalAvatarDirectory, `avatar_${size}_${login}.jpg`);
    if (!existsSync(pathFinalImage)) {
      console.log(`Importing avatar ${size}x${size} for ${url}`);
      mkdirSync(pathFinalAvatarDirectory, { recursive: true });
      await collectAvatar(url, pathFinalImage, 64);
    } else {
      console.log(`Skipped import of avatar ${size}x${size} for ${url}`);
    }
  });
  await Promise.all(pendingRequests);
}
syncAvatars();

// Collecting out-sourced STATIC ASSETS

async function collectAsset(assetName, assetHash, resultingFilePath) {
  const response = await fetch(`https://github.com/dubzzz/fast-check-assets/blob/main/${assetName}?raw=true`);
  const bytes = await response.bytes();
  const shasum = createHash('sha1');
  shasum.update(bytes);
  if (assetHash !== shasum.digest('hex')) {
    throw new Error(`Unexpected asset received from ${assetName}`);
  }
  await writeFile(resultingFilePath, bytes);
}
async function syncStaticAssets() {
  const staticAssets = [
    ['blog/2023-05-16-fast-check-loves-docusaurus--social.png', '6fa4e600276c52ae703c0979d67e005edbbff5bc'],
    ['blog/2024-03-04-whats-new-in-fast-check-3-16-0--pagespeed.png', 'fd6a9d0a6d0427489380769e8bce68ca2abbe5f7'],
    [
      'blog/2024-03-26-whats-new-in-fast-check-3-17-0--worker-parent-gen.png',
      '0f56bf926c1148713f569c83605f99fd509065e5',
    ],
    [
      'blog/2024-03-26-whats-new-in-fast-check-3-17-0--worker-worker-gen.png',
      'b25f964624d7ccaf0cbcf096932e60459afea3f9',
    ],
    ['blog/2024-07-18-integrating-faker-with-fast-check--social.png', 'ff4c2c356d3fd55b8ef85f3b257384ad5c17c8fb'],
    ['blog/2024-08-29-whats-new-in-fast-check-3-22-0--printable-ascii.png', '14b3031c7a2fd41b1f8f8a4d8fc01aba0ee08c82'],
    ['blog/2024-12-11-advent-of-pbt-day-11--social.png', '66d107ddaa01fdcf2db1e92eec910c0277429ed9'],
    ['blog/2024-12-12-advent-of-pbt-day-12--social.png', '63e7e1fbcc56cd5af52d3aac26c8c672ee9579f3'],
    ['blog/2024-12-15-advent-of-pbt-day-15--social.png', 'e18485ef9c763c00c275f918c61041029829b9b9'],
    ['blog/2024-12-16-advent-of-pbt-day-16--social.png', '0c591595e30ed93406760463d0cae63b9fb0d91e'],
    ['blog/2024-12-17-advent-of-pbt-day-17--social.png', '414ead0df9748839d1190769f55ce92f40b6c6a1'],
    ['blog/2024-12-18-advent-of-pbt-day-18--social.png', '6286e6c63d919c0f7c79ebcaacba9bed13edaf3c'],
    ['blog/2024-12-19-advent-of-pbt-day-19--social.png', '94d8bf3a37ffe9d80e2b4750a909053076ab51ca'],
    ['blog/2024-12-20-advent-of-pbt-day-20--social.png', '0b088de4513c8f15ef31594ffb0af325ee3e2f67'],
    ['blog/2024-12-21-advent-of-pbt-day-21--social.png', '5430d59aa1d9f04dee2e2c5ce0cc362cedd14453'],
    ['blog/2024-12-22-advent-of-pbt-day-22--social.png', '8341b12f158c6362831f7e2569c75b209d1f289d'],
    ['blog/2024-12-23-advent-of-pbt-day-23--social.png', '92c706c8496b00c4d83aa30ec13e9cc3679f98ad'],
    ['blog/2024-12-24-advent-of-pbt-day-24--social.png', 'a819fc0f3c656ea87b376aa3013f4e9fad610860'],
    ['logo.png', 'efecc06ca7b469224b9fc79e8a62432e25bb01c5'],
    ['logos/fp-ts-128.png', '9ad04b27a9e2faade53e1d31d3fa8991f3a5fe1c'],
    ['logos/jasmine-128.png', 'd7d758f90b839963a6439e522ed9cf6cb51410e8'],
    ['logos/jest-128.png', '09e555171f6068394e71ab22c4ae1e23db4c690f'],
    ['logos/ramda-128.png', 'cbafc8c8e060260d21b9ee302be29819ff7f9a8b'],
    ['tutorials/autocomplete-bug-screenshot.png', 'c5635751997b26e8782c84de1fd94388887921fc'],
    ['tutorials/autocomplete-bug.gif', '71fc6a125522c6504721e49e9a88c4898af25a32'],
    ['tutorials/autocomplete-race-explained.png', '96c69f428b7c0caf6379fedae703d2331dc155d7'],
  ];
  const pathFinalImageDirectory = join(__dirname, '..', 'static', 'img');
  const pendingImages = staticAssets.map(async (asset) => {
    const assetName = asset[0];
    const assetHash = asset[1];
    const resultingFileDirectoryPath = path.join(pathFinalImageDirectory, ...assetName.split('/').slice(0, -1));
    const resultingFilePath = path.join(pathFinalImageDirectory, ...assetName.split('/'));
    if (existsSync(resultingFilePath)) {
      console.log(`Skipped import of image ${assetName}`);
    } else {
      console.log(`Importing image for ${assetName}`);
      mkdirSync(resultingFileDirectoryPath, { recursive: true });
      await collectAsset(assetName, assetHash, resultingFilePath);
    }
  });
  await Promise.all(pendingImages);
}
syncStaticAssets();
