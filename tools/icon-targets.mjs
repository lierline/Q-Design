const ALIASES = {
  'Q-Atelier': 'atelier', 'Q-Works': 'maison', 'Q-Maison': 'maison',
  'Q-Forge': 'carnet', 'Q-Carnet': 'carnet', 'Q-Sonar': 'sonar',
};

/** Limit product writes only. The family render/hash and all read-only checks
 * still include every product, so --only cannot redefine the icon set hash. */
export function parseIconTargets(args) {
  const options = args.filter(arg => arg.startsWith('--only='));
  if (!options.length) return null;
  if (options.length !== 1) throw new Error('Specify --only once');
  const names = options[0].slice('--only='.length).split(',').map(name => name.trim());
  if (names.some(name => !Object.hasOwn(ALIASES, name))) throw new Error(`Unknown icon target in ${options[0]}`);
  return new Set(names.map(name => ALIASES[name]));
}

export function canWriteIconTarget(write, only, key) {
  return Boolean(write && (only === null || only.has(key)));
}
