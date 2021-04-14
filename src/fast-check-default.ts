import { pre } from './check/precondition/Pre';
import {
  asyncProperty,
  IAsyncProperty,
  IAsyncPropertyWithHooks,
  AsyncPropertyHookFunction,
} from './check/property/AsyncProperty';
import { property, IProperty, IPropertyWithHooks, PropertyHookFunction } from './check/property/Property';
import { IRawProperty } from './check/property/IRawProperty';
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
import { boolean } from './check/arbitrary/BooleanArbitrary';
import { falsy, FalsyContraints, FalsyValue } from './check/arbitrary/FalsyArbitrary';
import { ascii, base64, char, char16bits, fullUnicode, hexa, unicode } from './check/arbitrary/CharacterArbitrary';
import { clonedConstant, constant, constantFrom } from './check/arbitrary/ConstantArbitrary';
import { context, ContextValue } from './check/arbitrary/ContextArbitrary';
import { date } from './check/arbitrary/DateArbitrary';
import { clone, CloneValue } from './check/arbitrary/CloneArbitrary';
import { dedup, DedupValue } from './check/arbitrary/DedupArbitrary';
import { Arbitrary } from './check/arbitrary/definition/Arbitrary';
import { Shrinkable } from './check/arbitrary/definition/Shrinkable';
import { dictionary } from './check/arbitrary/DictionaryArbitrary';
import { emailAddress } from './check/arbitrary/EmailArbitrary';
import { double, float, DoubleConstraints, FloatConstraints } from './check/arbitrary/FloatingPointArbitrary';
import { frequency, WeightedArbitrary, FrequencyValue, FrequencyContraints } from './arbitrary/frequency';
import { compareBooleanFunc, compareFunc, func } from './check/arbitrary/FunctionArbitrary';
import { domain } from './check/arbitrary/HostArbitrary';
import { integer, IntegerConstraints } from './arbitrary/integer';
import { maxSafeInteger } from './arbitrary/maxSafeInteger';
import { maxSafeNat } from './arbitrary/maxSafeNat';
import { nat, NatConstraints } from './arbitrary/nat';
import { ipV4, ipV4Extended, ipV6 } from './check/arbitrary/IpArbitrary';
import { letrec } from './check/arbitrary/LetRecArbitrary';
import { lorem, LoremConstraints } from './check/arbitrary/LoremArbitrary';
import { mapToConstant } from './check/arbitrary/MapToConstantArbitrary';
import { memo, Memo } from './check/arbitrary/MemoArbitrary';
import { mixedCase, MixedCaseConstraints } from './check/arbitrary/MixedCaseArbitrary';
import {
  anything,
  json,
  JsonSharedConstraints,
  jsonObject,
  object,
  ObjectConstraints,
  unicodeJson,
  unicodeJsonObject,
} from './check/arbitrary/ObjectArbitrary';
import { oneof, OneOfValue, OneOfConstraints } from './arbitrary/oneof';
import { option, OptionConstraints } from './arbitrary/option';
import { record, RecordConstraints, RecordValue } from './check/arbitrary/RecordArbitrary';
import { set, SetConstraints } from './arbitrary/set';
import { infiniteStream } from './check/arbitrary/StreamArbitrary';
import {
  asciiString,
  base64String,
  fullUnicodeString,
  hexaString,
  string,
  string16bits,
  stringOf,
  StringSharedConstraints,
  unicodeString,
} from './check/arbitrary/StringArbitrary';
import { shuffledSubarray, subarray, SubarrayConstraints } from './check/arbitrary/SubarrayArbitrary';
import { genericTuple } from './arbitrary/genericTuple';
import { tuple } from './arbitrary/tuple';
import { uuid, uuidV } from './check/arbitrary/UuidArbitrary';
import {
  webAuthority,
  WebAuthorityConstraints,
  webFragments,
  webQueryParameters,
  webSegment,
  webUrl,
  WebUrlConstraints,
} from './check/arbitrary/WebArbitrary';

import { AsyncCommand } from './check/model/command/AsyncCommand';
import { Command } from './check/model/command/Command';
import { ICommand } from './check/model/command/ICommand';
import { commands } from './check/model/commands/CommandsArbitrary';
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
import { stringify } from './utils/stringify';
import {
  scheduler,
  schedulerFor,
  Scheduler,
  SchedulerSequenceItem,
  SchedulerReportItem,
  SchedulerConstraints,
} from './check/arbitrary/AsyncSchedulerArbitrary';
import { defaultReportMessage } from './check/runner/utils/RunDetailsFormatter';
import { ArbitraryWithShrink } from './check/arbitrary/definition/ArbitraryWithShrink';
import { ArbitraryWithContextualShrink } from './check/arbitrary/definition/ArbitraryWithContextualShrink';
import { CommandsContraints } from './check/model/commands/CommandsContraints';
import { PreconditionFailure } from './check/precondition/PreconditionFailure';
import { RandomType } from './check/runner/configuration/RandomType';
import { FloatNextConstraints } from './check/arbitrary/FloatNextArbitrary';
import {
  float32Array,
  float64Array,
  Float32ArrayConstraints,
  int16Array,
  int32Array,
  int8Array,
  IntArrayConstraints,
  uint16Array,
  uint32Array,
  uint8Array,
  uint8ClampedArray,
  Float64ArrayConstraints,
} from './check/arbitrary/TypedArrayArbitrary';
import { sparseArray, SparseArrayConstraints } from './check/arbitrary/SparseArrayArbitrary';
import { DoubleNextConstraints } from './check/arbitrary/DoubleNextArbitrary';
import { NextArbitrary } from './check/arbitrary/definition/NextArbitrary';
import { NextValue } from './check/arbitrary/definition/NextValue';
import { convertFromNext, convertFromNextWithShrunkOnce, convertToNext } from './check/arbitrary/definition/Converters';

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

/**
 * @deprecated Switch to {@link ContextValue} instead
 * @remarks Since 1.8.0
 * @public
 */
type Context = ContextValue;

/**
 * @deprecated Switch to {@link FalsyValue} instead
 * @remarks Since 1.26.0
 * @public
 */
type FalsyType = FalsyValue;

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
  clonedConstant,
  mapToConstant,
  option,
  oneof,
  frequency,
  clone,
  dedup,
  shuffledSubarray,
  subarray,
  array,
  sparseArray,
  infiniteStream,
  set,
  tuple,
  genericTuple,
  record,
  dictionary,
  anything,
  object,
  json,
  jsonObject,
  unicodeJson,
  unicodeJsonObject,
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
  NextArbitrary,
  ArbitraryWithShrink,
  ArbitraryWithContextualShrink,
  Shrinkable,
  NextValue,
  cloneMethod,
  cloneIfNeeded,
  hasCloneMethod,
  WithCloneMethod,
  convertFromNext,
  convertFromNextWithShrunkOnce,
  convertToNext,
  // print values
  stringify,
  defaultReportMessage,
  hash,
  // constraints
  ArrayConstraints,
  BigIntConstraints,
  BigUintConstraints,
  CommandsContraints,
  DoubleConstraints,
  DoubleNextConstraints,
  FalsyContraints,
  Float32ArrayConstraints,
  Float64ArrayConstraints,
  FloatConstraints,
  FloatNextConstraints,
  FrequencyContraints,
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
  SetConstraints,
  SparseArrayConstraints,
  StringSharedConstraints,
  SubarrayConstraints,
  WebAuthorityConstraints,
  WebUrlConstraints,
  WeightedArbitrary,
  // produced values
  CloneValue,
  ContextValue,
  DedupValue,
  FalsyValue,
  FrequencyValue,
  OneOfValue,
  RecordValue,
  // arbitrary types (mostly when produced values are difficult to formalize)
  Memo,
  // run configuration
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
  // depreciated
  Context,
  FalsyType,
};
