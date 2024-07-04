import type {Config} from 'jest';
import {pathsToModuleNameMapper} from 'ts-jest';
import {compilerOptions} from './tsconfig.json';

const jestConfig: Config = {
  preset: 'jest-preset-angular',
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {prefix: '<rootDir>'}),
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
};

export default jestConfig;
