import { safeApply } from './apply';

const untouchedToString = Object.prototype.toString;

/**
 * Safe Object.prototype.toString
 * @internal
 */
export function safeToString(instance: unknown): string {
  return safeApply(untouchedToString, instance, []);
}
