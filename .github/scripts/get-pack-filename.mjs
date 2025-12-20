#!/usr/bin/env node

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read package.json from current directory
const packageJsonPath = resolve(process.cwd(), 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

// Extract package name and version
const fullName = packageJson.name;
const version = packageJson.version;

// Get the short name (last part after /)
const shortName = fullName.includes('/') 
  ? fullName.split('/').pop() 
  : fullName;

// Output format: <shortname>-<version>.tgz
const filename = `${shortName}-${version}.tgz`;
console.log(filename);
