/**
 * Registers the `jest-axe` matcher on Vitest's assertion interfaces.
 *
 * Kept separate from `jest-axe.d.ts` because module augmentation requires this
 * file to be a module (hence the `import 'vitest'`), whereas the `jest-axe`
 * ambient declaration requires script context.
 *
 * @see `jest-axe.d.ts` for why we hand-roll these types instead of using `@types/jest-axe`.
 */
import 'vitest';

declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveNoViolations(): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
