export default {
  request: jest.fn(() => Promise.resolve({ data: {} })),
  CancelToken: {
    source: jest.fn(() => ({
      token: 'fake-token',
      cancel: jest.fn(),
    })),
  },
};
