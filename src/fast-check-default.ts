import { pre } from './check/precondition/Pre';
import { asyncProperty } from './check/property/AsyncProperty';
import { property } from './check/property/Property';
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
import { dedup } from './check/arbitrary/DedupArbitrary';
import { Arbitrary } from './check/arbitrary/definition/Arbitrary';
import { Shrinkable } from './check/arbitrary/definition/Shrinkable';
import { dictionary } from './check/arbitrary/DictionaryArbitrary';
import { emailAddress } from './check/arbitrary/EmailArbitrary';
import { double, float } from './check/arbitrary/FloatingPointArbitrary';
import { frequency } from './check/arbitrary/FrequencyArbitrary';
import { compareBooleanFunc, compareFunc, func } from './check/arbitrary/FunctionArbitrary';
import { domain } from './check/arbitrary/HostArbitrary';
import { integer, maxSafeInteger, maxSafeNat, nat } from './check/arbitrary/IntegerArbitrary';
import { ipV4, ipV6 } from './check/arbitrary/IpArbitrary';
import { lorem } from './check/arbitrary/LoremArbitrary';
import { mapToConstant } from './check/arbitrary/MapToConstantArbitrary';
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

import { VerbosityLevel } from './check/runner/configuration/VerbosityLevel';
import { ExecutionStatus } from './check/runner/reporter/ExecutionStatus';
import { ExecutionTree } from './check/runner/reporter/ExecutionTree';
import { cloneMethod } from './check/symbols';
import { Stream, stream } from './stream/Stream';
import { stringify } from './utils/stringify';

// boolean
// floating point types
// integer types
// single character
// strings
// combination of others
// complex combinations
export {
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
  compareBooleanFunc,
  compareFunc,
  func,
  context,
  // web
  ipV4,
  ipV6,
  domain,
  webAuthority,
  webSegment,
  webFragments,
  webQueryParameters,
  webUrl,
  emailAddress,
  // model-based
  AsyncCommand,
  Command,
  ICommand,
  asyncModelRun,
  modelRun,
  commands,
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
  ObjectConstraints,
  Parameters,
  RecordConstraints,
  WebAuthorityConstraints,
  WebUrlConstraints,
  RunDetails,
  Random,
  Stream,
  stream,
  VerbosityLevel
};
