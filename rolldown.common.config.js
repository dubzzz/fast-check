import { defineConfig } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';
import replace from '@rollup/plugin-replace';

const inputDir = 'src';
const outputDir = 'lib';

export default function buildConfigFor(pkg, dirname, replacementsFor) {
  let isDual = false;
  const inputs = Object.values(pkg.exports)
    .map((exportValue) => {
      if (typeof exportValue === 'string') {
        return exportValue;
      }
      isDual = true;
      return exportValue.import.default;
    })
    .filter((filePath) => filePath.endsWith('.js'))
    .map((filePath) => filePath.replace(`./${outputDir}/`, `./${inputDir}/`));

  /** @type {RolldownOptions} */
  const sharedOptions = {
    input: inputs,
    output: {
      cleanDir: true,
      dir: outputDir,
      format: 'esm',
      entryFileNames: (chunkInfo) => {
        const cwdAndInputDirLength = dirname.length + inputDir.length + 2;
        const relativeFilePathWithTsExtension = chunkInfo.facadeModuleId.substring(cwdAndInputDirLength);
        return `${relativeFilePathWithTsExtension.replace(/\.ts$/, '')}.js`;
      },
    },
    external: /^[^./]/, // as recommended by https://rolldown.rs/reference/InputOptions.external#avoid-node-modules-for-npm-packages
    treeshake: {
      moduleSideEffects: false,
    },
    plugins: [],
  };
  return defineConfig([
    {
      ...sharedOptions,
      output: {
        ...sharedOptions.output,
        format: 'esm',
      },
      plugins: [
        ...sharedOptions.plugins,
        ...(replacementsFor !== undefined ? [replace(replacementsFor(true))] : []),
        dts({ tsconfig: './tsconfig.publish.types.json' }),
      ],
    },
    ...(isDual
      ? [
          {
            ...sharedOptions,
            output: {
              ...sharedOptions.output,
              format: 'cjs',
              dir: outputDir + '/cjs',
            },
            plugins: [
              ...sharedOptions.plugins,
              ...(replacementsFor !== undefined ? [replace(replacementsFor(false))] : []),
            ],
          },
        ]
      : []),
  ]);
}
