module.exports = {
  env: { node: true, jest: true },
  extends: ['airbnb-base'],
  rules: {
    'arrow-parens': ['error', 'as-needed'],
    'no-console': 'off',
    'max-len': 1,
  },
};
