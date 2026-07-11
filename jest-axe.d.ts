/**
 * Ambient types for `jest-axe` (the package ships no types of its own).
 *
 * We intentionally avoid `@types/jest-axe`: it does `/// <reference types="jest" />`,
 * which pulls Jest's global typings into the project. Jest's global `expect()`
 * then shadows Vitest's `Assertion`, hiding Vitest-only matchers such as
 * `toHaveBeenCalledExactlyOnceWith`.
 *
 * This file MUST stay a script (no top-level `import`/`export`) so the
 * `declare module` below is a standalone ambient declaration, not an
 * augmentation of the untyped module. The Vitest matcher augmentation lives in
 * `vitest.d.ts`, which needs module context.
 *
 * Only the runtime surface we use is typed (`axe`, `configureAxe`,
 * `toHaveNoViolations`); result payloads are loose since tests only pass them
 * straight into `expect(...).toHaveNoViolations()`.
 */
declare module 'jest-axe' {
  interface AxeResults {
    violations: Array<unknown>;
    passes: Array<unknown>;
    incomplete: Array<unknown>;
    inapplicable: Array<unknown>;
  }

  type RunOptions = Record<string, unknown>;

  interface JestAxeConfigureOptions extends RunOptions {
    globalOptions?: Record<string, unknown>;
    impactLevels?: Array<string>;
  }

  type JestAxe = (
    html: Element | string,
    options?: RunOptions,
  ) => Promise<AxeResults>;

  /** axe verifier pre-configured with defaults. */
  export const axe: JestAxe;

  /** Builds a new axe verifier with the given defaults. */
  export function configureAxe(options?: JestAxeConfigureOptions): JestAxe;

  /** Matcher registered via `expect.extend(toHaveNoViolations)`. */
  export const toHaveNoViolations: {
    toHaveNoViolations(results: AxeResults): {
      pass: boolean;
      actual: unknown;
      message(): string;
    };
  };
}
