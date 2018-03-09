import { check, assert } from './check/runner/Runner'
import { sample, statistics } from './check/runner/Sampler'
import { Parameters, RunDetails } from './check/runner/utils/utils'
import { asyncProperty } from './check/property/AsyncProperty'
import { property } from './check/property/Property'

import Arbitrary from './check/arbitrary/definition/Arbitrary'
import Shrinkable from './check/arbitrary/definition/Shrinkable'
import { array } from './check/arbitrary/ArrayArbitrary'
import { boolean } from './check/arbitrary/BooleanArbitrary'
import { char, ascii, char16bits, unicode, fullUnicode, hexa, base64 } from './check/arbitrary/CharacterArbitrary'
import { constant, constantFrom } from './check/arbitrary/ConstantArbitrary'
import { dictionary } from './check/arbitrary/DictionaryArbitrary'
import { float, double } from './check/arbitrary/FloatingPointArbitrary'
import { frequency } from './check/arbitrary/FrequencyArbitrary'
import { integer, nat } from './check/arbitrary/IntegerArbitrary'
import { lorem } from './check/arbitrary/LoremArbitrary'
import { anything, object, jsonObject, unicodeJsonObject, json, unicodeJson, ObjectConstraints } from './check/arbitrary/ObjectArbitrary'
import { oneof } from './check/arbitrary/OneOfArbitrary'
import { option } from './check/arbitrary/OptionArbitrary'
import { record, RecordConstraints } from './check/arbitrary/RecordArbitrary'
import { string, asciiString, string16bits, unicodeString, fullUnicodeString, hexaString, base64String } from './check/arbitrary/StringArbitrary'
import { set } from './check/arbitrary/SetArbitrary'
import { tuple, generic_tuple } from './check/arbitrary/TupleArbitrary'

import { Random } from './random/generator/Random'

import { Stream, stream } from './stream/Stream'

export {
    // assess the property
    sample, statistics,
    // check the property
    check, assert,
    // property definition
    property, asyncProperty,
    // pre-built arbitraries
    boolean, // boolean
    float, double, // floating point types
    integer, nat, // integer types
    char, ascii, char16bits, unicode, fullUnicode, hexa, base64, // single character
    string, asciiString, string16bits, unicodeString, fullUnicodeString, hexaString, base64String, lorem, // strings
    constant, constantFrom, option, oneof, frequency, array, set, tuple, generic_tuple, record, // combination of others
    anything, object, json, unicodeJson, // complex combinations
    // extend the framework
    Arbitrary, Shrinkable,
    // interfaces
    ObjectConstraints, Parameters, RecordConstraints, RunDetails,
    Random,
    Stream, stream,
};
