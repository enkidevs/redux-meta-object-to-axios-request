import createToken, { defaultKey } from '../create-token';

describe('create-token', () => {
  it('should throw for missing storage', () => {
    expect(() => createToken()).toThrow('token storage object is required');
  });

  it('should throw for invalid storage api', () => {
    const invalidStorage1 = {};
    const invalidStorage2 = { ...invalidStorage1, getItem: () => {} };
    const invalidStorage3 = { ...invalidStorage2, setItem: () => {} };
    expect(() => createToken({ storage: invalidStorage1 })).toThrow(
      `token storage object must have a "getItem" method`
    );
    expect(() => createToken({ storage: invalidStorage2 })).toThrow(
      `token storage object must have a "setItem" method`
    );
    expect(() => createToken({ storage: invalidStorage3 })).toThrow(
      `token storage object must have a "removeItem" method`
    );
  });

  it('should return a valid token api', () => {
    const storage = window.localStorage;
    const token = createToken({ storage });
    expect(Object.keys(token)).toHaveLength(3);
    expect(typeof token.set).toBe('function');
    expect(typeof token.get).toBe('function');
    expect(typeof token.remove).toBe('function');
  });

  it('should use the underline storage', async () => {
    const storage = (() => {
      let storedToken = null;
      return {
        getItem: jest.fn(() => storedToken),
        setItem: jest.fn((_, token) => {
          storedToken = token;
        }),
        removeItem: jest.fn(() => {
          storedToken = null;
        }),
      };
    })();

    const token = createToken({ storage });
    const tokenString = '123';

    // test set
    await token.set(tokenString);
    expect(storage.setItem).toHaveBeenCalledWith(defaultKey, tokenString);

    // test get
    const expectedTokenString = await token.get();
    expect(storage.getItem).toHaveBeenCalledWith(defaultKey);
    expect(expectedTokenString).toEqual(tokenString);

    // test remove
    await token.remove();
    const nonExistentTokenString = await token.get();
    expect(storage.removeItem).toHaveBeenCalledWith(defaultKey);
    expect(nonExistentTokenString).toBeNull();
  });

  it('should throw for invalid custom key', () => {
    const storage = {
      getItem: () => {},
      setItem: () => {},
      removeItem: () => {},
    };
    expect(() => createToken({ storage, key: 123 })).toThrow(
      'token storage key must be a string'
    );
  });

  it('should use the underline storage with a custom key', async () => {
    const customKey = 'custom';
    const storage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };

    const token = createToken({ storage, key: customKey });

    // test set
    await token.set('whatever');
    expect(storage.setItem).toHaveBeenCalledWith(customKey, 'whatever');

    // test get
    await token.get();
    expect(storage.getItem).toHaveBeenCalledWith(customKey);

    // test remove
    await token.remove();
    expect(storage.removeItem).toHaveBeenCalledWith(customKey);
  });
});
