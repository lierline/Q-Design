import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Field } from '../../components/expert/Field';

describe('expert field label association', () => {
  it('connects an input and validation message fragment to the actual input', () => {
    const html = renderToStaticMarkup(
      <Field label="비밀번호 확인"><><input type="password" /><span>확인 안내</span></></Field>,
    );
    const labelId = html.match(/<label[^>]*for="([^"]+)"/)?.[1];
    const inputId = html.match(/<input[^>]*id="([^"]+)"/)?.[1];
    expect(labelId).toBeTruthy();
    expect(inputId).toBe(labelId);
    expect(html).toContain('확인 안내');
  });
  it('preserves explicit ids through nested fragments without labeling a message', () => {
    const html = renderToStaticMarkup(
      <Field label="확인"><><span>설명</span><><input id="confirm-entry" /><input id="second-entry" /></></></Field>,
    );
    expect(html).toContain('for="confirm-entry"');
    expect(html).toContain('id="confirm-entry"');
    expect(html).toContain('id="second-entry"');
    expect(html).toContain('<span>설명</span>');
  });
  it('keeps the existing direct-control association', () => {
    const html = renderToStaticMarkup(<Field label="이름"><input id="person-name" /></Field>);
    expect(html).toContain('for="person-name"');
    expect(html).toContain('id="person-name"');
  });
});
