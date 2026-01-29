import buildConfigFor from '../../rolldown.common.config.js';
import pkg from './package.json' with { type: 'json' };

export default buildConfigFor(pkg, import.meta.dirname);
