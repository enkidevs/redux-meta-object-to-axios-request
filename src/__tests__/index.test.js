import mockAxios from 'axios';
import reduxMetaObjectToAxiosPromise from '../index';

jest.mock('axios');

describe('redux-meta-object-to-axios-request', () => {
  let middleware;

  const createTokenOptions = (initialToken = null, key) => {
    let token = initialToken;
    return {
      key,
      storage: {
        getItem: jest.fn(() => token),
        setItem: jest.fn((_, t) => {
          token = t;
        }),
        removeItem: jest.fn(() => {
          token = initialToken;
        }),
      },
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    middleware = reduxMetaObjectToAxiosPromise({
      tokenOptions: createTokenOptions(),
    });
  });

  it('should create a valid middleware', () => {
    expect(typeof middleware).toBe('function');
    expect(middleware).toHaveLength(0);
    expect(middleware()).toHaveLength(1);
    expect(middleware()()).toHaveLength(1);
  });

  it('should skip non-meta actions', () => {
    const next = jest.fn(() => 'whatever');

    expect(middleware()(next)()).toBe(next());
    expect(next).toHaveBeenCalledWith({});

    const actionWithoutMeta = {};
    expect(middleware()(next)(actionWithoutMeta)).toBe(next());
    expect(next).toHaveBeenCalledWith(actionWithoutMeta);

    const actionWithoutPromiseMeta = { meta: {} };
    expect(middleware()(next)(actionWithoutPromiseMeta)).toBe(next());
    expect(next).toHaveBeenCalledWith(actionWithoutPromiseMeta);

    const actionWithoutValidPromiseMeta = { meta: { promise: null } };
    expect(middleware()(next)(actionWithoutValidPromiseMeta)).toBe(next());
    expect(next).toHaveBeenCalledWith(actionWithoutValidPromiseMeta);
  });

  it('should save token', done => {
    const action = {
      meta: {
        promise: {
          url: 'fake-url',
          saveToken: true,
        },
      },
    };
    const tokenOptions = createTokenOptions();
    reduxMetaObjectToAxiosPromise({
      tokenOptions,
    })()(() => {})(action);
    // we have to call setTimeout to check for token existence
    // because token is saved via promises (microtasks)
    // so we have to create a whole new task using setTimeout
    // to make sure the token creation promise chain is
    // finished before checking the value of the saved token
    setTimeout(() => {
      expect(tokenOptions.storage.getItem()).toEqual(
        expect.stringMatching(/\w+/)
      );
      done();
    });
  });

  it('should save the token under the given key', done => {
    const action = {
      meta: {
        promise: {
          url: 'fake-url',
          saveToken: true,
        },
      },
    };
    const anotherKey = 'anotherKey';
    const tokenOptions = createTokenOptions(null, anotherKey);
    reduxMetaObjectToAxiosPromise({
      tokenOptions,
    })()(() => {})(action);
    // we have to call setTimeout to check for token existence
    // because token is saved via promises (microtasks)
    // so we have to create a whole new task using setTimeout
    // to make sure the token creation promise chain is
    // finished before checking the value of the saved token
    setTimeout(() => {
      expect(tokenOptions.storage.setItem).toHaveBeenCalledWith(
        anotherKey,
        expect.stringMatching(/\w+/)
      );
      done();
    });
  });

  it('should remove the token', done => {
    const action = {
      meta: {
        promise: {
          url: 'fake-url',
          removeToken: true,
        },
      },
    };
    const initialToken = 'initialToken';
    const tokenOptions = createTokenOptions(initialToken);
    tokenOptions.storage.setItem(
      'whatever',
      'another-token-value-different-from-initialToken'
    );
    reduxMetaObjectToAxiosPromise({
      tokenOptions,
    })()(() => {})(action);
    setTimeout(() => {
      expect(tokenOptions.storage.getItem()).toEqual(initialToken);
      done();
    });
  });

  it('should make the request and propagate to the next middleware', async () => {
    const action = {
      meta: {
        promise: {
          url: 'fake-url',
        },
      },
    };
    let nextAction;
    const next = jest.fn(a => {
      nextAction = a;
      return 'whatever';
    });
    const result = middleware()(next)(action);
    expect(result).toEqual('whatever');
    const axiosResult = await nextAction.meta.promise;
    expect(next).toHaveBeenCalledWith({
      ...action,
      meta: {
        ...action.meta,
        promise: nextAction.meta.promise,
      },
    });
    expect(axiosResult).toMatchObject({});
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(mockAxios.request).toHaveBeenCalledWith({
      url: action.meta.promise.url,
      method: 'get', // default value
      timeout: 0, // default value
      transformResponse: expect.arrayContaining([expect.any(Function)]),
      headers: {},
    });
  });

  it('should cancel the request', async () => {
    const action = {
      meta: {
        promise: {
          url: 'fake-url',
        },
      },
    };
    let nextAction;
    const next = jest.fn(a => {
      nextAction = a;
      return 'whatever';
    });
    const axiosOptions = {
      timeout: 100,
    };
    reduxMetaObjectToAxiosPromise({
      axiosOptions,
      tokenOptions: createTokenOptions(),
    })()(next)(action);
    try {
      // cancelled axios promises reject
      await nextAction.meta.promise;
    } catch (e) {
      expect(e.message).toEqual(
        `Timeout of ${axiosOptions.timeout}ms exceeded.`
      );
    }
  });

  it('should debounce the request based on given milliseconds (trailing by default)', async () => {
    const action = {
      meta: {
        promise: {
          url: 'fake-url',
          debounce: 300,
        },
      },
    };
    let nextAction;
    const next = jest.fn(a => {
      nextAction = a;
      return 'whatever';
    });
    const middlewareAction = middleware()(next);
    for (let i = 0; i < 1000; i += 1) {
      middlewareAction(action);
    }
    // make sure the function isn't called before the debouncing period
    setTimeout(() => {
      expect(mockAxios.request).not.toHaveBeenCalled();
    }, action.meta.promise.debounce - 1);
    await nextAction.meta.promise;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
  });

  it('should debounce the request based on given milliseconds and the trailing flag', async () => {
    const action = {
      meta: {
        promise: {
          url: 'fake-url',
          debounce: {
            wait: 300,
            trailing: true,
          },
        },
      },
    };
    let nextAction;
    const next = jest.fn(a => {
      nextAction = a;
      return 'whatever';
    });
    const middlewareAction = middleware()(next);
    for (let i = 0; i < 1000; i += 1) {
      middlewareAction(action);
    }
    // make sure the function isn't called before the debouncing period
    setTimeout(() => {
      expect(mockAxios.request).not.toHaveBeenCalled();
    }, action.meta.promise.debounce - 1);
    await nextAction.meta.promise;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
  });

  it('should debounce the request based on given milliseconds and the leading flag', async () => {
    const action = {
      meta: {
        promise: {
          url: 'fake-url',
          debounce: {
            wait: 300,
            leading: true,
          },
        },
      },
    };
    const next = jest.fn(() => 'whatever');
    const middlewareAction = middleware()(next);
    for (let i = 0; i < 1000; i += 1) {
      middlewareAction(action);
    }
    // make sure the function is called once before the debouncing period
    setTimeout(() => {
      expect(mockAxios.request).toHaveBeenCalledTimes(1);
    }, action.meta.promise.debounce);
  });
});
