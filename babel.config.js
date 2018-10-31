const modules =
  process.env.BABEL_ENV === 'cjs' || process.env.NODE_ENV === 'test'
    ? 'commonjs'
    : false;

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        debug: process.env.NODE_ENV !== 'production',
        useBuiltIns: 'entry',
        modules,
        loose: true,
      },
    ],
  ],
};
