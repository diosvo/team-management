// @ts-check
/**
 * TypeScript language service plugin: Ctrl/Cmd + click on a next-intl message
 * key (`t('title')`, `t.rich('…')`, `t.has('…')`) opens the message in
 * `<messagesDir>/<namespace>.json`.
 *
 * The namespace is read from the translator's type, `Translator<…, "ns">`,
 * so it works for any translator name, destructured or passed as a parameter.
 *
 * Config (tsconfig `compilerOptions.plugins`):
 *   { "name": "ts-plugin-intl-definition", "messagesDir": "src/i18n/messages/en" }
 */
const fs = require('node:fs');
const path = require('node:path');

const TRANSLATOR_METHODS = new Set(['rich', 'markup', 'raw', 'has']);

/** @param {{ typescript: typeof import('typescript') }} modules */
function init({ typescript: ts }) {
  /** @param {import('typescript').server.PluginCreateInfo} info */
  function create(info) {
    const service = info.languageService;
    const root = info.project.getCurrentDirectory();
    const messagesDir = path.resolve(
      root,
      info.config.messagesDir ?? 'src/i18n/messages/en',
    );

    /**
     * Innermost node spanning `position`
     * @param {import('typescript').Node} node
     * @param {number} position
     * @returns {import('typescript').Node}
     */
    const nodeAt = (node, position) => {
      const child = node.forEachChild((c) =>
        c.getStart() <= position && position < c.getEnd() ? c : undefined,
      );
      return child ? nodeAt(child, position) : node;
    };

    /** `"ns"` from `Translator<Messages, "ns">`, `''` without a namespace */
    const namespaceOf = (
      /** @type {import('typescript').TypeChecker} */ checker,
      /** @type {import('typescript').Expression} */ translator,
    ) => {
      const type = checker.getTypeAtLocation(translator);
      const args =
        type.aliasSymbol?.name === 'Translator'
          ? type.aliasTypeArguments
          : undefined;
      if (args?.[1]?.isStringLiteral()) return args[1].value;

      const text = checker.typeToString(
        type,
        undefined,
        ts.TypeFormatFlags.NoTruncation,
      );
      const match = /^Translator<.*,\s*"([^"]*)">$/.exec(text);
      if (match) return match[1];
      return /^Translator</.test(text) ? '' : undefined;
    };

    /** The JSON property for `path` (deepest match) in a messages file */
    const findProperty = (
      /** @type {string} */ fileName,
      /** @type {Array<string>} */ keyPath,
    ) => {
      if (!fs.existsSync(fileName)) return undefined;
      const json = ts.parseJsonText(
        fileName,
        fs.readFileSync(fileName, 'utf8'),
      );
      /** @type {import('typescript').Expression | undefined} */
      let object = json.statements[0]?.expression;
      /** @type {import('typescript').PropertyAssignment | undefined} */
      let found;
      for (const segment of keyPath) {
        if (!object || !ts.isObjectLiteralExpression(object)) break;
        /** @type {import('typescript').ObjectLiteralElementLike | undefined} */
        const property = object.properties.find(
          (p) =>
            ts.isPropertyAssignment(p) &&
            ts.isStringLiteral(p.name) &&
            p.name.text === segment,
        );
        if (!property || !ts.isPropertyAssignment(property)) break;
        found = property;
        object = property.initializer;
      }
      return found && { json, property: found };
    };

    /** @returns {import('typescript').DefinitionInfoAndBoundSpan | undefined} */
    const messageDefinition = (
      /** @type {string} */ fileName,
      /** @type {number} */ position,
    ) => {
      const program = service.getProgram();
      const source = program?.getSourceFile(fileName);
      if (!program || !source) return undefined;

      const literal = nodeAt(source, position);
      if (!ts.isStringLiteralLike(literal)) return undefined;
      const call = literal.parent;
      if (!ts.isCallExpression(call) || call.arguments[0] !== literal) {
        return undefined;
      }

      // `t('key')` or `t.rich('key')`
      const callee = call.expression;
      const translator =
        ts.isPropertyAccessExpression(callee) &&
        TRANSLATOR_METHODS.has(callee.name.text)
          ? callee.expression
          : callee;

      const namespace = namespaceOf(program.getTypeChecker(), translator);
      if (namespace === undefined) return undefined;

      const [file, ...keyPath] = [
        ...(namespace ? namespace.split('.') : []),
        ...literal.text.split('.'),
      ];
      const messagesFile = path.join(messagesDir, `${file}.json`);
      const match = keyPath.length
        ? findProperty(messagesFile, keyPath)
        : undefined;

      return {
        textSpan: {
          start: literal.getStart() + 1,
          length: literal.text.length,
        },
        definitions: [
          {
            fileName: messagesFile,
            textSpan: match
              ? {
                  start: match.property.name.getStart(match.json),
                  length: match.property.name.getWidth(match.json),
                }
              : { start: 0, length: 0 },
            kind: ts.ScriptElementKind.memberVariableElement,
            name: literal.text,
            containerKind: ts.ScriptElementKind.moduleElement,
            containerName: namespace || file,
          },
        ],
      };
    };

    /** @type {import('typescript').LanguageService} */
    const proxy = Object.create(null);
    for (const key of /** @type {Array<keyof typeof service>} */ (
      Object.keys(service)
    )) {
      // @ts-expect-error: forward every method as is
      proxy[key] = (...args) => service[key](...args);
    }

    proxy.getDefinitionAndBoundSpan = (fileName, position) =>
      messageDefinition(fileName, position) ??
      service.getDefinitionAndBoundSpan(fileName, position);

    proxy.getDefinitionAtPosition = (fileName, position) =>
      messageDefinition(fileName, position)?.definitions ??
      service.getDefinitionAtPosition(fileName, position);

    return proxy;
  }

  return { create };
}

module.exports = init;
