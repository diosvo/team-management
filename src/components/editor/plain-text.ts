import type { Editor } from '@tiptap/react';

type EditorNode = Editor['state']['doc'];

/** Plain text that keeps list markers, nesting, quotes and link targets. */
export function editorToPlainText(doc: EditorNode): string {
  return blocksToText(doc, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function blocksToText(parent: EditorNode, indent: string): string {
  return parent.content.content
    .map((node) => blockToText(node, indent))
    .join('\n');
}

function blockToText(node: EditorNode, indent: string): string {
  switch (node.type.name) {
    case 'bulletList':
      return listToText(node, indent, () => '• ');
    case 'orderedList': {
      const start: number = node.attrs.start ?? 1;
      return listToText(node, indent, (index) => `${start + index}. `);
    }
    case 'blockquote':
      return indentLines(blocksToText(node, ''), `${indent}> `);
    case 'horizontalRule':
      return `${indent}---`;
    case 'codeBlock':
      return indentLines(node.textContent, indent);
    default:
      return node.isTextblock
        ? indentLines(inlineToText(node), indent)
        : blocksToText(node, indent);
  }
}

function listToText(
  list: EditorNode,
  indent: string,
  marker: (index: number) => string,
): string {
  return list.content.content
    .map((item, index) => {
      const prefix = marker(index);
      // Hang the item under its marker; the marker replaces the first indent.
      const hanging = indent + ' '.repeat(prefix.length);
      return (
        indent + prefix + blocksToText(item, hanging).slice(hanging.length)
      );
    })
    .join('\n');
}

/** Inline text with links as `label (href)`; split link runs share one href. */
function inlineToText(block: EditorNode): string {
  let text = '';
  let linkText = '';
  let linkHref: string | undefined;

  const flushLink = () => {
    if (linkHref === undefined) return;
    text += linkHref === linkText ? linkText : `${linkText} (${linkHref})`;
    linkText = '';
    linkHref = undefined;
  };

  block.forEach((child) => {
    const href: string | undefined = child.marks.find(
      (mark) => mark.type.name === 'link',
    )?.attrs.href;
    const chunk = child.type.name === 'hardBreak' ? '\n' : child.textContent;

    if (href === undefined) {
      flushLink();
      text += chunk;
    } else {
      if (href !== linkHref) {
        flushLink();
        linkHref = href;
      }
      linkText += chunk;
    }
  });
  flushLink();

  return text;
}

function indentLines(text: string, indent: string): string {
  return text.replace(/^/gm, indent);
}
