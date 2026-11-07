/**
 * Local ESLint plugin that enforces the naming rules in DEVELOPMENT.md.
 * Kept in-repo (no dependency): each rule only looks at file paths,
 * top-level exports and imports.
 */
import path from 'node:path';

const ACTION_VERBS =
  /^(get|upsert|remove|create|update|submit|save|send|toggle|run|upload|set|can)[A-Z]/;
const DB_VERBS = /^(select|insert|update|delete|upsert|count|is)[A-Z]/;

const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const rel = (context) =>
  path.relative(context.cwd, context.filename).split(path.sep).join('/');
const isTest = (file) => /\.test\.tsx?$/.test(file);

/** Exported names of top-level functions, async arrows and function consts. */
function* exportedFunctions(node) {
  const decl = node.declaration;
  if (!decl) return;
  if (decl.type === 'FunctionDeclaration' && decl.id) yield [decl.id, decl];
  if (decl.type === 'VariableDeclaration') {
    for (const d of decl.declarations) {
      if (d.id.type === 'Identifier' && d.init) yield [d.id, d.init];
    }
  }
}

const exportPrefix = ({ verbs, onlyAsync, message }) => ({
  meta: { type: 'suggestion', messages: { bad: message }, schema: [] },
  create(context) {
    return {
      'Program > ExportNamedDeclaration'(node) {
        for (const [id, init] of exportedFunctions(node)) {
          const isFn = /Function/.test(init.type);
          // Wrapped server actions are calls (`withAuth(...)`), plain helpers are sync.
          if (onlyAsync && !(isFn && init.async)) continue;
          if (!verbs.test(id.name)) {
            context.report({
              node: id,
              messageId: 'bad',
              data: { name: id.name },
            });
          }
        }
      },
    };
  },
});

const fileCase = {
  meta: {
    type: 'suggestion',
    messages: {
      pascal: '"{{name}}": component files in _components/ are PascalCase.',
      kebab:
        '"{{name}}": files are kebab-case (a .tsx component may be PascalCase).',
    },
    schema: [],
  },
  create(context) {
    const file = rel(context);
    const base = path.basename(file).replace(/(\.test)?\.(tsx?|mjs)$/, '');
    return {
      Program(node) {
        if (/\/_components\//.test(file) && file.endsWith('.tsx')) {
          if (!PASCAL_CASE.test(base)) {
            context.report({ node, messageId: 'pascal', data: { name: base } });
          }
        } else if (
          !KEBAB_CASE.test(base) &&
          !(file.endsWith('.tsx') && PASCAL_CASE.test(base))
        ) {
          context.report({ node, messageId: 'kebab', data: { name: base } });
        }
      },
    };
  },
};

const noDbAlias = {
  meta: {
    type: 'suggestion',
    messages: {
      alias:
        'Import "{{name}}" from {{source}} without an alias; data and action names never clash.',
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (!/^@\/db\//.test(source)) return;
        for (const s of node.specifiers) {
          if (
            s.type === 'ImportSpecifier' &&
            s.imported.name !== s.local.name
          ) {
            context.report({
              node: s,
              messageId: 'alias',
              data: { name: s.imported.name, source },
            });
          }
        }
      },
    };
  },
};

const plugin = {
  rules: {
    'action-name': exportPrefix({
      verbs: ACTION_VERBS,
      onlyAsync: false,
      message:
        '"{{name}}": actions start with get/upsert/remove/create/update or a workflow verb (submit, save, send, toggle, run, upload, set, can).',
    }),
    'db-name': exportPrefix({
      verbs: DB_VERBS,
      onlyAsync: true,
      message:
        '"{{name}}": data functions start with select/insert/update/delete/upsert/count/is.',
    }),
    'file-case': fileCase,
    'no-db-alias': noDbAlias,
  },
};

/** Flat-config entries wiring the rules to the folders they govern. */
export const namingConfig = [
  {
    files: ['src/actions/**/*.ts'],
    ignores: ['**/*.test.ts', 'src/actions/auth.ts', 'src/actions/cache.ts'],
    plugins: { naming: plugin },
    rules: { 'naming/action-name': 'error' },
  },
  {
    files: ['src/db/**/*.ts'],
    ignores: ['**/*.test.ts'],
    plugins: { naming: plugin },
    rules: { 'naming/db-name': 'error' },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/app/**/{page,layout,loading,error,not-found,route,default,template}.tsx',
      'src/app/**/route.ts',
      'src/app/docs/**',
      'src/components/**',
      '**/*.d.ts',
    ],
    plugins: { naming: plugin },
    rules: { 'naming/file-case': 'error', 'naming/no-db-alias': 'error' },
  },
];

export default plugin;
