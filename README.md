redux-meta-object-to-axios-request
=============

[![build status](https://img.shields.io/travis/enkidevs/redux-meta-object-to-axios-request/master.svg?style=flat-square)](https://travis-ci.org/enkidevs/redux-meta-object-to-axios-request)
[![npm version](https://img.shields.io/npm/v/redux-meta-object-to-axios-request.svg?style=flat-square)](https://www.npmjs.com/package/redux-meta-object-to-axios-request)

Redux [middleware](http://rackt.github.io/redux/docs/advanced/Middleware.html) middleware to transform an object into a promise.

```bash
npm install --save redux-meta-object-to-axios-request
```

## Usage in middlewares

First, import the middleware creator and include it in `applyMiddleware` when creating the Redux store. **You need to call it as a function (See later why on configuration section below):**

```js
import middleware from 'redux-meta-object-to-axios-request';

composeStoreWithMiddleware = applyMiddleware(
  middleware({
    keyIn = 'promise',
    keyOut = 'promise',
    axiosOptions = {},
    tokenOptions = {
      storage = window.localStorage,
      key = 'token-key'
    }
  })
)(createStore);

```

To use the middleware, dispatch a `promise` property within the `meta` of the action.

Example:

The below action creator, when triggered `dispatch(addTodo('use redux-meta-object-to-axios-request'))`

```js
export function addTodo (text) {
  return {
    type: 'ADD_TODO',
    payload: {
      text
    },
    meta: {
      promise: { url: '/todo', method: 'post', data: { text } },
    }
  }
}
```

will dispatch
```js
{
  type: 'ADD_TODO',
  payload: {
    text: 'use redux-optimist-promise'
  },
  promise: axiosPromise({ url: '/todo', method: 'post', data: { text } })
}
```

## Usage with React-native

```js
import { AsyncStorage } from 'react-native'
import middleware from 'redux-meta-object-to-axios-request'

composeStoreWithMiddleware = applyMiddleware(
  middleware({
    tokenOptions: {
      storage: AsyncStorage
    }
  })
)(createStore);

```

## License

  MIT
