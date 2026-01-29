import { defineConfig } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';

const inputDir = 'src';
const outputDir = 'lib';

export default function buildConfigFor(pkg, dirname) {
  const inputs = Object.values(pkg.exports)
    .filter((filePath) => filePath.endsWith('.js'))
    .map((filePath) => filePath.replace(`./${outputDir}/`, `./${inputDir}/`));

  return defineConfig({
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
    external: [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)],
    treeshake: {
      moduleSideEffects: false,
    },
    plugins: [dts({ tsconfig: './tsconfig.publish.types.json' })],
  });
}
