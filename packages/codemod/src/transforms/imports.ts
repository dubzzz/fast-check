import type { ASTPath, Collection, ImportDeclaration, ImportSpecifier, JSCodeshift } from 'jscodeshift';
import { withComments } from './ast.js';
import { findBinding } from './bindings.js';

type ImportBinding = {
  source: string;
  namedExport: string | undefined;
  typeOnly: boolean;
};

function isTypeOnlyImport(path: ASTPath): boolean {
  return path.parent.node.importKind === 'type' || ('importKind' in path.node && path.node.importKind === 'type');
}

export function namedImports(
  j: JSCodeshift,
  imports: Collection<ImportDeclaration>,
  source: string,
  imported: string,
): Collection<ImportSpecifier> {
  return imports
    .filter(({ node }) => node.source.value === source)
    .find(j.ImportSpecifier, { imported: { name: imported } });
}

export function resolveImport(j: JSCodeshift, path: ASTPath, local: unknown): ImportBinding | undefined {
  if (!j.Identifier.check(local)) return;
  const specifier = findBinding(j, path, local.name)?.parent;
  const declaration = specifier?.parent.node;
  if (!j.ImportDeclaration.check(declaration) || typeof declaration.source.value !== 'string') return;
  const named = j.ImportSpecifier.check(specifier.node);
  if (named && !j.Identifier.check(specifier.node.imported)) return;
  return {
    source: declaration.source.value,
    namedExport: named ? specifier.node.imported.name : undefined,
    typeOnly: isTypeOnlyImport(specifier),
  };
}

// An alias can be reused only if every edited call still sees that exact import.
export function visibleNamedImport(
  j: JSCodeshift,
  imports: Collection<ImportDeclaration>,
  source: string,
  imported: string,
  uses: readonly ASTPath[],
): string | undefined {
  for (const path of namedImports(j, imports, source, imported).paths()) {
    const local = path.node.local;
    if (!j.Identifier.check(local) || isTypeOnlyImport(path)) continue;
    if (uses.every((use) => findBinding(j, use, local.name)?.parent.node === path.node)) return local.name;
  }
}

export function renameImport(
  j: JSCodeshift,
  specifier: ImportSpecifier,
  imported: string,
  local: ImportSpecifier['local'],
): ImportSpecifier {
  const replacement = withComments(j.importSpecifier(j.identifier(imported), local), specifier);
  if ('importKind' in specifier) Object.assign(replacement, { importKind: specifier.importKind });
  return replacement;
}
