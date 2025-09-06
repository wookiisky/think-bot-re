module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // 根据用户规则：参数小于5个的函数使用单行注释
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-console': 'warn',
    // 强制使用分号
    'semi': ['error', 'always'],
    // 强制使用单引号
    'quotes': ['error', 'single'],
    // 行尾不允许有空格
    'no-trailing-spaces': 'error',
    // 对象字面量中冒号的前后空格
    'key-spacing': ['error', { beforeColon: false, afterColon: true }],
    // 逗号前后的空格
    'comma-spacing': ['error', { before: false, after: true }],
    // 大括号风格
    'brace-style': ['error', '1tbs', { allowSingleLine: true }],
  },
  globals: {
    chrome: 'readonly',
  },
}
