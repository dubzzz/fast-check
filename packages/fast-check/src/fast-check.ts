export { pre } from './check/precondition/Pre.js';
export { asyncProperty } from './check/property/AsyncProperty.js';
export type { PropertyFailure } from './check/property/types/PropertyFailure.js';
export type { Property } from './check/property/types/Property.js';
export type { PropertyWithHooks, PropertyHookFunction } from './check/property/types/PropertyWithHooks.js';
export type { Parameters } from './check/runner/configuration/Parameters.js';
export type {
  RunDetails,
  RunDetailsFailureProperty,
  RunDetailsFailureTooManySkips,
  RunDetailsFailureInterrupted,
  RunDetailsSuccess,
  RunDetailsCommon,
} from './check/runner/reporter/RunDetails.js';
export { assert, check } from './check/runner/Runner.js';
export { sample, statistics } from './check/runner/Sampler.js';

export type { GeneratorValue } from './arbitrary/gen.js';
export { gen } from './arbitrary/gen.js';
export type { ArrayConstraints } from './arbitrary/array.js';
export { array } from './arbitrary/array.js';
export type { BigIntConstraints } from './arbitrary/bigInt.js';
export { bigInt } from './arbitrary/bigInt.js';
export { boolean } from './arbitrary/boolean.js';
export type { FalsyContraints, FalsyValue } from './arbitrary/falsy.js';
export { falsy } from './arbitrary/falsy.js';
export { constant } from './arbitrary/constant.js';
export { constantFrom } from './arbitrary/constantFrom.js';
export type { ContextValue } from './arbitrary/context.js';
export { context } from './arbitrary/context.js';
export type { DateConstraints } from './arbitrary/date.js';
export { date } from './arbitrary/date.js';
export type { CloneValue } from './arbitrary/clone.js';
export { chainUntil } from './arbitrary/chainUntil.js';
export { clone } from './arbitrary/clone.js';
export type { DictionaryConstraints } from './arbitrary/dictionary.js';
export { dictionary } from './arbitrary/dictionary.js';
export type { EmailAddressConstraints } from './arbitrary/emailAddress.js';
export { emailAddress } from './arbitrary/emailAddress.js';
export type { DoubleConstraints } from './arbitrary/double.js';
export { double } from './arbitrary/double.js';
export type { FloatConstraints } from './arbitrary/float.js';
export { float } from './arbitrary/float.js';
export { compareBooleanFunc } from './arbitrary/compareBooleanFunc.js';
export { compareFunc } from './arbitrary/compareFunc.js';
export { func } from './arbitrary/func.js';
export type { DomainConstraints } from './arbitrary/domain.js';
export { domain } from './arbitrary/domain.js';
export type { IntegerConstraints } from './arbitrary/integer.js';
export { integer } from './arbitrary/integer.js';
export { maxSafeInteger } from './arbitrary/maxSafeInteger.js';
export { maxSafeNat } from './arbitrary/maxSafeNat.js';
export type { NatConstraints } from './arbitrary/nat.js';
export { nat } from './arbitrary/nat.js';
export { ipV4 } from './arbitrary/ipV4.js';
export { ipV4Extended } from './arbitrary/ipV4Extended.js';
export { ipV6 } from './arbitrary/ipV6.js';
export type {
  LetrecValue,
  LetrecLooselyTypedBuilder,
  LetrecLooselyTypedTie,
  LetrecTypedBuilder,
  LetrecTypedTie,
} from './arbitrary/letrec.js';
export { letrec } from './arbitrary/letrec.js';
export type {
  EntityGraphArbitraries,
  EntityGraphConstraints,
  EntityGraphContraints,
  EntityGraphRelations,
  EntityGraphValue,
} from './arbitrary/entityGraph.js';
export { entityGraph } from './arbitrary/entityGraph.js';
export type { LoremConstraints } from './arbitrary/lorem.js';
export { lorem } from './arbitrary/lorem.js';
export type { MapConstraints } from './arbitrary/map.js';
export { map } from './arbitrary/map.js';
export { mapToConstant } from './arbitrary/mapToConstant.js';
export type { Memo } from './arbitrary/memo.js';
export { memo } from './arbitrary/memo.js';
export type { MixedCaseConstraints } from './arbitrary/mixedCase.js';
export { mixedCase } from './arbitrary/mixedCase.js';
export type { ObjectConstraints } from './arbitrary/object.js';
export { object } from './arbitrary/object.js';
export type { JsonSharedConstraints } from './arbitrary/json.js';
export { json } from './arbitrary/json.js';
export { anything } from './arbitrary/anything.js';
export type { JsonValue } from './arbitrary/jsonValue.js';
export { jsonValue } from './arbitrary/jsonValue.js';
export type { OneOfValue, OneOfConstraints, MaybeWeightedArbitrary, WeightedArbitrary } from './arbitrary/oneof.js';
export { oneof } from './arbitrary/oneof.js';
export type { OptionConstraints } from './arbitrary/option.js';
export { option } from './arbitrary/option.js';
export type { RecordConstraints, RecordValue } from './arbitrary/record.js';
export { record } from './arbitrary/record.js';
export type {
  UniqueArrayConstraints,
  UniqueArraySharedConstraints,
  UniqueArrayConstraintsRecommended,
  UniqueArrayConstraintsCustomCompare,
  UniqueArrayConstraintsCustomCompareSelect,
} from './arbitrary/uniqueArray.js';
export { uniqueArray } from './arbitrary/uniqueArray.js';
export type { SetConstraints } from './arbitrary/set.js';
export { set } from './arbitrary/set.js';
export { infiniteStream } from './arbitrary/infiniteStream.js';
export { base64String } from './arbitrary/base64String.js';
export type { StringSharedConstraints, StringConstraints } from './arbitrary/string.js';
export { string } from './arbitrary/string.js';
export type { SubarrayConstraints } from './arbitrary/subarray.js';
export { subarray } from './arbitrary/subarray.js';
export type { ShuffledSubarrayConstraints } from './arbitrary/shuffledSubarray.js';
export { shuffledSubarray } from './arbitrary/shuffledSubarray.js';
export { tuple } from './arbitrary/tuple.js';
export { ulid } from './arbitrary/ulid.js';
export { uuid } from './arbitrary/uuid.js';
export type { UuidConstraints } from './arbitrary/uuid.js';
export type { WebAuthorityConstraints } from './arbitrary/webAuthority.js';
export { webAuthority } from './arbitrary/webAuthority.js';
export type { WebFragmentsConstraints } from './arbitrary/webFragments.js';
export { webFragments } from './arbitrary/webFragments.js';
export type { WebPathConstraints } from './arbitrary/webPath.js';
export { webPath } from './arbitrary/webPath.js';
export type { WebQueryParametersConstraints } from './arbitrary/webQueryParameters.js';
export { webQueryParameters } from './arbitrary/webQueryParameters.js';
export type { WebSegmentConstraints } from './arbitrary/webSegment.js';
export { webSegment } from './arbitrary/webSegment.js';
export type { WebUrlConstraints } from './arbitrary/webUrl.js';
export { webUrl } from './arbitrary/webUrl.js';

export type { AsyncCommand } from './check/model/command/AsyncCommand.js';
export type { Command } from './check/model/command/Command.js';
export type { ICommand } from './check/model/command/ICommand.js';
export { commands } from './arbitrary/commands.js';
export type { ModelRunSetup, ModelRunAsyncSetup } from './check/model/ModelRunner.js';
export { asyncModelRun, modelRun, scheduledModelRun } from './check/model/ModelRunner.js';

export { Random } from './random/generator/Random.js';

export type {
  GlobalParameters,
  GlobalAsyncPropertyHookFunction,
  GlobalPropertyHookFunction,
} from './check/runner/configuration/GlobalParameters.js';
export {
  configureGlobal,
  readConfigureGlobal,
  resetConfigureGlobal,
} from './check/runner/configuration/GlobalParameters.js';
export { VerbosityLevel } from './check/runner/configuration/VerbosityLevel.js';
export { ExecutionStatus } from './check/runner/reporter/ExecutionStatus.js';
export type { ExecutionTree } from './check/runner/reporter/ExecutionTree.js';
export type { WithCloneMethod } from './check/symbols.js';
export { cloneMethod, cloneIfNeeded, hasCloneMethod } from './check/symbols.js';
export { Stream, stream } from './stream/Stream.js';
export { hash } from './utils/hash.js';
export type { WithToStringMethod, WithAsyncToStringMethod } from './utils/stringify.js';
export {
  stringify,
  asyncStringify,
  toStringMethod,
  hasToStringMethod,
  asyncToStringMethod,
  hasAsyncToStringMethod,
} from './utils/stringify.js';
export type {
  Scheduler,
  SchedulerSequenceItem,
  SchedulerReportItem,
  SchedulerConstraints,
} from './arbitrary/scheduler.js';
export { scheduler, schedulerFor } from './arbitrary/scheduler.js';
export { defaultReportMessage, asyncDefaultReportMessage } from './check/runner/utils/RunDetailsFormatter.js';
export type { CommandsContraints } from './check/model/commands/CommandsContraints.js';
export { PreconditionFailure } from './check/precondition/PreconditionFailure.js';
export type { RandomType } from './check/runner/configuration/RandomType.js';
export type { IntArrayConstraints } from './arbitrary/int8Array.js';
export { int8Array } from './arbitrary/int8Array.js';
export { int16Array } from './arbitrary/int16Array.js';
export { int32Array } from './arbitrary/int32Array.js';
export { uint8Array } from './arbitrary/uint8Array.js';
export { uint8ClampedArray } from './arbitrary/uint8ClampedArray.js';
export { uint16Array } from './arbitrary/uint16Array.js';
export { uint32Array } from './arbitrary/uint32Array.js';
export type { Float32ArrayConstraints } from './arbitrary/float32Array.js';
export { float32Array } from './arbitrary/float32Array.js';
export type { Float64ArrayConstraints } from './arbitrary/float64Array.js';
export { float64Array } from './arbitrary/float64Array.js';
export type { SparseArrayConstraints } from './arbitrary/sparseArray.js';
export { sparseArray } from './arbitrary/sparseArray.js';
export { Arbitrary } from './check/arbitrary/definition/Arbitrary.js';
export { Value } from './check/arbitrary/definition/Value.js';
export type { Size, SizeForArbitrary, DepthSize } from './arbitrary/_internals/helpers/MaxLengthFromMinLength.js';
export type { DepthContext, DepthIdentifier } from './arbitrary/_internals/helpers/DepthContext.js';
export { createDepthIdentifier, getDepthContextFor } from './arbitrary/_internals/helpers/DepthContext.js';
export type { BigIntArrayConstraints } from './arbitrary/bigInt64Array.js';
export { bigInt64Array } from './arbitrary/bigInt64Array.js';
export { bigUint64Array } from './arbitrary/bigUint64Array.js';
export type { SchedulerAct } from './arbitrary/_internals/interfaces/Scheduler.js';
export type { StringMatchingConstraints } from './arbitrary/stringMatching.js';
export { stringMatching } from './arbitrary/stringMatching.js';
export { noShrink } from './arbitrary/noShrink.js';
export { noBias } from './arbitrary/noBias.js';
export { limitShrink } from './arbitrary/limitShrink.js';
export type { RandomGenerator } from './random/generator/RandomGenerator.js';

// Explicit cast into string to avoid to have __type: "process.env.__PACKAGE_TYPE__"
/**
 * Type of module (commonjs or module)
 * @remarks Since 1.22.0
 * @public
 */
export const __type = process.env.__PACKAGE_TYPE__ as string;
/**
 * Version of fast-check used by your project (eg.: process.env.__PACKAGE_VERSION__)
 * @remarks Since 1.22.0
 * @public
 */
export const __version = process.env.__PACKAGE_VERSION__ as string;
/**
 * Commit hash of the current code (eg.: process.env.__COMMIT_HASH__)
 * @remarks Since 2.7.0
 * @public
 */
export const __commitHash = process.env.__COMMIT_HASH__ as string;
