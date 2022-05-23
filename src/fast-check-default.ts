import { pre } from './check/precondition/Pre';
import {
  asyncProperty,
  IAsyncProperty,
  IAsyncPropertyWithHooks,
  AsyncPropertyHookFunction,
} from './check/property/AsyncProperty';
import { property, IProperty, IPropertyWithHooks, PropertyHookFunction } from './check/property/Property';
import { IRawProperty, PropertyFailure } from './check/property/IRawProperty';
import { Parameters } from './check/runner/configuration/Parameters';
import {
  RunDetails,
  RunDetailsFailureProperty,
  RunDetailsFailureTooManySkips,
  RunDetailsFailureInterrupted,
  RunDetailsSuccess,
  RunDetailsCommon,
} from './check/runner/reporter/RunDetails';
import { assert, check } from './check/runner/Runner';
import { sample, statistics } from './check/runner/Sampler';

import { array, ArrayConstraints } from './arbitrary/array';
import { bigInt, BigIntConstraints } from './arbitrary/bigInt';
import { bigIntN } from './arbitrary/bigIntN';
import { bigUint, BigUintConstraints } from './arbitrary/bigUint';
import { bigUintN } from './arbitrary/bigUintN';
import { boolean } from './arbitrary/boolean';
import { falsy, FalsyContraints, FalsyValue } from './arbitrary/falsy';
import { ascii } from './arbitrary/ascii';
import { base64 } from './arbitrary/base64';
import { char } from './arbitrary/char';
import { char16bits } from './arbitrary/char16bits';
import { fullUnicode } from './arbitrary/fullUnicode';
import { hexa } from './arbitrary/hexa';
import { unicode } from './arbitrary/unicode';
import { constant } from './arbitrary/constant';
import { constantFrom } from './arbitrary/constantFrom';
import { context, ContextValue } from './arbitrary/context';
import { date } from './arbitrary/date';
import { clone, CloneValue } from './arbitrary/clone';
import { dictionary, DictionaryConstraints } from './arbitrary/dictionary';
import { emailAddress, EmailAddressConstraints } from './arbitrary/emailAddress';
import { double, DoubleConstraints } from './arbitrary/double';
import { float, FloatConstraints } from './arbitrary/float';
import { compareBooleanFunc } from './arbitrary/compareBooleanFunc';
import { compareFunc } from './arbitrary/compareFunc';
import { func } from './arbitrary/func';
import { domain, DomainConstraints } from './arbitrary/domain';
import { integer, IntegerConstraints } from './arbitrary/integer';
import { maxSafeInteger } from './arbitrary/maxSafeInteger';
import { maxSafeNat } from './arbitrary/maxSafeNat';
import { nat, NatConstraints } from './arbitrary/nat';
import { ipV4 } from './arbitrary/ipV4';
import { ipV4Extended } from './arbitrary/ipV4Extended';
import { ipV6 } from './arbitrary/ipV6';
import {
  letrec,
  LetrecValue,
  LetrecLooselyTypedBuilder,
  LetrecLooselyTypedTie,
  LetrecTypedBuilder,
  LetrecTypedTie,
} from './arbitrary/letrec';
import { lorem, LoremConstraints } from './arbitrary/lorem';
import { mapToConstant } from './arbitrary/mapToConstant';
import { memo, Memo } from './arbitrary/memo';
import { mixedCase, MixedCaseConstraints } from './arbitrary/mixedCase';
import { object, ObjectConstraints } from './arbitrary/object';
import { json, JsonSharedConstraints } from './arbitrary/json';
import { anything } from './arbitrary/anything';
import { unicodeJsonValue } from './arbitrary/unicodeJsonValue';
import { jsonValue, JsonValue } from './arbitrary/jsonValue';
import { unicodeJson } from './arbitrary/unicodeJson';
import { oneof, OneOfValue, OneOfConstraints, MaybeWeightedArbitrary, WeightedArbitrary } from './arbitrary/oneof';
import { option, OptionConstraints } from './arbitrary/option';
import { record, RecordConstraints, RecordValue } from './arbitrary/record';
import {
  uniqueArray,
  UniqueArrayConstraints,
  UniqueArraySharedConstraints,
  UniqueArrayConstraintsRecommended,
  UniqueArrayConstraintsCustomCompare,
  UniqueArrayConstraintsCustomCompareSelect,
} from './arbitrary/uniqueArray';
import { infiniteStream } from './arbitrary/infiniteStream';
import { asciiString } from './arbitrary/asciiString';
import { base64String } from './arbitrary/base64String';
import { fullUnicodeString } from './arbitrary/fullUnicodeString';
import { hexaString } from './arbitrary/hexaString';
import { string, StringSharedConstraints } from './arbitrary/string';
import { string16bits } from './arbitrary/string16bits';
import { stringOf } from './arbitrary/stringOf';
import { unicodeString } from './arbitrary/unicodeString';
import { subarray, SubarrayConstraints } from './arbitrary/subarray';
import { shuffledSubarray, ShuffledSubarrayConstraints } from './arbitrary/shuffledSubarray';
import { tuple } from './arbitrary/tuple';
import { uuid } from './arbitrary/uuid';
import { uuidV } from './arbitrary/uuidV';
import { webAuthority, WebAuthorityConstraints } from './arbitrary/webAuthority';
import { webFragments, WebFragmentsConstraints } from './arbitrary/webFragments';
import { webQueryParameters, WebQueryParametersConstraints } from './arbitrary/webQueryParameters';
import { webSegment, WebSegmentConstraints } from './arbitrary/webSegment';
import { webUrl, WebUrlConstraints } from './arbitrary/webUrl';

import { AsyncCommand } from './check/model/command/AsyncCommand';
import { Command } from './check/model/command/Command';
import { ICommand } from './check/model/command/ICommand';
import { commands } from './arbitrary/commands';
import {
  asyncModelRun,
  modelRun,
  scheduledModelRun,
  ModelRunSetup,
  ModelRunAsyncSetup,
} from './check/model/ModelRunner';

import { Random } from './random/generator/Random';

import {
  configureGlobal,
  GlobalParameters,
  GlobalAsyncPropertyHookFunction,
  GlobalPropertyHookFunction,
  readConfigureGlobal,
  resetConfigureGlobal,
} from './check/runner/configuration/GlobalParameters';
import { VerbosityLevel } from './check/runner/configuration/VerbosityLevel';
import { ExecutionStatus } from './check/runner/reporter/ExecutionStatus';
import { ExecutionTree } from './check/runner/reporter/ExecutionTree';
import { cloneMethod, cloneIfNeeded, hasCloneMethod, WithCloneMethod } from './check/symbols';
import { Stream, stream } from './stream/Stream';
import { hash } from './utils/hash';
import {
  stringify,
  asyncStringify,
  toStringMethod,
  hasToStringMethod,
  WithToStringMethod,
  asyncToStringMethod,
  hasAsyncToStringMethod,
  WithAsyncToStringMethod,
} from './utils/stringify';
import {
  scheduler,
  schedulerFor,
  Scheduler,
  SchedulerSequenceItem,
  SchedulerReportItem,
  SchedulerConstraints,
} from './arbitrary/scheduler';
import { defaultReportMessage, asyncDefaultReportMessage } from './check/runner/utils/RunDetailsFormatter';
import { CommandsContraints } from './check/model/commands/CommandsContraints';
import { PreconditionFailure } from './check/precondition/PreconditionFailure';
import { RandomType } from './check/runner/configuration/RandomType';
import { int8Array, IntArrayConstraints } from './arbitrary/int8Array';
import { int16Array } from './arbitrary/int16Array';
import { int32Array } from './arbitrary/int32Array';
import { uint8Array } from './arbitrary/uint8Array';
import { uint8ClampedArray } from './arbitrary/uint8ClampedArray';
import { uint16Array } from './arbitrary/uint16Array';
import { uint32Array } from './arbitrary/uint32Array';
import { float32Array, Float32ArrayConstraints } from './arbitrary/float32Array';
import { float64Array, Float64ArrayConstraints } from './arbitrary/float64Array';
import { sparseArray, SparseArrayConstraints } from './arbitrary/sparseArray';
import { Arbitrary } from './check/arbitrary/definition/Arbitrary';
import { Value } from './check/arbitrary/definition/Value';
import { Size, SizeForArbitrary, DepthSize } from './arbitrary/_internals/helpers/MaxLengthFromMinLength';
import {
  createDepthIdentifier,
  DepthContext,
  DepthIdentifier,
  getDepthContextFor,
} from './arbitrary/_internals/helpers/DepthContext';
import { bigInt64Array, BigIntArrayConstraints } from './arbitrary/bigInt64Array';
import { bigUint64Array } from './arbitrary/bigUint64Array';

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
export {
  // meta
  __type,
  __version,
  __commitHash,
  // assess the property
  sample,
  statistics,
  // check the property
  check,
  assert,
  // pre conditions
  pre,
  PreconditionFailure,
  // property definition
  property,
  asyncProperty,
  IRawProperty,
  IProperty,
  IPropertyWithHooks,
  IAsyncProperty,
  IAsyncPropertyWithHooks,
  AsyncPropertyHookFunction,
  PropertyHookFunction,
  PropertyFailure,
  // pre-built arbitraries
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
  lorem,
  constant,
  constantFrom,
  mapToConstant,
  option,
  oneof,
  clone,
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
  unicodeJson,
  unicodeJsonValue,
  letrec,
  memo,
  compareBooleanFunc,
  compareFunc,
  func,
  context,
  date,
  // web
  ipV4,
  ipV4Extended,
  ipV6,
  domain,
  webAuthority,
  webSegment,
  webFragments,
  webQueryParameters,
  webUrl,
  emailAddress,
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
  // model-based
  AsyncCommand,
  Command,
  ICommand,
  asyncModelRun,
  modelRun,
  scheduledModelRun,
  commands,
  ModelRunSetup,
  ModelRunAsyncSetup,
  // scheduler
  scheduler,
  schedulerFor,
  Scheduler,
  SchedulerSequenceItem,
  SchedulerReportItem,
  // extend the framework
  Arbitrary,
  Value,
  cloneMethod,
  cloneIfNeeded,
  hasCloneMethod,
  WithCloneMethod,
  toStringMethod,
  hasToStringMethod,
  WithToStringMethod,
  asyncToStringMethod,
  hasAsyncToStringMethod,
  WithAsyncToStringMethod,
  DepthContext,
  getDepthContextFor,
  // print values
  stringify,
  asyncStringify,
  defaultReportMessage,
  asyncDefaultReportMessage,
  hash,
  // constraints
  ArrayConstraints,
  BigIntConstraints,
  BigIntArrayConstraints,
  BigUintConstraints,
  CommandsContraints,
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
  SparseArrayConstraints,
  StringSharedConstraints,
  SubarrayConstraints,
  ShuffledSubarrayConstraints,
  WebAuthorityConstraints,
  WebFragmentsConstraints,
  WebQueryParametersConstraints,
  WebSegmentConstraints,
  WebUrlConstraints,
  MaybeWeightedArbitrary,
  WeightedArbitrary,
  LetrecTypedTie,
  LetrecTypedBuilder,
  LetrecLooselyTypedTie,
  LetrecLooselyTypedBuilder,
  // produced values
  CloneValue,
  ContextValue,
  FalsyValue,
  JsonValue,
  LetrecValue,
  OneOfValue,
  RecordValue,
  // arbitrary types (mostly when produced values are difficult to formalize)
  Memo,
  // run configuration
  Size,
  SizeForArbitrary,
  DepthSize,
  GlobalParameters,
  GlobalAsyncPropertyHookFunction,
  GlobalPropertyHookFunction,
  Parameters,
  RandomType,
  VerbosityLevel,
  configureGlobal,
  readConfigureGlobal,
  resetConfigureGlobal,
  // run output
  ExecutionStatus,
  ExecutionTree,
  RunDetails,
  RunDetailsFailureProperty,
  RunDetailsFailureTooManySkips,
  RunDetailsFailureInterrupted,
  RunDetailsSuccess,
  RunDetailsCommon,
  // various utils
  Random,
  Stream,
  stream,
  DepthIdentifier,
  createDepthIdentifier,
};
