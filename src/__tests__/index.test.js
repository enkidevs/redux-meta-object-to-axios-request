import mockAxios from 'axios';
import createMiddleware from '../index';

jest.mock('axios');

describe('redux-meta-object-to-axios-request', () => {
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

  it('should create a valid middleware', () => {
    expect(typeof middleware).toBe('function');
    expect(middleware).toHaveLength(0);
    expect(middleware()).toHaveLength(1);
    expect(middleware()()).toHaveLength(1);
  });

  it('should skip non-meta actions', () => {
    const next = jest.fn(() => 'whatever');

    const actionWithoutMeta = {};
    const result1 = middleware()(next)(actionWithoutMeta);
    expect(result1).toBe(next());
    expect(next).toHaveBeenCalledWith(actionWithoutMeta);

    const actionWithoutPromiseMeta = { meta: {} };
    const result2 = middleware()(next)(actionWithoutPromiseMeta);
    expect(result2).toBe(next());
    expect(next).toHaveBeenCalledWith(actionWithoutPromiseMeta);

    const actionWithoutValidPromiseMeta = { meta: { promise: null } };
    const result3 = middleware()(next)(actionWithoutValidPromiseMeta);
    expect(result3).toBe(next());
    expect(next).toHaveBeenCalledWith(actionWithoutValidPromiseMeta);
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

  it('should throw for promise meta timeout larger than global timeout', () => {
    const action = {
      meta: { promise: { url: 'fake-url', timeout: 100 } },
    };
    const globalTimeout = action.meta.promise.timeout - 1;
    const middlewareWithGlobalAxiosOptions = createMiddleware({
      axiosOptions: {
        timeout: globalTimeout,
      },
      tokenOptions,
    });
    expect(() => middlewareWithGlobalAxiosOptions()()(action)).toThrow(
      `meta.promise.timeout must be a number < axiosOptions.timeout (${globalTimeout}ms)`
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
    expect(axiosResult).toMatchObject({});
    expect(mockAxios.request).toHaveBeenCalledWith({
      url: action.meta.promise.url,
      method: 'get', // default value
      timeout: 0, // default value
      transformResponse: expect.arrayContaining([expect.any(Function)]),
      headers: {},
    });
    expect(next).toHaveBeenCalledWith({
      ...action,
      meta: {
        ...action.meta,
        promise: expect.any(Promise),
      },
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
    const middlewareWithGlobalAxiosOptions = createMiddleware({
      axiosOptions,
      tokenOptions,
    });
    middlewareWithGlobalAxiosOptions()(next)(action);
    try {
      await nextAction.meta.promise;
    } catch (e) {
      expect(e.message).toEqual(
        `Timeout of ${axiosOptions.timeout}ms exceeded.`
      );
    }
  });
});
