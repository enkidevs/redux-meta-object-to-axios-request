export default {
  request: jest.fn(
    (arg) =>
      new Promise((resolve) => {
        setTimeout(resolve, arg.timeout || 0, {
          data: arg.transformResponse.reduce(
            (data, transform) => transform(data),
            {
              token: 'fake-auth-token',
            }
          ),
        });
      })
  ),
};
