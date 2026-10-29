'use client';
import { useEffect, useId, useRef } from 'react';

export function Mermaid({ chart }: { chart: string }) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const render = async () => {
      const { default: mermaid } = await import('mermaid');
      if (cancelled) return;

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
        if (cancelled) return;
        container.innerHTML = svg;
        bindFunctions?.(container);
      } catch (error) {
        console.error('Error while rendering mermaid', error);
        container.textContent = '⚠ Failed to render diagram (see console).';
      }
    };

    // Mermaid measures text while laying out, so a diagram rendered inside a
    // hidden tab or accordion comes out blank. Wait until it is on screen.
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void render();
    });
    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [chart, id]);

  return <div ref={containerRef} />;
}
