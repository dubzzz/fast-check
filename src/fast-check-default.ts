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

import { array, ArrayConstraints } from './check/arbitrary/ArrayArbitrary';
import { bigInt, bigIntN, bigUint, bigUintN } from './check/arbitrary/BigIntArbitrary';
import { boolean } from './check/arbitrary/BooleanArbitrary';
import { falsy, FalsyContraints, FalsyValue } from './check/arbitrary/FalsyArbitrary';
import { ascii, base64, char, char16bits, fullUnicode, hexa, unicode } from './check/arbitrary/CharacterArbitrary';
import { clonedConstant, constant, constantFrom } from './check/arbitrary/ConstantArbitrary';
import { context, ContextValue } from './check/arbitrary/ContextArbitrary';
import { date } from './check/arbitrary/DateArbitrary';
import { dedup, DedupValue } from './check/arbitrary/DedupArbitrary';
import { Arbitrary } from './check/arbitrary/definition/Arbitrary';
import { Shrinkable } from './check/arbitrary/definition/Shrinkable';
import { dictionary } from './check/arbitrary/DictionaryArbitrary';
import { emailAddress } from './check/arbitrary/EmailArbitrary';
import { double, float } from './check/arbitrary/FloatingPointArbitrary';
import { frequency, WeightedArbitrary, FrequencyValue } from './check/arbitrary/FrequencyArbitrary';
import { compareBooleanFunc, compareFunc, func } from './check/arbitrary/FunctionArbitrary';
import { domain } from './check/arbitrary/HostArbitrary';
import { integer, maxSafeInteger, maxSafeNat, nat } from './check/arbitrary/IntegerArbitrary';
import { ipV4, ipV4Extended, ipV6 } from './check/arbitrary/IpArbitrary';
import { letrec } from './check/arbitrary/LetRecArbitrary';
import { lorem } from './check/arbitrary/LoremArbitrary';
import { mapToConstant } from './check/arbitrary/MapToConstantArbitrary';
import { memo, Memo } from './check/arbitrary/MemoArbitrary';
import { mixedCase, MixedCaseConstraints } from './check/arbitrary/MixedCaseArbitrary';
import {
  anything,
  json,
  jsonObject,
  object,
  ObjectConstraints,
  unicodeJson,
  unicodeJsonObject,
} from './check/arbitrary/ObjectArbitrary';
import { oneof, OneOfValue } from './check/arbitrary/OneOfArbitrary';
import { option, OptionConstraints } from './check/arbitrary/OptionArbitrary';
import { record, RecordConstraints, RecordValue } from './check/arbitrary/RecordArbitrary';
import { set, SetConstraints } from './check/arbitrary/SetArbitrary';
import { infiniteStream } from './check/arbitrary/StreamArbitrary';
import {
  asciiString,
  base64String,
  fullUnicodeString,
  hexaString,
  string,
  string16bits,
  stringOf,
  unicodeString,
} from './check/arbitrary/StringArbitrary';
import { shuffledSubarray, subarray } from './check/arbitrary/SubarrayArbitrary';
import { genericTuple, tuple } from './check/arbitrary/TupleArbitrary';
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
import { cloneMethod } from './check/symbols';
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
import { CommandsContraints } from './check/model/commands/CommandsContraints';
import { PreconditionFailure } from './check/precondition/PreconditionFailure';
import { RandomType } from './check/runner/configuration/RandomType';

// Explicit cast into string to avoid to have __type: "__PACKAGE_TYPE__"
/**
 * Type of module (commonjs or module)
 * @public
 */
const __type = '__PACKAGE_TYPE__' as string;
/**
 * Version of fast-check used by your project (eg.: __PACKAGE_VERSION__)
 * @public
 */
const __version = '__PACKAGE_VERSION__' as string;

/**
 * @deprecated Switch to {@link ContextValue} instead
 * @public
 */
type Context = ContextValue;

/**
 * @deprecated Switch to {@link FalsyValue} instead
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
  dedup,
  shuffledSubarray,
  subarray,
  array,
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
  ArbitraryWithShrink,
  Shrinkable,
  cloneMethod,
  // print values
  stringify,
  defaultReportMessage,
  hash,
  // constraints
  ArrayConstraints,
  CommandsContraints,
  FalsyContraints,
  MixedCaseConstraints,
  ObjectConstraints,
  OptionConstraints,
  RecordConstraints,
  SchedulerConstraints,
  SetConstraints,
  WebAuthorityConstraints,
  WebUrlConstraints,
  WeightedArbitrary,
  // produced values
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
