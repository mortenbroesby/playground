module.exports = {
  parser: '@typescript-eslint/parser',
  env: { es2022: true },
  parserOptions: { sourceType: 'module' },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
  },
  ignorePatterns: ['dist', 'node_modules'],
};
