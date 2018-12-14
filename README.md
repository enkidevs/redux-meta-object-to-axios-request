redux-meta-object-to-axios-request
=============

[![CircleCI](https://circleci.com/gh/enkidevs/redux-meta-object-to-axios-request.svg?style=svg)](https://circleci.com/gh/enkidevs/redux-meta-object-to-axios-request)
[![npm version](https://img.shields.io/npm/v/@enkidevs/redux-meta-object-to-axios-request.svg?style=flat-square)](https://www.npmjs.com/package/@enkidevs/redux-meta-object-to-axios-request)

Redux [middleware](http://rackt.github.io/redux/docs/advanced/Middleware.html) middleware to transform an object into a promise.

```bash
npm install --save @enkidevs/redux-meta-object-to-axios-request
```

## Usage in middlewares

Import the middleware creator and include it in `applyMiddleware` when creating the Redux store.

```js
import { applyMiddleware, createStore } from 'redux';
import reduxMetaObjectToAxiosRequest from 'redux-meta-object-to-axios-request';

const middlewares = [
  // ...other middleware
  // create the reduxMetaObjectToAxiosRequest middleware
  reduxMetaObjectToAxiosRequest({
    // optional global axios options applied to every request
    axiosOptions: {
      timeout: 300
    },
    // require token options with the storage
    // the storage key name is optional and will default to 'redux-meta-object-to-axios-request-token-key'
    tokenOptions: {
      storage = window.localStorage,
      key = 'token-key'
    }
  })
  // ...other middleware
]

const createStoreWithMiddleware = applyMiddleware(...middlewares)(createStore);
```

To use the middleware, dispatch a `promise` property within the `meta` of the action.

Example:

The below action creator, when triggered `dispatch(addTodoActionCreator('use redux-meta-object-to-axios-request'))`

```js
export function addTodoActionCreator(text) {
  return {
    type: "ADD_TODO",
    payload: {
      text
    },
    meta: {
      promise: {
        url: "/todo",
        method: "post",
        data: {
          text
        }
      }
    }
  };
}
```

will dispatch

```js
{
  type: "ADD_TODO",
  payload: {
    text: "use redux-optimist-promise"
  },
  promise: axiosPromise({ url: "/todo", method: "post", data: { text } })
}
```

## Usage with ReactNative

```js
import { applyMiddleware, createStore } from 'redux';
import { AsyncStorage } from 'react-native'
import reduxMetaObjectToAxiosRequest from 'redux-meta-object-to-axios-request';

const middleware = [
  // ...other middleware
  reduxMetaObjectToAxiosRequest({
    tokenOptions: {
      storage: AsyncStorage
    }
  })
  // ...other middleware
]

const createStoreWithMiddleware = applyMiddleware(...middlewares)(createStore);
```

## Advanced Usage

- to save the token to the token storage, add the `saveToken` flag:

```js
export function loginActionCreator({ username, password }) {
  return {
    type: "LOGIN",
    meta: {
      promise: {
        url: "/login",
        method: "post",
        saveToken: true, // signal to the middleware to save the token in the storage
        data: {
          username,
          password
        }
      }
    }
  };
}
```

- to remove the token from the token storage, add the `removeToken` flag:

```js
export function logoutActionCreator({ username, password }) {
  return {
    type: "LOGOUT",
    meta: {
      promise: {
        url: "/logout",
        method: "post",
        removeToken: true, // signal to the middleware to remove the token from the storage
      }
    }
  };
}
```

- to send the token saved in the storage when sending the axios request, use the `authenticated` flag:

```js
export function authRequestActionCreator({ username, password }) {
  return {
    type: "AUTH_REQUEST",
    meta: {
      promise: {
        url: "/auth-route",
        method: "get",
        authenticated: true, // signal to the middleware to send the stored token along with the request
      }
    }
  };
}
```

- to [debounce](https://codepen.io/nem035/full/xdybvK/) the request you can use a raw number (defaults to trailing debounce) or a `{ wait: Number, leading: Boolean, trailing: Boolean }`:

```js
export function searchActionCreator(text) {
  return {
    type: "SEARCH",
    meta: {
      promise: {
        url: "/search",
        method: "get",
        // signal to the middleware to debounce the request after 300ms
        debounce: 300,
        // or (same as above)
        debounce: {
          wait: 300,
          trailing: true
        },
        // or you can also use leading debounce
        debounce: {
          wait: 300,
          leading: true
        }
      }
    }
  };
}
```

- to propagate any other axios options, just specify them:

```js
export function uploadImageActionCreator({ data, onUploadProgress }) {
  return {
    type: "UPLOAD_IMAGE",
    meta: {
      promise: {
        method: "post",
        url: "/upload-image",
        data,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress, // propagate onUploadProgress to axios
      }
    }
  };
}
```

## License

  MIT
