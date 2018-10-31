import axios from 'axios';
import invariant from 'invariant';
import parseJSON from 'json-parse-safe';
import createToken from './create-token';

export default function reduxMetaObjectToAxiosPromise({
  axiosOptions = {},
  tokenOptions = {},
} = {}) {
  const token = createToken(tokenOptions);

  return () => next => (action = {}) => {
    // check if we don't need to transform the promise
    if (
      !action.meta ||
      !action.meta.promise ||
      typeof action.meta.promise !== 'object'
    ) {
      return next(action);
    }

    validatePromiseMeta(action.meta.promise, axiosOptions);

    const getTokenIfNeededPromise = !action.meta.promise.authenticated
      ? Promise.resolve()
      : Promise.resolve(token.get());

    const transformResponse = [
      data => {
        const removeTokenPromise = action.meta.promise.removeToken
          ? token.remove()
          : Promise.resolve();

        const parsedDataWrapper = parseJSON(data);
        const parsedData = parsedDataWrapper.error
          ? data
          : parsedDataWrapper.value;

        if (action.meta.promise.catchToken && parsedData && parsedData.token) {
          // eslint-disable-next-line promise/catch-or-return
          removeTokenPromise.then(() => token.set(parsedData.token));
        }
        return parsedData;
      },
      ...(!Array.isArray(axiosOptions.transformResponse)
        ? []
        : axiosOptions.transformResponse),
    ];

    const headers = accessToken => ({
      ...axiosOptions.headers,
      ...(typeof accessToken !== 'string'
        ? {}
        : { 'x-access-token': accessToken }),
    });

    const buildOptions = accessToken => ({
      ...axiosOptions,
      timeout: !action.meta.promise.timeout ? 0 : action.meta.promise.timeout,
      method: !action.meta.promise.method ? 'get' : action.meta.promise.method,
      url: action.meta.promise.url,
      transformResponse,
      headers: headers(accessToken),
    });

    const addCancelationIfNeeded = options => {
      // cancel axios request based on the global timeout setting
      // if none or shorter request-specific timeout is provided
      if (
        isPositiveNumber(axiosOptions.timeout) &&
        !action.meta.promise.timeout
      ) {
        const source = axios.CancelToken.source();
        // eslint-disable-next-line no-param-reassign
        options.cancelToken = source.token;
        setTimeout(() => {
          source.cancel(`Timeout of ${axiosOptions.timeout}ms exceeded.`);
        }, axiosOptions.timeout);
      }
      return options;
    };

    const actionToDispatch = {
      ...action,
      meta: {
        ...action.meta,
        promise: getTokenIfNeededPromise
          .then(buildOptions)
          .then(addCancelationIfNeeded)
          .then(opts => axios.request(opts)),
      },
    };

    return next(actionToDispatch);
  };
}

function validatePromiseMeta(promise, axiosOptions) {
  // validate required meta props
  invariant(
    isNonEmptyString(promise.url),
    'meta.promise.url must be a non-empty string'
  );
  // validate rest of meta props if they are specified
  if (typeof promise.timeout !== 'undefined') {
    invariant(
      isPositiveNumber(promise.timeout),
      'meta.promise.timeout must be a number > 0'
    );
    if (isPositiveNumber(axiosOptions.timeout)) {
      invariant(
        promise.timeout < axiosOptions.timeout,
        `meta.promise.timeout must be a number < axiosOptions.timeout (${
          axiosOptions.timeout
        }ms)`
      );
    }
  }
  if (typeof promise.method !== 'undefined') {
    invariant(
      isNonEmptyString(promise.method),
      'meta.promise.method must be a non-empty string'
    );
  }
}

function isPositiveNumber(number) {
  return Number.isFinite(number) && number > 0;
}

function isNonEmptyString(string) {
  return typeof string === 'string' && string.length > 0;
}
