import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { designRecipe, readDesignRecipe, resolveStyleValues } from '@/lib/test-utils/design-source';
import { QDScale } from './q-design-scale';
import { S, FS, LH } from './tokens';
import { RibbonBackground } from '@/components/RibbonBackground';
import NotFound from '@/app/not-found';
import { Tag, ProgressBar, SectionProgressCard } from './components';
import { TAG_DIMS, tagHeight } from './tag-metrics';
import { readSource } from '@/lib/test-utils/contract-source';

const foundation = readSource('app/q-design.foundation.css', 'raw'); // Source-section comments are the exact ownership boundary under test.

describe('Q-Design foundation ownership', () => {
  it('progress defaults follow central height and radius, with explicit height preserved', () => {
    const regular = renderToStaticMarkup(<ProgressBar value={50} />);
    expect(regular).toContain('height:var(--qd-progress-height, 6px)');
    expect(regular).toContain('border-radius:var(--qd-radius, 10px)');
    expect(renderToStaticMarkup(<ProgressBar value={50} height={12} />)).toContain('height:12px');
    expect(renderToStaticMarkup(<SectionProgressCard value={50} label="검토" />)).toContain('height:var(--qd-progress-height, 6px)');
  });

  it('Tag renders central size variables while numeric height calculations remain usable', () => {
    for (const size of ['xs', 'sm', 'md'] as const) {
      const html = renderToStaticMarkup(<Tag size={size} dot>상태</Tag>);
      for (const property of ['gap', 'min-height', 'size', 'padding-y', 'padding-x', 'dot-size']) {
        expect(html).toContain(`var(--qd-tag-${size}-${property},`);
        expect(foundation).toContain(`--qd-tag-${size}-${property}:`);
      }
      expect(typeof TAG_DIMS[size].fs).toBe('number');
      expect(Number.isFinite(tagHeight(size))).toBe(true);
    }
  });

  it('source guards follow generated values and fail on missing or cyclic definitions', () => {
    const source = "style={{ margin: 'var(--qd-atelier-margin-a)', width: 'var(--qd-atelier-width-a)', color: 'var(--qd-atelier-color-a)' }}";
    const css = ':root { --qd-atelier-margin-a: 0 auto; --qd-atelier-width-a: var(--qd-width); --qd-width: 44px; --qd-atelier-color-a: #fff; }';
    expect(resolveStyleValues(source, css)).toBe("style={{ margin: '0 auto', width: 44, color: '#fff' }}");
    expect(resolveStyleValues(source, css.replace('0 auto', '0'))).toContain('margin: 0');
    expect(resolveStyleValues(source, css.replace('44px', '80px'))).toContain('width: 80');
    expect(() => resolveStyleValues(source, css.replace('--qd-width:', '--missing:'))).toThrow('Missing design variable');
    expect(() => resolveStyleValues(source, css.replace('44px', 'var(--qd-atelier-width-a)'))).toThrow('Cyclic design variable');
  });

  it('every UI scale reference names a defined runtime variable while numeric tokens stay numeric', () => {
    for (const [name, scale, values] of [
      ['space', QDScale.space, S], ['font-size', QDScale.font, FS], ['leading', QDScale.leading, LH],
    ] as const) {
      for (const [key, value] of Object.entries(scale)) {
        const variable = `--qd-${name}-${key.replaceAll('.', '-')}`;
        expect(value).toContain(`var(${variable},`);
        expect(foundation).toMatch(new RegExp(`${variable}\\s*:`));
      }
      expect(Object.values(values).every(value => typeof value === 'number')).toBe(true);
    }
  });

  it('does not accept a missing, duplicated or reversed original-source section', () => {
    const original = 'app/globals.css';
    const body = readDesignRecipe(original);
    expect(body).toContain('.qa-main-content');
    expect(() => designRecipe(foundation.replace(`qd-source-start: ${original}`, 'not-a-source'), original)).toThrow();
    expect(() => designRecipe(foundation + `/* qd-source-start: ${original} */`, original)).toThrow();
    expect(() => designRecipe(`/* qd-source-end: ${original} *//* qd-source-start: ${original} */`, original)).toThrow();
  });

  it('actual ribbon rendering exposes intensity and delegates visuals to the imported recipe', () => {
    const html = renderToStaticMarkup(<RibbonBackground intensity="ambient" vignette />);
    expect(html).toContain('data-intensity="ambient"');
    expect(html).toContain('class="qa-ribbon-vignette"');
    expect(html).not.toContain('<style');
    expect(html).not.toMatch(/style="[^"]*opacity/);
    const recipe = readDesignRecipe('components/RibbonBackground.tsx');
    expect(recipe).toContain('var(--qd-ribbon-ambient-opacity-1');
    expect(recipe).toContain('prefers-reduced-motion: reduce');
  });

  it('actual not-found screen uses the same status styling as the root error boundary', () => {
    const html = renderToStaticMarkup(<NotFound />);
    expect(html).toContain('class="qa-status-page"');
    expect(html).toContain('class="qa-status-action"');
    expect(html).not.toContain('style=');
    const error = readSource('app/global-error.tsx', 'code');
    expect(error).toContain("import './globals.css'");
    expect(error).toContain('className="qa-status-page"');
    expect(error).not.toMatch(/#[0-9a-f]{6}/i);
  });
});
