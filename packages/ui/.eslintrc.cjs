module.exports = {
  parser: '@typescript-eslint/parser',
  env: { browser: true, es2022: true },
  parserOptions: { sourceType: 'module' },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
  },
  ignorePatterns: ['dist', 'node_modules'],
};
