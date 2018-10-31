const modules =
  process.env.BABEL_ENV === 'cjs' || process.env.NODE_ENV === 'test'
    ? 'commonjs'
    : false;

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        debug:
          Boolean(process.env.CI) || // always show babel debug info in the CI environment
          !['production', 'test'].includes(process.env.NODE_ENV),
        useBuiltIns: 'entry',
        modules,
        loose: true,
      },
    ],
  ],
};
