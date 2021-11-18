// You can try this codemod as follow:
//    npx jscodeshift --dry --print -t transform.cjs snippet-*.js --debug=true
//    npx jscodeshift --parser=ts --extensions=ts --dry --print -t transform.cjs snippet-*.ts --debug=true
// Or against the codebase of fast-check itself:
//    npx jscodeshift --parser=ts --extensions=ts -t transform.cjs ../../example/ ../../src/ ../../test/ --local=true --debug=true

// Useful ressources:
// - https://astexplorer.net/
// - https://npmdoc.github.io/node-npmdoc-jscodeshift/build/apidoc.html

/**
 * Find any imports related to fast-check
 * either module as a whole or named imports
 *
 * // Module ones
 * import fc from 'fast-check'      // --> 'fc'
 * import * as fc from 'fast-check' // --> 'fc'
 * const fc = require('fast-check') // --> 'fc'
 *
 * // Named imports ones
 * import {array} from 'fast-check'                // --> new Map([['array', 'array']])
 * import {array as fcArray} from 'fast-check'     // --> new Map([['fcArray', 'array']])
 * const {array} = require('fast-check')           // --> new Map([['array', 'array']])
 * const {array : fcArray} = require('fast-check') // --> new Map([['fcArray', 'array']])
 */
function extractFastCheckImports(j, root, includeLocalImports) {
  const moduleNames = [];
  const namedImportsMap = new Map();

  const isValidSource = (source) => {
    if (source.type !== 'Literal' && source.type !== 'StringLiteral') {
      return false;
    }
    if (includeLocalImports) {
      if (source.value[0] !== '.' && source.value !== 'fast-check') {
        return false;
      }
    } else {
      if (source.value !== 'fast-check') {
        return false;
      }
    }
    return true;
  };

  // import <name> from 'fast-check'
  // import * as <name> from 'fast-check'
  // import {array} from 'fast-check'
  // import {array as fcArray} from 'fast-check'
  root
    .find(j.ImportDeclaration)
    .forEach((p) => {
      if (!isValidSource(p.value.source)) {
        return;
      }
      for (const specifier of p.value.specifiers) {
        if (specifier.type === 'ImportDefaultSpecifier') {
          // import <name> from 'fast-check'
          moduleNames.push(specifier.local.name);
        } else if (specifier.type === 'ImportNamespaceSpecifier') {
          // import * as <name> from 'fast-check'
          moduleNames.push(specifier.local.name);
        } else if (specifier.type === 'ImportSpecifier') {
          // import {array} from 'fast-check'
          // import {array as fcArray} from 'fast-check'
          namedImportsMap.set(specifier.local.name, specifier.imported.name);
        }
      }
    })
    .find(j.Identifier);

  // <name> = require('fast-check')
  // {<name>} = require('fast-check')
  // {<name>: <dest>} = require('fast-check')
  root
    .find(j.VariableDeclarator, {
      init: {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'require',
        },
      },
    })
    .forEach((p) => {
      if (p.value.init.arguments.length !== 1 || !isValidSource(p.value.init.arguments[0])) {
        return;
      }
      if (p.value.id.type === 'Identifier') {
        // <name> = require('fast-check')
        moduleNames.push(p.value.id.name);
      } else if (p.value.id.type === 'ObjectPattern') {
        // {<name>} = require('fast-check')
        // {<name>: <dest>} = require('fast-check')
        for (const property of p.value.id.properties) {
          namedImportsMap.set(property.value.name, property.key.name);
        }
      }
    });

  return { moduleNames, namedImportsMap };
}

/**
 * Colored log in debug mode only
 */
function infoLog(label, log, file, options) {
  if (options.debug) {
    const fileName = file.path;
    console.log(`(${fileName}) \x1b[96m${label}\x1b[0m\n(${fileName}) \x1b[96m>\x1b[0m ${log}`);
  }
}

module.exports = function (file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const { moduleNames, namedImportsMap } = extractFastCheckImports(j, root, options.local);

  infoLog('Aliases for the module', moduleNames.join(', '), file, options);
  infoLog(
    'Other aliases',
    [...namedImportsMap.entries()]
      .map(([newName, officialName]) => (newName !== officialName ? `${newName} <- ${officialName}` : newName))
      .join(', '),
    file,
    options
  );

  function computeNewArguments(compulsaryArguments, properties) {
    const filteredProperties = properties.filter((p) => p !== false);
    if (filteredProperties.length === 0) {
      return compulsaryArguments;
    }
    return [...compulsaryArguments, j.objectExpression(filteredProperties)];
  }

  function isFunction(argument) {
    // () => 0        -- Default & TS parser: ArrowFunctionExpression
    // function() {}  -- Default & TS parser: FunctionExpression
    return argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression';
  }
  function isNumeric(argument) {
    // 0              -- Default parser: Literal / TS parser: NumericLiteral
    return (argument.type === 'Literal' || argument.type === 'NumericLiteral') && typeof argument.value === 'number';
  }
  function isBoolean(argument) {
    // true           -- Default parser: Literal / TS parser: BooleanLiteral
    return (argument.type === 'Literal' || argument.type === 'BooleanLiteral') && typeof argument.value === 'boolean';
  }

  function isNumericValue(argument, value) {
    if (value < 0) {
      return (
        argument.type === 'UnaryExpression' && argument.operator === '-' && isNumericValue(argument.argument, -value)
      );
    }
    return isNumeric(argument) && argument.value === value;
  }

  return root
    .find(j.CallExpression)
    .filter((p) => {
      if (p.value.callee.type === 'MemberExpression') {
        // Might be something like: fc.xxx()
        return moduleNames.some(
          (g) =>
            p.value.callee.object.type === 'Identifier' &&
            p.value.callee.object.name === g &&
            p.value.callee.property.type === 'Identifier'
        );
      } else if (p.value.callee.type === 'Identifier') {
        // Might be xxx() with xxx something from fast-check
        return namedImportsMap.has(p.value.callee.name);
      }
    })
    .forEach((p) => {
      const nameForFastCheck =
        p.value.callee.type === 'MemberExpression'
          ? p.value.callee.property.name
          : namedImportsMap.get(p.value.callee.name);

      switch (nameForFastCheck) {
        case 'hexaString':
        case 'base64String':
        case 'string':
        case 'asciiString':
        case 'unicodeString':
        case 'string16bits':
        case 'fullUnicodeString':
        case 'stringOf':
        case 'array': {
          const numCompulsaryArgs = ['array', 'stringOf'].includes(nameForFastCheck) ? 1 : 0;
          if (
            p.value.arguments.length === numCompulsaryArgs + 1 &&
            p.value.arguments[numCompulsaryArgs].type !== 'ObjectExpression'
          ) {
            // fc.string(maxLength) -> fc.string({maxLength})
            // fc.array(arb, maxLength) -> fc.array(arb, {maxLength})
            const simplifyMax = options.simplifyMax && isNumericValue(p.value.arguments[numCompulsaryArgs], 10);
            p.value.arguments = computeNewArguments(p.value.arguments.slice(0, numCompulsaryArgs), [
              !simplifyMax && j.property('init', j.identifier('maxLength'), p.value.arguments[numCompulsaryArgs]),
            ]);
          } else if (p.value.arguments.length === numCompulsaryArgs + 2) {
            // fc.string(minLength, maxLength) -> fc.string({minLength, maxLength})
            // fc.array(arb, minLength, maxLength) -> fc.array(arb, {minLength, maxLength})
            p.value.arguments = computeNewArguments(p.value.arguments.slice(0, numCompulsaryArgs), [
              j.property('init', j.identifier('minLength'), p.value.arguments[numCompulsaryArgs]),
              j.property('init', j.identifier('maxLength'), p.value.arguments[numCompulsaryArgs + 1]),
            ]);
          }
          break;
        }
        case 'set': {
          if (p.value.arguments.length === 2 && p.value.arguments[1].type !== 'ObjectExpression') {
            if (isNumeric(p.value.arguments[1])) {
              // fc.set(arb, maxLength) -> fc.set(arb, {maxLength})
              const simplifyMax = options.simplifyMax && isNumericValue(p.value.arguments[1], 10);
              p.value.arguments = computeNewArguments(
                [p.value.arguments[0]],
                [!simplifyMax && j.property('init', j.identifier('maxLength'), p.value.arguments[1])]
              );
            } else if (isFunction(p.value.arguments[1])) {
              // fc.set(arb, compare) -> fc.set(arb, {compare})
              p.value.arguments = computeNewArguments(
                [p.value.arguments[0]],
                [j.property('init', j.identifier('compare'), p.value.arguments[1])]
              );
            }
          } else if (p.value.arguments.length === 3) {
            if (isNumeric(p.value.arguments[2])) {
              // fc.set(arb, minLength, maxLength) -> fc.set(arb, {minLength, maxLength})
              p.value.arguments = computeNewArguments(
                [p.value.arguments[0]],
                [
                  j.property('init', j.identifier('minLength'), p.value.arguments[1]),
                  j.property('init', j.identifier('maxLength'), p.value.arguments[2]),
                ]
              );
            } else if (isFunction(p.value.arguments[2])) {
              // fc.set(arb, maxLength, compare) -> fc.set(arb, {maxLength, compare})
              const simplifyMax = options.simplifyMax && isNumericValue(p.value.arguments[1], 10);
              p.value.arguments = computeNewArguments(
                [p.value.arguments[0]],
                [
                  !simplifyMax && j.property('init', j.identifier('maxLength'), p.value.arguments[1]),
                  j.property('init', j.identifier('compare'), p.value.arguments[2]),
                ]
              );
            }
          } else if (p.value.arguments.length === 4) {
            // fc.set(arb, minLength, maxLength, compare) -> fc.set(arb, {minLength, maxLength, compare})
            p.value.arguments = computeNewArguments(
              [p.value.arguments[0]],
              [
                j.property('init', j.identifier('minLength'), p.value.arguments[1]),
                j.property('init', j.identifier('maxLength'), p.value.arguments[2]),
                j.property('init', j.identifier('compare'), p.value.arguments[3]),
              ]
            );
          }
          break;
        }
        case 'subarray':
        case 'shuffledSubarray': {
          if (p.value.arguments.length === 3) {
            // fc.subarray(originalArray, minLength, maxLength) -> fc.subarray(originalArray, {minLength, maxLength})
            p.value.arguments = computeNewArguments(
              [p.value.arguments[0]],
              [
                j.property('init', j.identifier('minLength'), p.value.arguments[1]),
                j.property('init', j.identifier('maxLength'), p.value.arguments[2]),
              ]
            );
          }
          break;
        }
        case 'json':
        case 'unicodeJson':
        case 'jsonObject':
        case 'unicodeJsonObject': {
          if (p.value.arguments.length === 1 && p.value.arguments[0].type !== 'ObjectExpression') {
            // fc.json(10) -> fc.json({maxDepth})
            const simplifyMax = options.simplifyMax && isNumericValue(p.value.arguments[0], 2);
            p.value.arguments = computeNewArguments(
              [],
              [!simplifyMax && j.property('init', j.identifier('maxDepth'), p.value.arguments[0])]
            );
          }
          break;
        }
        case 'option': {
          if (p.value.arguments.length === 2 && p.value.arguments[1].type !== 'ObjectExpression') {
            // fc.option(arb, 10) -> fc.option(arb, {freq})
            p.value.arguments = computeNewArguments(
              [p.value.arguments[0]],
              [j.property('init', j.identifier('freq'), p.value.arguments[1])]
            );
          }
          break;
        }
        case 'commands': {
          if (p.value.arguments.length === 2 && p.value.arguments[1].type !== 'ObjectExpression') {
            // fc.commands(commandArbs, maxCommands) -> fc.commands(commandArbs, {maxCommands})
            const simplifyMax = options.simplifyMax && isNumericValue(p.value.arguments[1], 10);
            p.value.arguments = computeNewArguments(
              [p.value.arguments[0]],
              [!simplifyMax && j.property('init', j.identifier('maxCommands'), p.value.arguments[1])]
            );
          }
          break;
        }
        case 'lorem': {
          if (p.value.arguments.length === 1 && p.value.arguments[0].type !== 'ObjectExpression') {
            // fc.lorem(maxWordsCount) -> fc.lorem({maxCount})
            const simplifyMax = options.simplifyMax && isNumericValue(p.value.arguments[0], 5);
            p.value.arguments = computeNewArguments(
              [],
              [!simplifyMax && j.property('init', j.identifier('maxCount'), p.value.arguments[0])]
            );
          } else if (p.value.arguments.length === 2) {
            // fc.lorem(maxWordsCount, sentencesMode) -> fc.lorem({maxCount, mode})
            const simplifyMax = options.simplifyMax && isNumericValue(p.value.arguments[0], 5);
            const mode = isBoolean(p.value.arguments[1])
              ? p.value.arguments[1].value === true
                ? j.literal('sentences')
                : j.literal('words')
              : j.conditionalExpression(p.value.arguments[1], j.literal('sentences'), j.literal('words'));
            p.value.arguments = computeNewArguments(
              [],
              [
                !simplifyMax && j.property('init', j.identifier('maxCount'), p.value.arguments[0]),
                j.property('init', j.identifier('mode'), mode),
              ]
            );
          }
          break;
        }
        case 'bigInt': {
          if (p.value.arguments.length === 2) {
            // fc.bigInt(min, max) -> fc.bigInt({min, max})
            p.value.arguments = computeNewArguments(
              [],
              [
                j.property('init', j.identifier('min'), p.value.arguments[0]),
                j.property('init', j.identifier('max'), p.value.arguments[1]),
              ]
            );
          }
          break;
        }
        case 'bigUint': {
          if (p.value.arguments.length === 1 && p.value.arguments[0].type !== 'ObjectExpression') {
            // fc.bigUint(max) -> fc.bigUint({max})
            p.value.arguments = computeNewArguments(
              [],
              [j.property('init', j.identifier('max'), p.value.arguments[0])]
            );
          }
          break;
        }
        case 'double':
        case 'float': {
          if (p.value.arguments.length === 1 && p.value.arguments[0].type !== 'ObjectExpression') {
            // fc.float(max) -> fc.float({max})
            const simplifyMax = options.simplifyMax && isNumericValue(p.value.arguments[0], 1.0);
            p.value.arguments = computeNewArguments(
              [],
              [!simplifyMax && j.property('init', j.identifier('max'), p.value.arguments[0])]
            );
          } else if (p.value.arguments.length === 2) {
            // fc.float(min, max) -> fc.float({min, max})
            p.value.arguments = computeNewArguments(
              [],
              [
                j.property('init', j.identifier('min'), p.value.arguments[0]),
                j.property('init', j.identifier('max'), p.value.arguments[1]),
              ]
            );
          }
          break;
        }
        case 'nat': {
          if (p.value.arguments.length === 1 && p.value.arguments[0].type !== 'ObjectExpression') {
            // fc.nat(max) -> fc.nat({max})
            const simplifyMax = options.simplifyMax && isNumericValue(p.value.arguments[0], 0x7fffffff);
            p.value.arguments = computeNewArguments(
              [],
              [!simplifyMax && j.property('init', j.identifier('max'), p.value.arguments[0])]
            );
          }
          break;
        }
        case 'integer': {
          if (p.value.arguments.length === 1 && p.value.arguments[0].type !== 'ObjectExpression') {
            // fc.integer(max) -> fc.integer({max})
            const simplifyMax = options.simplifyMax && isNumericValue(p.value.arguments[0], 0x7fffffff);
            p.value.arguments = computeNewArguments(
              [],
              [!simplifyMax && j.property('init', j.identifier('max'), p.value.arguments[0])]
            );
          } else if (p.value.arguments.length === 2) {
            // fc.integer(min, max) -> fc.integer({min, max})
            p.value.arguments = computeNewArguments(
              [],
              [
                j.property('init', j.identifier('min'), p.value.arguments[0]),
                j.property('init', j.identifier('max'), p.value.arguments[1]),
              ]
            );
          }
          break;
        }
      }
      return p;
    })
    .toSource();
};
