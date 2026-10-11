// Live-worktree gate; the committed-source extraction/release gate is separate.
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
if(args.some(arg=>arg!=='--browser'))throw new Error('Use --browser to include real component browser checks.');
const steps=[
  ['--test','tools/copy-spacing.test.mjs'],
  ['tools/copy-spacing.mjs','--check'],
  ['--test','tools/extract-ramp.test.mjs'],
  ['--test','tools/native-offline.test.mjs'],
  ['--test','tools/all-screen-connections.test.mjs'],
  ['tools/all-screen-connections.mjs','--check'],
  ['--test','tools/page-evidence-verdict.test.mjs'],
  ['--test','tools/tag-metrics-probe.test.mjs'],
  ['--test','tools/page-evidence-boundaries.test.mjs'],
  ['tools/build-palette.mjs','--check'],
  ['tools/build-maison-email.mjs','--check'],
  ['tools/build-atelier-html.mjs','--check'],
  ['tools/build-foundation.mjs','--check'],
  ['tools/build-native-offline.mjs','--check'],
  ['tools/build-atelier-simulator.mjs','--check'],
  ['tools/check-style-bindings.mjs'],
  ['tools/component-registry.mjs','--check'],
  ['tools/style-arguments.mjs','--check'],
  ['tools/build-react-icons.mjs','--check'],
  ['--test','tools/component-registry.test.mjs','tools/component-style-contract.test.mjs','tools/palette.test.mjs','tools/maison-palette.test.mjs','tools/maison-email.test.mjs','tools/maison-choice-targets.test.mjs','tools/audit-coverage.test.mjs','tools/audit-coverage-imports.test.mjs','tools/qd-adapter-values.test.mjs','tools/asset-pipeline.test.mjs','tools/foundation.test.mjs','tools/style-arguments.test.mjs','tools/carnet-foundation.test.mjs','tools/sync-html-consumers.test.mjs','tools/icon-defaults.test.mjs'],
  ['--test','tools/app-icon-runtime.test.mjs','tools/carnet-stroke-contract.test.mjs','tools/carnet-style-boundaries.test.mjs','tools/maison-layout-tokens.test.mjs','tools/maison-style-proof.test.mjs','tools/migrate-atelier-grid-values.test.mjs','tools/migrate-atelier-conditional-values.test.mjs'],
  ['--test','tools/atelier-style-proof.test.mjs','tools/build-atelier-simulator.test.mjs','tools/maison-runtime-styles.test.mjs'],
  ['--test','tools/migrate-atelier-style-fragments.test.mjs'],
  ['--test','tools/atelier-html.test.mjs'],
  ['--test','tools/atelier-backgrounds.test.mjs'],
  ['--test','tools/atelier-presentation.test.mjs'],
  ['--test','tools/migrate-atelier-typography.test.mjs'],
  ['--test','tools/maison-style-manual.test.mjs'],
  ['--test','tools/maison-style-output.test.mjs'],
  ['--test','tools/atelier-spread-review.test.mjs'],
  ['--test','tools/atelier-style-prop-flow.test.mjs'],
  ['--test','tools/atelier-renderer-slot-review.test.mjs','tools/atelier-renderer-enum-review.test.mjs'],
  ['--test','tools/atelier-trace-layout.test.mjs'],
  ['--test','tools/atelier-fold-grid-review.test.mjs'],
  ['--test','tools/atelier-widget-width-review.test.mjs'],
  ['--test','tools/atelier-final-presentation.test.mjs'],
  ['--test','tools/atelier-native-controls.test.mjs'],
  ['tools/atelier-native-controls.mjs','--check'],
  ['--test','tools/atelier-style-manual.test.mjs'],
  ['--test','tools/atelier-watermark.test.mjs'],
  ['--test','tools/atelier-watermark-content-review.test.mjs','tools/atelier-manual-styles.test.mjs'],
  ['--test','tools/atelier-final-output-layout.test.mjs'],
  ['--test','tools/atelier-permission-scroll.test.mjs','tools/atelier-html-content-review.test.mjs'],
  ['--test','tools/atelier-bindings.test.mjs'],
  ['--test','tools/maison-permission-scroll.test.mjs','tools/atelier-dimension-flow-review.test.mjs'],
  ['--test','tools/atelier-api-output-consumer.test.mjs'],
  ['--test','tools/atelier-semantic-palette-review.test.mjs'],
  ['--test','tools/atelier-renderer-inputs.test.mjs'],
  ['--test','tools/atelier-choice-contract.test.mjs'],
  ['--test','tools/atelier-data-ratio-review.test.mjs','tools/atelier-measured-coordinate-review.test.mjs','tools/atelier-rule-table-scroll.test.mjs','tools/atelier-expert-input.test.mjs','tools/atelier-final-visual-rules.test.mjs'],
  ['--test','tools/carnet-style-report.test.mjs','tools/atelier-finite-defaults.test.mjs','tools/atelier-output.test.mjs','tools/atelier-opaque-surfaces.test.mjs'],
  ['tools/maison-style-review.mjs','--check'],
  ['tools/carnet-style-review.mjs','--check'],
];
if(args.includes('--browser'))steps.push(['tools/build-component-workbench.mjs'],['tools/verify-component-workbench.mjs'],['tools/verify-component-parity.mjs'],['tools/verify-extended-parity.mjs'],['tools/verify-design-propagation.mjs'],['tools/verify-foundation-workbench.mjs'],['tools/verify-atelier-choice-contract.mjs'],['tools/verify-native-offline.mjs']);
for(const step of steps){
  console.log(`\nChecking ${step.join(' ')}`);
  const result=spawnSync(process.execPath,step,{cwd:root,stdio:'inherit',windowsHide:true});
  if(result.status!==0)process.exit(result.status??1);
}
console.log('Live component contracts passed.');
