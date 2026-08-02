import * as ts from 'typescript';

export type SupportedLocale = 'mm' | 'en';

export interface OneSidedLocaleTernary {
  fileName: string;
  line: number;
  column: number;
  emptyLocale: SupportedLocale;
  source: string;
}

const oppositeLocale = (locale: SupportedLocale): SupportedLocale => locale === 'mm' ? 'en' : 'mm';

function unwrap(expression: ts.Expression): ts.Expression {
  let current = expression;

  while (
    ts.isParenthesizedExpression(current)
    || ts.isAsExpression(current)
    || ts.isTypeAssertionExpression(current)
    || ts.isNonNullExpression(current)
    || ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }

  return current;
}

function isLocaleReference(expression: ts.Expression): boolean {
  const candidate = unwrap(expression);
  return (ts.isIdentifier(candidate) && candidate.text === 'locale')
    || (ts.isPropertyAccessExpression(candidate) && candidate.name.text === 'locale');
}

function localeLiteral(expression: ts.Expression): SupportedLocale | null {
  const candidate = unwrap(expression);
  if (!ts.isStringLiteralLike(candidate)) return null;
  return candidate.text === 'mm' || candidate.text === 'en' ? candidate.text : null;
}

function trueBranchLocale(condition: ts.Expression): SupportedLocale | null {
  const candidate = unwrap(condition);
  if (!ts.isBinaryExpression(candidate)) return null;

  const leftLocale = localeLiteral(candidate.left);
  const rightLocale = localeLiteral(candidate.right);
  const comparedLocale = isLocaleReference(candidate.left) ? rightLocale
    : isLocaleReference(candidate.right) ? leftLocale
      : null;
  if (!comparedLocale) return null;

  const operator = candidate.operatorToken.kind;
  if (operator === ts.SyntaxKind.EqualsEqualsEqualsToken || operator === ts.SyntaxKind.EqualsEqualsToken) {
    return comparedLocale;
  }
  if (operator === ts.SyntaxKind.ExclamationEqualsEqualsToken || operator === ts.SyntaxKind.ExclamationEqualsToken) {
    return oppositeLocale(comparedLocale);
  }
  return null;
}

function isEmptyBranch(expression: ts.Expression): boolean {
  const candidate = unwrap(expression);
  if (
    candidate.kind === ts.SyntaxKind.NullKeyword
    || candidate.kind === ts.SyntaxKind.FalseKeyword
    || ts.isVoidExpression(candidate)
  ) return true;

  if (ts.isIdentifier(candidate) && candidate.text === 'undefined') return true;
  if (ts.isStringLiteralLike(candidate)) return candidate.text.trim().length === 0;
  return false;
}

export function findOneSidedLocaleTernaries(
  sourceText: string,
  fileName = 'source.tsx',
): OneSidedLocaleTernary[] {
  const scriptKind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
  const violations: OneSidedLocaleTernary[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isConditionalExpression(node)) {
      const whenTrueLocale = trueBranchLocale(node.condition);
      if (whenTrueLocale) {
        const trueIsEmpty = isEmptyBranch(node.whenTrue);
        const falseIsEmpty = isEmptyBranch(node.whenFalse);
        if (trueIsEmpty !== falseIsEmpty) {
          const emptyNode = trueIsEmpty ? node.whenTrue : node.whenFalse;
          const position = sourceFile.getLineAndCharacterOfPosition(emptyNode.getStart(sourceFile));
          violations.push({
            fileName,
            line: position.line + 1,
            column: position.character + 1,
            emptyLocale: trueIsEmpty ? whenTrueLocale : oppositeLocale(whenTrueLocale),
            source: node.getText(sourceFile),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return violations;
}
