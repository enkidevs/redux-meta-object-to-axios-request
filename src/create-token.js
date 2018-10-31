import invariant from 'invariant';

export const defaultKey = 'redux-meta-object-to-axios-request-token-key';

export default function createToken({ storage, key = defaultKey } = {}) {
  invariant(typeof key === 'string', 'token storage key must be a string');
  validateStorageApi(storage);

  return {
    set: async function setToken(token) {
      invariant(typeof token === 'string', 'token must be a string');
      return storage.setItem(key, token);
    },
    get: async function getToken() {
      return storage.getItem(key);
    },
    remove: async function removeToken() {
      return storage.removeItem(key);
    },
  };
}

function validateStorageApi(storage) {
  invariant(
    storage && typeof storage === 'object',
    'token storage object is required'
  );
  ['getItem', 'setItem', 'removeItem'].forEach(methodName => {
    invariant(
      typeof storage[methodName] === 'function',
      `token storage object must have a "${methodName}" method`
    );
  });
}
