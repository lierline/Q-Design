// Deliberately narrow: proven component presentation props, never arbitrary numbers.
export const componentProps = {
  '@/lib/design/components#DataTable': { minWidth: 'tableMinWidth' },
  '@/lib/design/components#ScrollTable': { minWidth: 'tableMinWidth' },
  '@/lib/design/components#Grid': { minCol: 'gridMinColumn', gap: 'gridGap' },
  '@/lib/design/components#Modal': { maxWidth: 'modalWidth' },
  '@/lib/design/components#SkeletonPanel': { height: 'skeletonHeight' },
  '@/lib/design/components#Skeleton': { w: 'skeletonWidth', h: 'skeletonHeight' },
  '@/lib/design/components#InfoDot': { width: 'infoWidth' },
  '@/lib/design/components#IconBtn': { size: 'iconButtonSize' },
  '@/lib/design/components#ProgressRing': { size: 'progressSize', stroke: 'progressStroke' },
  '@/lib/design/segmented-choice#SegmentedChoice': { minCol: 'choiceMinColumn', minHeight: 'choiceMinHeight', fontWeight: 'choiceFontWeight' },
  '@/components/Skeleton#Skeleton': { width: 'skeletonWidth', height: 'skeletonHeight' },
  '@/components/MemberPicker#MemberPicker': { maxHeight: 'memberListHeight' },
  '@/components/TimeSeriesChart#TimeSeriesChart': { height: 'chartHeight' },
  '@/components/Coachmark#Coachmark': { delayMs: 'coachmarkDelay' },
  '@/components/Logo#Logo': { size: 'logoSize' },
  '@/components/Logo#LogoMark': { size: 'logoSize' },
  '@/components/expert/BrandLogo#BrandLogo': { size: 'logoSize' },
  '@/components/Avatar#Avatar': { size: 'avatarSize' },
};

// These local bindings were followed to the imported official icon or an IconType
// slot of official icons. No general name-based Icon exemption is used.
export const localIcons = {
  'app/(app)/m/page.tsx': ['Icon'],
  'app/(app)/research/[code]/page.tsx': ['nextAction.Icon'],
  'components/AuthThemeToggle.tsx': ['Icon'],
  'components/DocumentArtifactPanel.tsx': ['Icon'],
  'components/GlobalSearch.tsx': ['Icon'],
  'components/HubModuleGrid.tsx': ['Icon'],
  'components/MobileBottomNav.tsx': ['Icon'],
  'components/MyActionsViews.tsx': ['Icon'],
  'components/ProjectComplianceScore.tsx': ['Icon'],
  'components/QmsStatusWidget.tsx': ['Icon'],
  'components/RdDocumentFlowPanel.tsx': ['Icon'],
  'components/RegulatoryPipelineWidget.tsx': ['Icon'],
  'components/Sidebar.tsx': ['Icon', 'MenuIcon', 'ChevronIcon'],
  'components/StageProgressionAction.tsx': ['Icon'],
  'components/Toast.tsx': ['Icon'],
  'lib/design/components.tsx': ['Icon'],
};

export function presentationProps(ts, path, source) {
  const sf = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const imports = {}, result = [];
  for (const node of sf.statements) if (ts.isImportDeclaration(node)) {
    let module = node.moduleSpecifier.text;
    if (path.startsWith('components/') && module === './Logo') module = '@/components/Logo';
    if (path.startsWith('components/') && module === './Avatar') module = '@/components/Avatar';
    const clause = node.importClause;
    if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) for (const entry of clause.namedBindings.elements) imports[entry.name.text] = `${module}#${entry.propertyName?.text ?? entry.name.text}`;
  }
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression && ts.isNumericLiteral(node.initializer.expression)) {
      const expression = node.initializer.expression, prop = node.name.text;
      const tag = node.parent.parent.tagName.getText(sf), imported = imports[tag];
      let family = componentProps[imported]?.[prop];
      if (prop === 'size' && (imported?.startsWith('@/components/q-design-icons/') || localIcons[path]?.includes(tag))) family = 'iconSize';
      if (path === 'components/Skeleton.tsx' && tag === 'Skeleton') family = { width: 'skeletonWidth', height: 'skeletonHeight' }[prop];
      if (path === 'lib/design/components.tsx' && tag === 'Skeleton') family = { w: 'skeletonWidth', h: 'skeletonHeight' }[prop];
      if (path === 'components/InstallAppPrompt.tsx' && tag === 'img' && ['width', 'height'].includes(prop)) family = 'installLogoSize';
      if (family) result.push({ path, line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1, tag, prop, family, imported: imported ?? 'locally-traced', value: Number(expression.text), start: expression.getStart(sf), end: expression.end });
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return { sf, records: result };
}

export function migratePresentation(ts, path, source) {
  const { sf, records } = presentationProps(ts, path, source);
  const replacements = records.map(r => ({ ...r, expression: r.family === 'gridGap' ? `QDScale.space[${r.value / 4}]` : `QDPresentation.${r.family}[${r.value}]` }));
  let output = source;
  for (const r of replacements.toSorted((a, b) => b.start - a.start)) output = output.slice(0, r.start) + r.expression + output.slice(r.end);
  const needed = [];
  if (replacements.some(r => r.family !== 'gridGap') && !/import\s*\{[^}]*\bQDPresentation\b[^}]*\}\s*from\s*['"]@\/lib\/design\/q-design-runtime['"]/.test(source)) needed.push("import { QDPresentation } from '@/lib/design/q-design-runtime';");
  if (replacements.some(r => r.family === 'gridGap') && !/import\s*\{[^}]*\bQDScale\b[^}]*\}/.test(source)) needed.push("import { QDScale } from '@/lib/design/q-design-scale';");
  if (needed.length) {
    const firstImport = sf.statements.find(ts.isImportDeclaration);
    const directives = sf.statements.filter(n => ts.isExpressionStatement(n) && ts.isStringLiteral(n.expression));
    const at = firstImport?.getStart(sf) ?? directives.at(-1)?.end ?? 0;
    output = output.slice(0, at) + (firstImport ? '' : '\n') + needed.join('\n') + '\n' + output.slice(at);
  }
  return { output, records: replacements };
}
