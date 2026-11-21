import type { API, FileInfo } from 'jscodeshift';
import { awaitAssertions } from './awaitAssert.js';

export default function transform(file: FileInfo, api: API): string {
  return awaitAssertions(file, api, true);
}
