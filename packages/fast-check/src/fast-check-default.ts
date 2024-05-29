import { pre } from './check/precondition/Pre';
import type {
  IAsyncProperty,
  IAsyncPropertyWithHooks,
  AsyncPropertyHookFunction,
} from './check/property/AsyncProperty';
import { asyncProperty } from './check/property/AsyncProperty';
import type { IProperty, IPropertyWithHooks, PropertyHookFunction } from './check/property/Property';
import { property } from './check/property/Property';
import type { IRawProperty, PropertyFailure } from './check/property/IRawProperty';
import type { Parameters } from './check/runner/configuration/Parameters';
import type {
  RunDetails,
  RunDetailsFailureProperty,
  RunDetailsFailureTooManySkips,
  RunDetailsFailureInterrupted,
  RunDetailsSuccess,
  RunDetailsCommon,
} from './check/runner/reporter/RunDetails';
import { assert, check } from './check/runner/Runner';
import { sample, statistics } from './check/runner/Sampler';

import type { GeneratorValue } from './arbitrary/gen';
import { gen } from './arbitrary/gen';
import type { ArrayConstraints } from './arbitrary/array';
import { array } from './arbitrary/array';
import type { BigIntConstraints } from './arbitrary/bigInt';
import { bigInt } from './arbitrary/bigInt';
import { bigIntN } from './arbitrary/bigIntN';
import type { BigUintConstraints } from './arbitrary/bigUint';
import { bigUint } from './arbitrary/bigUint';
import { bigUintN } from './arbitrary/bigUintN';
import { boolean } from './arbitrary/boolean';
import type { FalsyContraints, FalsyValue } from './arbitrary/falsy';
import { falsy } from './arbitrary/falsy';
import { ascii } from './arbitrary/ascii';
import { base64 } from './arbitrary/base64';
import { char } from './arbitrary/char';
import { char16bits } from './arbitrary/char16bits';
import { fullUnicode } from './arbitrary/fullUnicode';
import { hexa } from './arbitrary/hexa';
import { unicode } from './arbitrary/unicode';
import { constant } from './arbitrary/constant';
import { constantFrom } from './arbitrary/constantFrom';
import type { ContextValue } from './arbitrary/context';
import { context } from './arbitrary/context';
import type { DateConstraints } from './arbitrary/date';
import { date } from './arbitrary/date';
import type { CloneValue } from './arbitrary/clone';
import { clone } from './arbitrary/clone';
import type { DictionaryConstraints } from './arbitrary/dictionary';
import { dictionary } from './arbitrary/dictionary';
import type { EmailAddressConstraints } from './arbitrary/emailAddress';
import { emailAddress } from './arbitrary/emailAddress';
import type { DoubleConstraints } from './arbitrary/double';
import { double } from './arbitrary/double';
import type { FloatConstraints } from './arbitrary/float';
import { float } from './arbitrary/float';
import { compareBooleanFunc } from './arbitrary/compareBooleanFunc';
import { compareFunc } from './arbitrary/compareFunc';
import { func } from './arbitrary/func';
import type { DomainConstraints } from './arbitrary/domain';
import { domain } from './arbitrary/domain';
import type { IntegerConstraints } from './arbitrary/integer';
import { integer } from './arbitrary/integer';
import { maxSafeInteger } from './arbitrary/maxSafeInteger';
import { maxSafeNat } from './arbitrary/maxSafeNat';
import type { NatConstraints } from './arbitrary/nat';
import { nat } from './arbitrary/nat';
import { ipV4 } from './arbitrary/ipV4';
import { ipV4Extended } from './arbitrary/ipV4Extended';
import { ipV6 } from './arbitrary/ipV6';
import type {
  LetrecValue,
  LetrecLooselyTypedBuilder,
  LetrecLooselyTypedTie,
  LetrecTypedBuilder,
  LetrecTypedTie,
} from './arbitrary/letrec';
import { letrec } from './arbitrary/letrec';
import type { LoremConstraints } from './arbitrary/lorem';
import { lorem } from './arbitrary/lorem';
import { mapToConstant } from './arbitrary/mapToConstant';
import type { Memo } from './arbitrary/memo';
import { memo } from './arbitrary/memo';
import type { MixedCaseConstraints } from './arbitrary/mixedCase';
import { mixedCase } from './arbitrary/mixedCase';
import type { ObjectConstraints } from './arbitrary/object';
import { object } from './arbitrary/object';
import type { JsonSharedConstraints } from './arbitrary/json';
import { json } from './arbitrary/json';
import { anything } from './arbitrary/anything';
import type { JsonValue } from './arbitrary/jsonValue';
import { jsonValue } from './arbitrary/jsonValue';
import type { OneOfValue, OneOfConstraints, MaybeWeightedArbitrary, WeightedArbitrary } from './arbitrary/oneof';
import { oneof } from './arbitrary/oneof';
import type { OptionConstraints } from './arbitrary/option';
import { option } from './arbitrary/option';
import type { RecordConstraints, RecordValue } from './arbitrary/record';
import { record } from './arbitrary/record';
import type {
  UniqueArrayConstraints,
  UniqueArraySharedConstraints,
  UniqueArrayConstraintsRecommended,
  UniqueArrayConstraintsCustomCompare,
  UniqueArrayConstraintsCustomCompareSelect,
} from './arbitrary/uniqueArray';
import { uniqueArray } from './arbitrary/uniqueArray';
import { infiniteStream } from './arbitrary/infiniteStream';
import { asciiString } from './arbitrary/asciiString';
import { base64String } from './arbitrary/base64String';
import { fullUnicodeString } from './arbitrary/fullUnicodeString';
import { hexaString } from './arbitrary/hexaString';
import type { StringSharedConstraints, StringConstraints } from './arbitrary/string';
import { string } from './arbitrary/string';
import { string16bits } from './arbitrary/string16bits';
import { stringOf } from './arbitrary/stringOf';
import { unicodeString } from './arbitrary/unicodeString';
import type { SubarrayConstraints } from './arbitrary/subarray';
import { subarray } from './arbitrary/subarray';
import type { ShuffledSubarrayConstraints } from './arbitrary/shuffledSubarray';
import { shuffledSubarray } from './arbitrary/shuffledSubarray';
import { tuple } from './arbitrary/tuple';
import { ulid } from './arbitrary/ulid';
import { uuid } from './arbitrary/uuid';
import type { UuidConstraints } from './arbitrary/uuid';
import { uuidV } from './arbitrary/uuidV';
import type { WebAuthorityConstraints } from './arbitrary/webAuthority';
import { webAuthority } from './arbitrary/webAuthority';
import type { WebFragmentsConstraints } from './arbitrary/webFragments';
import { webFragments } from './arbitrary/webFragments';
import type { WebPathConstraints } from './arbitrary/webPath';
import { webPath } from './arbitrary/webPath';
import type { WebQueryParametersConstraints } from './arbitrary/webQueryParameters';
import { webQueryParameters } from './arbitrary/webQueryParameters';
import type { WebSegmentConstraints } from './arbitrary/webSegment';
import { webSegment } from './arbitrary/webSegment';
import type { WebUrlConstraints } from './arbitrary/webUrl';
import { webUrl } from './arbitrary/webUrl';

import type { AsyncCommand } from './check/model/command/AsyncCommand';
import type { Command } from './check/model/command/Command';
import type { ICommand } from './check/model/command/ICommand';
import { commands } from './arbitrary/commands';
import type { ModelRunSetup, ModelRunAsyncSetup } from './check/model/ModelRunner';
import { asyncModelRun, modelRun, scheduledModelRun } from './check/model/ModelRunner';

import { Random } from './random/generator/Random';

import type {
  GlobalParameters,
  GlobalAsyncPropertyHookFunction,
  GlobalPropertyHookFunction,
} from './check/runner/configuration/GlobalParameters';
import {
  configureGlobal,
  readConfigureGlobal,
  resetConfigureGlobal,
} from './check/runner/configuration/GlobalParameters';
import { VerbosityLevel } from './check/runner/configuration/VerbosityLevel';
import { ExecutionStatus } from './check/runner/reporter/ExecutionStatus';
import type { ExecutionTree } from './check/runner/reporter/ExecutionTree';
import type { WithCloneMethod } from './check/symbols';
import { cloneMethod, cloneIfNeeded, hasCloneMethod } from './check/symbols';
import { Stream, stream } from './stream/Stream';
import { hash } from './utils/hash';
import type { WithToStringMethod, WithAsyncToStringMethod } from './utils/stringify';
import {
  stringify,
  asyncStringify,
  toStringMethod,
  hasToStringMethod,
  asyncToStringMethod,
  hasAsyncToStringMethod,
} from './utils/stringify';
import type {
  Scheduler,
  SchedulerSequenceItem,
  SchedulerReportItem,
  SchedulerConstraints,
} from './arbitrary/scheduler';
import { scheduler, schedulerFor } from './arbitrary/scheduler';
import { defaultReportMessage, asyncDefaultReportMessage } from './check/runner/utils/RunDetailsFormatter';
import type { CommandsContraints } from './check/model/commands/CommandsContraints';
import { PreconditionFailure } from './check/precondition/PreconditionFailure';
import type { RandomType } from './check/runner/configuration/RandomType';
import type { IntArrayConstraints } from './arbitrary/int8Array';
import { int8Array } from './arbitrary/int8Array';
import { int16Array } from './arbitrary/int16Array';
import { int32Array } from './arbitrary/int32Array';
import { uint8Array } from './arbitrary/uint8Array';
import { uint8ClampedArray } from './arbitrary/uint8ClampedArray';
import { uint16Array } from './arbitrary/uint16Array';
import { uint32Array } from './arbitrary/uint32Array';
import type { Float32ArrayConstraints } from './arbitrary/float32Array';
import { float32Array } from './arbitrary/float32Array';
import type { Float64ArrayConstraints } from './arbitrary/float64Array';
import { float64Array } from './arbitrary/float64Array';
import type { SparseArrayConstraints } from './arbitrary/sparseArray';
import { sparseArray } from './arbitrary/sparseArray';
import { Arbitrary } from './check/arbitrary/definition/Arbitrary';
import { Value } from './check/arbitrary/definition/Value';
import type { Size, SizeForArbitrary, DepthSize } from './arbitrary/_internals/helpers/MaxLengthFromMinLength';
import type { DepthContext, DepthIdentifier } from './arbitrary/_internals/helpers/DepthContext';
import { createDepthIdentifier, getDepthContextFor } from './arbitrary/_internals/helpers/DepthContext';
import type { BigIntArrayConstraints } from './arbitrary/bigInt64Array';
import { bigInt64Array } from './arbitrary/bigInt64Array';
import { bigUint64Array } from './arbitrary/bigUint64Array';
import type { SchedulerAct } from './arbitrary/_internals/interfaces/Scheduler';
import type { StringMatchingConstraints } from './arbitrary/stringMatching';
import { stringMatching } from './arbitrary/stringMatching';
import { noShrink } from './arbitrary/noShrink';
import { noBias } from './arbitrary/noBias';
import { limitShrink } from './arbitrary/limitShrink';

// Explicit cast into string to avoid to have __type: "__PACKAGE_TYPE__"
/**
 * Type of module (commonjs or module)
 * @remarks Since 1.22.0
 * @public
 */
const __type = '__PACKAGE_TYPE__' as string;
/**
 * Version of fast-check used by your project (eg.: __PACKAGE_VERSION__)
 * @remarks Since 1.22.0
 * @public
 */
const __version = '__PACKAGE_VERSION__' as string;
/**
 * Commit hash of the current code (eg.: __COMMIT_HASH__)
 * @remarks Since 2.7.0
 * @public
 */
const __commitHash = '__COMMIT_HASH__' as string;

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
  BigUintConstraints,
  CommandsContraints,
  DateConstraints,
  DictionaryConstraints,
  DomainConstraints,
  DoubleConstraints,
  EmailAddressConstraints,
  FalsyContraints,
  Float32ArrayConstraints,
  Float64ArrayConstraints,
  FloatConstraints,
  IntArrayConstraints,
  IntegerConstraints,
  JsonSharedConstraints,
  LoremConstraints,
  MixedCaseConstraints,
  NatConstraints,
  ObjectConstraints,
  OneOfConstraints,
  OptionConstraints,
  RecordConstraints,
  SchedulerConstraints,
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
  CloneValue,
  ContextValue,
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
  bigIntN,
  bigUintN,
  bigInt,
  bigUint,
  char,
  ascii,
  char16bits,
  unicode,
  fullUnicode,
  hexa,
  base64,
  mixedCase,
  string,
  asciiString,
  string16bits,
  stringOf,
  unicodeString,
  fullUnicodeString,
  hexaString,
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
  uniqueArray,
  tuple,
  record,
  dictionary,
  anything,
  object,
  json,
  jsonValue,
  letrec,
  memo,
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
  uuidV,
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
