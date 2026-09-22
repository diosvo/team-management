import { generateJSON, getSchema } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { editorToPlainText } from './plain-text';

// Use the real Tiptap schema/parser so the walker sees actual node shapes.
const extensions = [StarterKit];
const schema = getSchema(extensions);

const fromHTML = (html: string) =>
  editorToPlainText(schema.nodeFromJSON(generateJSON(html, extensions)));

describe('editorToPlainText', () => {
  test('separates blocks with single line breaks', () => {
    expect(fromHTML('<h1>Rules</h1><p>One</p><p>Two</p>')).toBe(
      'Rules\nOne\nTwo',
    );
  });

  test('keeps inline marks as plain text', () => {
    expect(fromHTML('<p>Be <strong>on</strong> <em>time</em>.</p>')).toBe(
      'Be on time.',
    );
  });

  test('bullets each list item', () => {
    expect(fromHTML('<ul><li><p>A</p></li><li><p>B</p></li></ul>')).toBe(
      '• A\n• B',
    );
  });

  test('numbers ordered lists from their start attribute', () => {
    expect(
      fromHTML('<ol start="3"><li><p>C</p></li><li><p>D</p></li></ol>'),
    ).toBe('3. C\n4. D');
  });

  test('indents nested lists under their parent item', () => {
    expect(
      fromHTML(
        '<ul><li><p>A</p><ul><li><p>A1</p></li><li><p>A2</p></li></ul></li><li><p>B</p></li></ul>',
      ),
    ).toBe('• A\n  • A1\n  • A2\n• B');
  });

  test('hangs wrapped lines under the bullet', () => {
    expect(fromHTML('<ul><li><p>a<br>b</p></li></ul>')).toBe('• a\n  b');
  });

  test('spells out link targets after their label', () => {
    expect(
      fromHTML('<p>See <a href="https://example.com/rules">the rules</a>.</p>'),
    ).toBe('See the rules (https://example.com/rules).');
  });

  test('does not repeat a link whose label is already the URL', () => {
    expect(
      fromHTML('<p><a href="https://example.com">https://example.com</a></p>'),
    ).toBe('https://example.com');
  });

  test('writes a partly formatted link once', () => {
    expect(
      fromHTML(
        '<p><a href="https://example.com">bold <strong>and</strong> plain</a></p>',
      ),
    ).toBe('bold and plain (https://example.com)');
  });

  test('prefixes quotes and renders rules and code', () => {
    expect(
      fromHTML(
        '<blockquote><p>Q1</p><p>Q2</p></blockquote><hr><pre><code>x\ny</code></pre>',
      ),
    ).toBe('> Q1\n> Q2\n---\nx\ny');
  });

  test('collapses runs of empty paragraphs', () => {
    expect(fromHTML('<p>One</p><p></p><p></p><p>Two</p>')).toBe('One\n\nTwo');
  });
});
