import {
  createFileSystemGeneratorCache,
  createGenerator,
  createProject,
} from 'fumadocs-typescript';
import { AutoTypeTable, type AutoTypeTableProps } from 'fumadocs-typescript/ui';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Callout } from 'fumadocs-ui/components/callout';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';

import { Mermaid } from './mermaid';
import { PermissionMatrix } from './permission-matrix';

// One TypeScript program for every <AutoTypeTable /> in the build; results
// are cached on disk so repeated builds skip the type-checker. The program
// only contains files that were loaded explicitly, so the ambient helpers
// (`Nullable`, `Nullish`, …) from global.d.ts are preloaded, otherwise
// columns using them would render as `any`.
const generator = createProject().then((project) => {
  project.getSourceFile('global.d.ts');

  return createGenerator({
    project,
    cache: createFileSystemGeneratorCache('.next/cache/fumadocs-typescript'),
  });
});

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Accordion,
    Accordions,
    Callout,
    File,
    Files,
    Folder,
    Mermaid,
    PermissionMatrix,
    Step,
    Steps,
    Tab,
    Tabs,
    TypeTable,
    AutoTypeTable: async (props: Partial<AutoTypeTableProps>) => (
      <AutoTypeTable {...props} generator={await generator} />
    ),
    ...components,
  } satisfies MDXComponents;
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
