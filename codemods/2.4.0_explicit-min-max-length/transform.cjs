// Before version 2.4.0, defining constraints on the size of an array required
// to use one of the following signatures:
// - fc.array(arb, maxLength)
// - fc.array(arb, minLength, maxLength)
//
// Version 2.4.0 depreciated those signatures for another one:
// - fc.array(arb, {minLength, maxLength})
//
// The reasons behind this change are:
//   1. when seeing a call like 'fc.array(arb, 10)' it was difficult to understand
//      the meaning of the second argument: is is for the max? for the min?
//   2. no signature to only specify a min length, specifying a min required the
//      user to also specify a max
//   3. difficult to use this kind of signature with fc.set, fc.uint32array... or even
//      worst fc.object
//
// This codemod converts implicit minLength and maxLength to the object expression syntax
// introduced by version 2.4.0 whenever possible.
//
// WARNING: It only works if you imported or required fast-check as a whole and not function by function
//          [NO]  import {array} from 'fast-check'
//          [YES] import fc from 'fast-check'
//          [YES] const fc = require('fast-check')
//
// You can execute this codemods as follow:
//    npx jscodeshift --dry --print -t transform.cjs snippet-x.js

function extractFastCheckLocalName(j, root) {
  const importDeclaration = root.find(j.ImportDeclaration, {
    source: {
      type: 'Literal',
      value: 'fast-check',
    },
  });
  if (importDeclaration.length === 1) {
    // get the local name for the imported module
    return importDeclaration.find(j.Identifier).get(0).node.name;
  }

  const requireDeclaration = root.find(j.VariableDeclarator, {
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
  });
  if (requireDeclaration.length === 1) {
    // get the local name for the imported module
    return requireDeclaration.get(0).node.id.name;
  }
}

module.exports = function (file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const localName = extractFastCheckLocalName(j, root);
  if (!localName) {
    // fast-check not imported by this file
    return;
  }

  return root
    .find(j.CallExpression)
    .filter(
      // Only keep fc.xxx()
      (p) =>
        p.value.callee.type === 'MemberExpression' &&
        p.value.callee.object.type === 'Identifier' &&
        p.value.callee.object.name === localName &&
        p.value.callee.property.type === 'Identifier'
    )
    .forEach((p) => {
      switch (p.value.callee.property.name) {
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
