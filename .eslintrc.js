module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
    mocha: true
  },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'script'
  },
  extends: [
    'eslint:recommended',
    'plugin:mocha/recommended'
  ],
  plugins: [
    'mocha'
  ],
  rules: {
    'arrow-parens': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    indent: ['error', 2],
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^__*$' }],
    semi: [2, 'always'],
    quotes: ['error', 'single']
  }
};
