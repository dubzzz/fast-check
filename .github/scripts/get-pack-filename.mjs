#!/usr/bin/env node

import { readFileSync } from 'fs';
import { resolve } from 'path';

try {
  // Read package.json from current directory
  const packageJsonPath = resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  // Extract package name and version
  const fullName = packageJson.name;
  const version = packageJson.version;

  if (!fullName || !version) {
    console.error('Error: package.json must contain both "name" and "version" fields');
    process.exit(1);
  }

  // Get the short name (last part after /)
  const shortName = fullName.includes('/') 
    ? fullName.split('/').pop() 
    : fullName;

  // Output format: <shortname>-<version>.tgz
  const filename = `${shortName}-${version}.tgz`;
  console.log(filename);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('Error: package.json not found in current directory');
  } else if (error instanceof SyntaxError) {
    console.error('Error: package.json contains invalid JSON');
  } else {
    console.error(`Error: ${error.message}`);
  }
  process.exit(1);
}
