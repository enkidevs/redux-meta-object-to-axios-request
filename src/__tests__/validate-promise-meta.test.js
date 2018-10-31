import createMiddleware from '../index';

describe('validate-promise-meta', () => {
  let middleware;

  const tokenOptions = {
    storage: {
      getItem: () => {},
      setItem: () => {},
      removeItem: () => {},
    },
  };

  beforeEach(() => {
    middleware = createMiddleware({
      tokenOptions,
    });
  });

  it('should throw for invalid promise meta url', () => {
    const action = {
      meta: { promise: { url: null } },
    };
    expect(() => middleware()()(action)).toThrow(
      'meta.promise.url must be a non-empty string'
    );
  });

  it('should throw for invalid promise meta timeout', () => {
    const action = {
      meta: { promise: { url: 'fake-url', timeout: null } },
    };
    expect(() => middleware()()(action)).toThrow(
      'meta.promise.timeout must be a number > 0'
    );
  });

  it('should throw for invalid promise meta method', () => {
    const action = {
      meta: { promise: { url: 'fake-url', method: null } },
    };
    expect(() => middleware()()(action)).toThrow(
      'meta.promise.method must be a non-empty string'
    );
  });

  it('should throw for invalid promise meta debounce', () => {
    const action = {
      meta: { promise: { url: 'fake-url', debounce: null } },
    };
    expect(() => middleware()()(action)).toThrow(
      'meta.promise.debounce must be a number > 0 or an object in the format { wait: Number, leading: Boolean, trailing: Boolean'
    );
  });
});
