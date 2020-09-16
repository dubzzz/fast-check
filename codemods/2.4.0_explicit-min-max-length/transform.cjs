// You can try this codemod as follow:
//    npx jscodeshift --dry --print -t transform.cjs snippet-* --debug=true

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
function extractFastCheckImports(j, root) {
  const moduleNames = [];
  const namedImportsMap = new Map();

  // import <name> from 'fast-check'
  // import * as <name> from 'fast-check'
  // import {array} from 'fast-check'
  // import {array as fcArray} from 'fast-check'
  root
    .find(j.ImportDeclaration, {
      source: {
        type: 'Literal',
        value: 'fast-check',
      },
    })
    .forEach((p) => {
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
        arguments: [
          {
            type: 'Literal',
            value: 'fast-check',
          },
        ],
      },
    })
    .forEach((p) => {
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

  const { moduleNames, namedImportsMap } = extractFastCheckImports(j, root);

  infoLog('Aliases for the module', moduleNames.join(', '), file, options);
  infoLog(
    'Other aliases',
    [...namedImportsMap.entries()]
      .map(([newName, officialName]) => (newName !== officialName ? `${newName} <- ${officialName}` : newName))
      .join(', '),
    file,
    options
  );

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
        case 'array':
          if (p.value.arguments.length === 2 && p.value.arguments[1].type !== 'ObjectExpression') {
            // fc.array(arb, maxLength) -> fc.array(arb, {maxLength})
            p.value.arguments = [
              p.value.arguments[0],
              j.objectExpression([j.property('init', j.identifier('maxLength'), p.value.arguments[1])]),
            ];
          } else if (p.value.arguments.length === 3) {
            // fc.array(arb, minLength, maxLength) -> fc.array(arb, {minLength, maxLength})
            p.value.arguments = [
              p.value.arguments[0],
              j.objectExpression([
                j.property('init', j.identifier('minLength'), p.value.arguments[1]),
                j.property('init', j.identifier('maxLength'), p.value.arguments[2]),
              ]),
            ];
          }
      }
      return p;
    })
    .toSource();
};
