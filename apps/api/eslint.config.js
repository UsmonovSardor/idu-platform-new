const base = require('@idu/config/eslint/base.js');

module.exports = [
  ...base,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      // NestJS DI runtime metadata'ga tayanadi — inject qilinadigan klasslar
      // type-only import bo'lsa DI buziladi. Shu sabab bu qoida o'chirilgan.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  {
    ignores: ['dist/**', 'coverage/**', 'jest.config.js', 'eslint.config.js'],
  },
];
