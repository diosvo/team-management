'use client';
import { useEffect, useId, useRef } from 'react';

export function Mermaid({ chart }: { chart: string }) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    void (async () => {
      const { default: mermaid } = await import('mermaid');

      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          fontFamily: 'inherit',
          themeCSS: 'margin: 1.5rem auto 0;',
          // Docs are light-only (theme switching is disabled in the layout).
          theme: 'default',
          // On a parse error, mermaid otherwise appends its bomb SVG to
          // <body>, where it outlives client-side navigation.
          suppressErrorRendering: true,
        });
        const { svg, bindFunctions } = await mermaid.render(
          // useId() output (e.g. «r0») is not a valid DOM id/selector
          `mermaid-${id.replace(/[^a-zA-Z0-9-]/g, '')}`,
          chart.replaceAll('\\n', '\n'),
        );
        container.innerHTML = svg;
        bindFunctions?.(container);
      } catch (error) {
        console.error('Error while rendering mermaid', error);
        container.textContent = '⚠ Failed to render diagram (see console).';
      }
    })();
  }, [chart, id]);

  return <div ref={containerRef} />;
}
