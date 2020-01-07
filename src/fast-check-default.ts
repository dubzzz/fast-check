import { pre } from './check/precondition/Pre';
import { asyncProperty, IAsyncProperty } from './check/property/AsyncProperty';
import { property, IProperty } from './check/property/Property';
import { IRawProperty } from './check/property/IRawProperty';
import { Parameters } from './check/runner/configuration/Parameters';
import { RunDetails } from './check/runner/reporter/RunDetails';
import { assert, check } from './check/runner/Runner';
import { sample, statistics } from './check/runner/Sampler';

import { array } from './check/arbitrary/ArrayArbitrary';
import { bigInt, bigIntN, bigUint, bigUintN } from './check/arbitrary/BigIntArbitrary';
import { boolean } from './check/arbitrary/BooleanArbitrary';
import { ascii, base64, char, char16bits, fullUnicode, hexa, unicode } from './check/arbitrary/CharacterArbitrary';
import { clonedConstant, constant, constantFrom } from './check/arbitrary/ConstantArbitrary';
import { context, Context } from './check/arbitrary/ContextArbitrary';
import { date } from './check/arbitrary/DateArbitrary';
import { dedup } from './check/arbitrary/DedupArbitrary';
import { Arbitrary } from './check/arbitrary/definition/Arbitrary';
import { Shrinkable } from './check/arbitrary/definition/Shrinkable';
import { dictionary } from './check/arbitrary/DictionaryArbitrary';
import { emailAddress } from './check/arbitrary/EmailArbitrary';
import { double, float } from './check/arbitrary/FloatingPointArbitrary';
import { frequency, WeightedArbitrary } from './check/arbitrary/FrequencyArbitrary';
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
  unicodeJsonObject
} from './check/arbitrary/ObjectArbitrary';
import { oneof } from './check/arbitrary/OneOfArbitrary';
import { option } from './check/arbitrary/OptionArbitrary';
import { record, RecordConstraints } from './check/arbitrary/RecordArbitrary';
import { set } from './check/arbitrary/SetArbitrary';
import { infiniteStream } from './check/arbitrary/StreamArbitrary';
import {
  asciiString,
  base64String,
  fullUnicodeString,
  hexaString,
  string,
  string16bits,
  stringOf,
  unicodeString
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
  WebUrlConstraints
} from './check/arbitrary/WebArbitrary';

import { AsyncCommand } from './check/model/command/AsyncCommand';
import { Command } from './check/model/command/Command';
import { ICommand } from './check/model/command/ICommand';
import { commands } from './check/model/commands/CommandsArbitrary';
import { asyncModelRun, modelRun } from './check/model/ModelRunner';

import { Random } from './random/generator/Random';

import {
  configureGlobal,
  GlobalParameters,
  readConfigureGlobal,
  resetConfigureGlobal
} from './check/runner/configuration/GlobalParameters';
import { VerbosityLevel } from './check/runner/configuration/VerbosityLevel';
import { ExecutionStatus } from './check/runner/reporter/ExecutionStatus';
import { ExecutionTree } from './check/runner/reporter/ExecutionTree';
import { cloneMethod } from './check/symbols';
import { Stream, stream } from './stream/Stream';
import { stringify } from './utils/stringify';
import { scheduler, Scheduler, SchedulerSequenceItem } from './check/arbitrary/AsyncSchedulerArbitrary';

// Explicit cast into string to avoid to have __type: "__PACKAGE_TYPE__"
const __type = '__PACKAGE_TYPE__' as string;
const __version = '__PACKAGE_VERSION__' as string;

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
  // property definition
  property,
  asyncProperty,
  IRawProperty,
  IProperty,
  IAsyncProperty,
  // pre-built arbitraries
  boolean,
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
  commands,
  // scheduler
  scheduler,
  Scheduler,
  SchedulerSequenceItem,
  // extend the framework
  Arbitrary,
  Shrinkable,
  cloneMethod,
  // print values
  stringify,
  // interfaces
  Context,
  ExecutionStatus,
  ExecutionTree,
  GlobalParameters,
  Memo,
  MixedCaseConstraints,
  ObjectConstraints,
  Parameters,
  RecordConstraints,
  WebAuthorityConstraints,
  WebUrlConstraints,
  RunDetails,
  Random,
  Stream,
  stream,
  VerbosityLevel,
  WeightedArbitrary,
  // global configuration
  configureGlobal,
  readConfigureGlobal,
  resetConfigureGlobal
};
