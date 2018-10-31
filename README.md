redux-meta-object-to-axios-request
=============

[![CircleCI](https://circleci.com/gh/enkidevs/redux-meta-object-to-axios-request.svg?style=svg)](https://circleci.com/gh/enkidevs/redux-meta-object-to-axios-request)
[![npm version](https://img.shields.io/npm/v/redux-meta-object-to-axios-request.svg?style=flat-square)](https://www.npmjs.com/package/redux-meta-object-to-axios-request)

Redux [middleware](http://rackt.github.io/redux/docs/advanced/Middleware.html) middleware to transform an object into a promise.

```bash
npm install --save redux-meta-object-to-axios-request
```

## Usage in middlewares

First, import the middleware creator and include it in `applyMiddleware` when creating the Redux store. **You need to call it as a function (See later why on configuration section below):**

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

The below action creator, when triggered `dispatch(addTodo('use redux-meta-object-to-axios-request'))`

```js
export function addTodo(text) {
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

## License

  MIT
