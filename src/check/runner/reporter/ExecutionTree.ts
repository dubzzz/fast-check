import { ExecutionStatus } from './ExecutionStatus';

/**
 * Summary of the execution process
 */
export interface ExecutionTree<Ts> {
  /** Status of the property */
  status: ExecutionStatus;
  /** Generated value */
  value: Ts;
  /** Values derived from this value */
  children: ExecutionTree<Ts>[];
}
