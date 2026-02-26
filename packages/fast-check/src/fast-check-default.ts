import { pre } from './check/precondition/Pre.js';
import type {
  IAsyncProperty,
  IAsyncPropertyWithHooks,
  AsyncPropertyHookFunction,
} from './check/property/AsyncProperty.js';
import { asyncProperty } from './check/property/AsyncProperty.js';
import type { IProperty, IPropertyWithHooks, PropertyHookFunction } from './check/property/Property.js';
import { property } from './check/property/Property.js';
import type { IRawProperty, PropertyFailure } from './check/property/IRawProperty.js';
import type { Parameters } from './check/runner/configuration/Parameters.js';
import type {
  RunDetails,
  RunDetailsFailureProperty,
  RunDetailsFailureTooManySkips,
  RunDetailsFailureInterrupted,
  RunDetailsSuccess,
  RunDetailsCommon,
} from './check/runner/reporter/RunDetails.js';
import { assert, check } from './check/runner/Runner.js';
import { sample, statistics } from './check/runner/Sampler.js';

import type { GeneratorValue } from './arbitrary/gen.js';
import { gen } from './arbitrary/gen.js';
import type { ArrayConstraints } from './arbitrary/array.js';
import { array } from './arbitrary/array.js';
import type { BigIntConstraints } from './arbitrary/bigInt.js';
import { bigInt } from './arbitrary/bigInt.js';
import { boolean } from './arbitrary/boolean.js';
import type { FalsyContraints, FalsyValue } from './arbitrary/falsy.js';
import { falsy } from './arbitrary/falsy.js';
import { constant } from './arbitrary/constant.js';
import { constantFrom } from './arbitrary/constantFrom.js';
import type { ContextValue } from './arbitrary/context.js';
import { context } from './arbitrary/context.js';
import type { DateConstraints } from './arbitrary/date.js';
import { date } from './arbitrary/date.js';
import type { CloneValue } from './arbitrary/clone.js';
import { clone } from './arbitrary/clone.js';
import type { DictionaryConstraints } from './arbitrary/dictionary.js';
import { dictionary } from './arbitrary/dictionary.js';
import type { EmailAddressConstraints } from './arbitrary/emailAddress.js';
import { emailAddress } from './arbitrary/emailAddress.js';
import type { DoubleConstraints } from './arbitrary/double.js';
import { double } from './arbitrary/double.js';
import type { FloatConstraints } from './arbitrary/float.js';
import { float } from './arbitrary/float.js';
import { compareBooleanFunc } from './arbitrary/compareBooleanFunc.js';
import { compareFunc } from './arbitrary/compareFunc.js';
import { func } from './arbitrary/func.js';
import type { DomainConstraints } from './arbitrary/domain.js';
import { domain } from './arbitrary/domain.js';
import type { IntegerConstraints } from './arbitrary/integer.js';
import { integer } from './arbitrary/integer.js';
import { maxSafeInteger } from './arbitrary/maxSafeInteger.js';
import { maxSafeNat } from './arbitrary/maxSafeNat.js';
import type { NatConstraints } from './arbitrary/nat.js';
import { nat } from './arbitrary/nat.js';
import { ipV4 } from './arbitrary/ipV4.js';
import { ipV4Extended } from './arbitrary/ipV4Extended.js';
import { ipV6 } from './arbitrary/ipV6.js';
import type {
  LetrecValue,
  LetrecLooselyTypedBuilder,
  LetrecLooselyTypedTie,
  LetrecTypedBuilder,
  LetrecTypedTie,
} from './arbitrary/letrec.js';
import { letrec } from './arbitrary/letrec.js';
import type {
  EntityGraphArbitraries,
  EntityGraphContraints,
  EntityGraphRelations,
  EntityGraphValue,
} from './arbitrary/entityGraph.js';
import { entityGraph } from './arbitrary/entityGraph.js';
import type { LoremConstraints } from './arbitrary/lorem.js';
import { lorem } from './arbitrary/lorem.js';
import type { MapConstraints } from './arbitrary/map.js';
import { map } from './arbitrary/map.js';
import { mapToConstant } from './arbitrary/mapToConstant.js';
import type { Memo } from './arbitrary/memo.js';
import { memo } from './arbitrary/memo.js';
import type { MixedCaseConstraints } from './arbitrary/mixedCase.js';
import { mixedCase } from './arbitrary/mixedCase.js';
import type { ObjectConstraints } from './arbitrary/object.js';
import { object } from './arbitrary/object.js';
import type { JsonSharedConstraints } from './arbitrary/json.js';
import { json } from './arbitrary/json.js';
import { anything } from './arbitrary/anything.js';
import type { JsonValue } from './arbitrary/jsonValue.js';
import { jsonValue } from './arbitrary/jsonValue.js';
import type { OneOfValue, OneOfConstraints, MaybeWeightedArbitrary, WeightedArbitrary } from './arbitrary/oneof.js';
import { oneof } from './arbitrary/oneof.js';
import type { OptionConstraints } from './arbitrary/option.js';
import { option } from './arbitrary/option.js';
import type { RecordConstraints, RecordValue } from './arbitrary/record.js';
import { record } from './arbitrary/record.js';
import type {
  UniqueArrayConstraints,
  UniqueArraySharedConstraints,
  UniqueArrayConstraintsRecommended,
  UniqueArrayConstraintsCustomCompare,
  UniqueArrayConstraintsCustomCompareSelect,
} from './arbitrary/uniqueArray.js';
import { uniqueArray } from './arbitrary/uniqueArray.js';
import type { SetConstraints } from './arbitrary/set.js';
import { set } from './arbitrary/set.js';
import { infiniteStream } from './arbitrary/infiniteStream.js';
import { base64String } from './arbitrary/base64String.js';
import type { StringSharedConstraints, StringConstraints } from './arbitrary/string.js';
import { string } from './arbitrary/string.js';
import type { SubarrayConstraints } from './arbitrary/subarray.js';
import { subarray } from './arbitrary/subarray.js';
import type { ShuffledSubarrayConstraints } from './arbitrary/shuffledSubarray.js';
import { shuffledSubarray } from './arbitrary/shuffledSubarray.js';
import { tuple } from './arbitrary/tuple.js';
import { ulid } from './arbitrary/ulid.js';
import { uuid } from './arbitrary/uuid.js';
import type { UuidConstraints } from './arbitrary/uuid.js';
import type { WebAuthorityConstraints } from './arbitrary/webAuthority.js';
import { webAuthority } from './arbitrary/webAuthority.js';
import type { WebFragmentsConstraints } from './arbitrary/webFragments.js';
import { webFragments } from './arbitrary/webFragments.js';
import type { WebPathConstraints } from './arbitrary/webPath.js';
import { webPath } from './arbitrary/webPath.js';
import type { WebQueryParametersConstraints } from './arbitrary/webQueryParameters.js';
import { webQueryParameters } from './arbitrary/webQueryParameters.js';
import type { WebSegmentConstraints } from './arbitrary/webSegment.js';
import { webSegment } from './arbitrary/webSegment.js';
import type { WebUrlConstraints } from './arbitrary/webUrl.js';
import { webUrl } from './arbitrary/webUrl.js';

import type { AsyncCommand } from './check/model/command/AsyncCommand.js';
import type { Command } from './check/model/command/Command.js';
import type { ICommand } from './check/model/command/ICommand.js';
import { commands } from './arbitrary/commands.js';
import type { ModelRunSetup, ModelRunAsyncSetup } from './check/model/ModelRunner.js';
import { asyncModelRun, modelRun, scheduledModelRun } from './check/model/ModelRunner.js';

import { Random } from './random/generator/Random.js';

import type {
  GlobalParameters,
  GlobalAsyncPropertyHookFunction,
  GlobalPropertyHookFunction,
} from './check/runner/configuration/GlobalParameters.js';
import {
  configureGlobal,
  readConfigureGlobal,
  resetConfigureGlobal,
} from './check/runner/configuration/GlobalParameters.js';
import { VerbosityLevel } from './check/runner/configuration/VerbosityLevel.js';
import { ExecutionStatus } from './check/runner/reporter/ExecutionStatus.js';
import type { ExecutionTree } from './check/runner/reporter/ExecutionTree.js';
import type { WithCloneMethod } from './check/symbols.js';
import { cloneMethod, cloneIfNeeded, hasCloneMethod } from './check/symbols.js';
import { Stream, stream } from './stream/Stream.js';
import { hash } from './utils/hash.js';
import type { WithToStringMethod, WithAsyncToStringMethod } from './utils/stringify.js';
import {
  stringify,
  asyncStringify,
  toStringMethod,
  hasToStringMethod,
  asyncToStringMethod,
  hasAsyncToStringMethod,
} from './utils/stringify.js';
import type {
  Scheduler,
  SchedulerSequenceItem,
  SchedulerReportItem,
  SchedulerConstraints,
} from './arbitrary/scheduler.js';
import { scheduler, schedulerFor } from './arbitrary/scheduler.js';
import { defaultReportMessage, asyncDefaultReportMessage } from './check/runner/utils/RunDetailsFormatter.js';
import type { CommandsContraints } from './check/model/commands/CommandsContraints.js';
import { PreconditionFailure } from './check/precondition/PreconditionFailure.js';
import type { RandomType } from './check/runner/configuration/RandomType.js';
import type { IntArrayConstraints } from './arbitrary/int8Array.js';
import { int8Array } from './arbitrary/int8Array.js';
import { int16Array } from './arbitrary/int16Array.js';
import { int32Array } from './arbitrary/int32Array.js';
import { uint8Array } from './arbitrary/uint8Array.js';
import { uint8ClampedArray } from './arbitrary/uint8ClampedArray.js';
import { uint16Array } from './arbitrary/uint16Array.js';
import { uint32Array } from './arbitrary/uint32Array.js';
import type { Float32ArrayConstraints } from './arbitrary/float32Array.js';
import { float32Array } from './arbitrary/float32Array.js';
import type { Float64ArrayConstraints } from './arbitrary/float64Array.js';
import { float64Array } from './arbitrary/float64Array.js';
import type { SparseArrayConstraints } from './arbitrary/sparseArray.js';
import { sparseArray } from './arbitrary/sparseArray.js';
import { Arbitrary } from './check/arbitrary/definition/Arbitrary.js';
import { Value } from './check/arbitrary/definition/Value.js';
import type { Size, SizeForArbitrary, DepthSize } from './arbitrary/_internals/helpers/MaxLengthFromMinLength.js';
import type { DepthContext, DepthIdentifier } from './arbitrary/_internals/helpers/DepthContext.js';
import { createDepthIdentifier, getDepthContextFor } from './arbitrary/_internals/helpers/DepthContext.js';
import type { BigIntArrayConstraints } from './arbitrary/bigInt64Array.js';
import { bigInt64Array } from './arbitrary/bigInt64Array.js';
import { bigUint64Array } from './arbitrary/bigUint64Array.js';
import type { SchedulerAct } from './arbitrary/_internals/interfaces/Scheduler.js';
import type { StringMatchingConstraints } from './arbitrary/stringMatching.js';
import { stringMatching } from './arbitrary/stringMatching.js';
import { noShrink } from './arbitrary/noShrink.js';
import { noBias } from './arbitrary/noBias.js';
import { limitShrink } from './arbitrary/limitShrink.js';

// Explicit cast into string to avoid to have __type: "process.env.__PACKAGE_TYPE__"
/**
 * Type of module (commonjs or module)
 * @remarks Since 1.22.0
 * @public
 */
const __type = process.env.__PACKAGE_TYPE__ as string;
/**
 * Version of fast-check used by your project (eg.: process.env.__PACKAGE_VERSION__)
 * @remarks Since 1.22.0
 * @public
 */
const __version = process.env.__PACKAGE_VERSION__ as string;
/**
 * Commit hash of the current code (eg.: process.env.__COMMIT_HASH__)
 * @remarks Since 2.7.0
 * @public
 */
const __commitHash = process.env.__COMMIT_HASH__ as string;

// boolean
// floating point types
// integer types
// single character
// strings
// combination of others
// complex combinations
export type {
  IRawProperty,
  IProperty,
  IPropertyWithHooks,
  IAsyncProperty,
  IAsyncPropertyWithHooks,
  AsyncPropertyHookFunction,
  PropertyHookFunction,
  PropertyFailure,
  AsyncCommand,
  Command,
  ICommand,
  ModelRunSetup,
  ModelRunAsyncSetup,
  Scheduler,
  SchedulerSequenceItem,
  SchedulerReportItem,
  SchedulerAct,
  WithCloneMethod,
  WithToStringMethod,
  WithAsyncToStringMethod,
  DepthContext,
  ArrayConstraints,
  BigIntConstraints,
  BigIntArrayConstraints,
  CommandsContraints,
  DateConstraints,
  DictionaryConstraints,
  DomainConstraints,
  DoubleConstraints,
  EmailAddressConstraints,
  EntityGraphContraints,
  FalsyContraints,
  Float32ArrayConstraints,
  Float64ArrayConstraints,
  FloatConstraints,
  IntArrayConstraints,
  IntegerConstraints,
  JsonSharedConstraints,
  LoremConstraints,
  MapConstraints,
  MixedCaseConstraints,
  NatConstraints,
  ObjectConstraints,
  OneOfConstraints,
  OptionConstraints,
  RecordConstraints,
  SchedulerConstraints,
  SetConstraints,
  UniqueArrayConstraints,
  UniqueArraySharedConstraints,
  UniqueArrayConstraintsRecommended,
  UniqueArrayConstraintsCustomCompare,
  UniqueArrayConstraintsCustomCompareSelect,
  UuidConstraints,
  SparseArrayConstraints,
  StringMatchingConstraints,
  StringConstraints,
  StringSharedConstraints,
  SubarrayConstraints,
  ShuffledSubarrayConstraints,
  WebAuthorityConstraints,
  WebFragmentsConstraints,
  WebPathConstraints,
  WebQueryParametersConstraints,
  WebSegmentConstraints,
  WebUrlConstraints,
  MaybeWeightedArbitrary,
  WeightedArbitrary,
  LetrecTypedTie,
  LetrecTypedBuilder,
  LetrecLooselyTypedTie,
  LetrecLooselyTypedBuilder,
  EntityGraphArbitraries,
  EntityGraphRelations,
  CloneValue,
  ContextValue,
  EntityGraphValue,
  FalsyValue,
  GeneratorValue,
  JsonValue,
  LetrecValue,
  OneOfValue,
  RecordValue,
  Memo,
  Size,
  SizeForArbitrary,
  DepthSize,
  GlobalParameters,
  GlobalAsyncPropertyHookFunction,
  GlobalPropertyHookFunction,
  Parameters,
  RandomType,
  ExecutionTree,
  RunDetails,
  RunDetailsFailureProperty,
  RunDetailsFailureTooManySkips,
  RunDetailsFailureInterrupted,
  RunDetailsSuccess,
  RunDetailsCommon,
  DepthIdentifier,
};
export {
  __type,
  __version,
  __commitHash,
  sample,
  statistics,
  check,
  assert,
  pre,
  PreconditionFailure,
  property,
  asyncProperty,
  boolean,
  falsy,
  float,
  double,
  integer,
  nat,
  maxSafeInteger,
  maxSafeNat,
  bigInt,
  mixedCase,
  string,
  base64String,
  stringMatching,
  limitShrink,
  lorem,
  constant,
  constantFrom,
  mapToConstant,
  option,
  oneof,
  clone,
  noBias,
  noShrink,
  shuffledSubarray,
  subarray,
  array,
  sparseArray,
  infiniteStream,
  set,
  uniqueArray,
  tuple,
  record,
  dictionary,
  map,
  anything,
  object,
  json,
  jsonValue,
  letrec,
  memo,
  entityGraph,
  compareBooleanFunc,
  compareFunc,
  func,
  context,
  gen,
  date,
  ipV4,
  ipV4Extended,
  ipV6,
  domain,
  webAuthority,
  webSegment,
  webFragments,
  webPath,
  webQueryParameters,
  webUrl,
  emailAddress,
  ulid,
  uuid,
  int8Array,
  uint8Array,
  uint8ClampedArray,
  int16Array,
  uint16Array,
  int32Array,
  uint32Array,
  float32Array,
  float64Array,
  bigInt64Array,
  bigUint64Array,
  asyncModelRun,
  modelRun,
  scheduledModelRun,
  commands,
  scheduler,
  schedulerFor,
  Arbitrary,
  Value,
  cloneMethod,
  cloneIfNeeded,
  hasCloneMethod,
  toStringMethod,
  hasToStringMethod,
  asyncToStringMethod,
  hasAsyncToStringMethod,
  getDepthContextFor,
  stringify,
  asyncStringify,
  defaultReportMessage,
  asyncDefaultReportMessage,
  hash,
  VerbosityLevel,
  configureGlobal,
  readConfigureGlobal,
  resetConfigureGlobal,
  ExecutionStatus,
  Random,
  Stream,
  stream,
  createDepthIdentifier,
};
