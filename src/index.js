import axios from 'axios';
import parseJSON from 'json-parse-safe';
import createToken from './create-token';
import validatePromiseMeta from './validate-promise-meta';

export default function reduxMetaObjectToAxiosPromise({
  axiosClient = axios,
  axiosOptions = {},
  tokenOptions = {},
} = {}) {
  const token = createToken(tokenOptions);

  const timersForActions = {};

  function debounceTrailing({ cb, actionType, wait }) {
    clearTimeout(timersForActions[actionType]);
    timersForActions[actionType] = setTimeout(() => {
      cb(); // called after the debouncing period
    }, wait);
  }

  function debounceLeading({ cb, actionType, wait }) {
    if (timersForActions[actionType] === undefined) {
      cb(); // called before the debouncing period
    }
    clearTimeout(timersForActions[actionType]);
    timersForActions[actionType] = setTimeout(() => {
      timersForActions[actionType] = undefined;
    }, wait);
  }

  return () => (next) => (action = {}) => {
    // check if we don't need to transform the promise
    if (
      !action ||
      !action.meta ||
      !action.meta.promise ||
      typeof action.meta.promise !== 'object'
    ) {
      return next(action);
    }

    validatePromiseMeta(action.meta.promise, axiosOptions);

    const {
      authenticated,
      headers,
      removeToken,
      saveToken,
      ...restOfPromiseMeta
    } = action.meta.promise;

    const getTokenIfNeeded = !authenticated
      ? Promise.resolve()
      : Promise.resolve(token.get());

    const transformResponse = [
      (data) => {
        const removeTokenPromise = action.meta.promise.removeToken
          ? token.remove()
          : Promise.resolve();

        const parsedDataWrapper = parseJSON(data);
        const parsedData = parsedDataWrapper.error
          ? data
          : parsedDataWrapper.value;

        if (action.meta.promise.saveToken && parsedData && parsedData.token) {
          // eslint-disable-next-line promise/catch-or-return
          removeTokenPromise.then(() => token.set(parsedData.token));
        }
        return parsedData;
      },
      ...(!Array.isArray(axiosOptions.transformResponse)
        ? []
        : axiosOptions.transformResponse),
    ];

    const buildHeaders = (accessToken) => ({
      ...axiosOptions.headers,
      ...headers,
      ...(typeof accessToken !== 'string'
        ? {}
        : { 'x-access-token': accessToken }),
    });

    const buildOptions = (accessToken) => ({
      ...axiosOptions,
      ...restOfPromiseMeta,
      method: !action.meta.promise.method
        ? 'get'
        : action.meta.promise.method.toLowerCase(),
      url: action.meta.promise.url,
      timeout: !action.meta.promise.timeout
        ? axiosOptions.timeout || 0
        : action.meta.promise.timeout,
      transformResponse,
      headers: buildHeaders(accessToken),
    });

    const addDebouncingIfNeeded = (options) =>
      new Promise((resolve) => {
        if (!action.meta.promise.debounce) {
          resolve(options);
        } else {
          const cb = () => resolve(options);
          const actionType = action.type;

          if (typeof action.meta.promise.debounce === 'number') {
            debounceTrailing({
              cb,
              actionType,
              wait: action.meta.promise.debounce,
            });
          } else {
            const { wait = 0, ...opts } = action.meta.promise.debounce;
            if (opts.leading) {
              debounceLeading({
                cb,
                actionType,
                wait,
              });
            } else {
              debounceTrailing({
                cb,
                actionType,
                wait,
              });
            }
          }
        }
      });

    const actionToDispatch = {
      ...action,
      meta: {
        ...action.meta,
        promise: getTokenIfNeeded
          .then(buildOptions)
          .then(addDebouncingIfNeeded)
          .then((opts) => axiosClient.request(opts)),
      },
    };

    return next(actionToDispatch);
  };
}
