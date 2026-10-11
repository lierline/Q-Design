/** Read literals or the explicit generated Carnet palette import. Never execute
 * application source merely to validate installed-app identity metadata. */
export function resolveIconTitleColor(expression, source, runtimeSource) {
  const literal = /^['"](#[\da-f]{6})['"]$/i.exec(expression.trim());
  if (literal) return literal[1].toLowerCase();
  if (expression.trim() !== 'CARNET_PALETTE.themeColor') return null;
  if (!/import\s*\{\s*CARNET_PALETTE\s*\}\s*from\s*['"]@\/lib\/design\/q-design-palette['"]/.test(source)) return null;
  const data = /export const CARNET_PALETTE\s*=\s*(\{[\s\S]*?\})\s*as const/.exec(runtimeSource ?? '');
  if (!data) return null;
  try { const value = JSON.parse(data[1]).themeColor; return /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : null; }
  catch { return null; }
}
