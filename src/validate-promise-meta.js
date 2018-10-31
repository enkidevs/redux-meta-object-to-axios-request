import invariant from 'invariant';

export default function validatePromiseMeta(promise, axiosOptions) {
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
  if (typeof promise.debounce !== 'undefined') {
    invariant(
      isPositiveNumber(promise.debounce) ||
        (promise.debounce && typeof promise.debounce === 'object'),
      'meta.promise.debounce must be a number > 0 or an object in the format { wait: Number, leading: Boolean, trailing: Boolean'
    );
  }
}

export function isPositiveNumber(number) {
  return Number.isFinite(number) && number > 0;
}

export function isNonEmptyString(string) {
  return typeof string === 'string' && string.length > 0;
}
