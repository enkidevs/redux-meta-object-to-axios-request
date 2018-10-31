export default {
  request: jest.fn(
    arg =>
      new Promise(resolve => {
        setTimeout(
          resolve,
          arg.timeout || 0,
          arg.transformResponse.reduce((data, transform) => transform(data), {
            token: 'fake-auth-token',
          })
        );
      })
  ),
  CancelToken: {
    source: jest.fn(() => ({
      token: 'fake-cancel-token',
      cancel: jest.fn(),
    })),
  },
};
