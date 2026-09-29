import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import apiClient, { getApiAccessToken, refreshApiAccessToken, setApiAccessToken } from './apiClient';

test('startup and an expired API request share one cookie rotation', async () => {
  const originalAdapter = axios.defaults.adapter;
  const originalClientAdapter = apiClient.defaults.adapter;
  let refreshes = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  axios.defaults.adapter = async config => {
    refreshes++;
    await gate;
    return { data: { accessToken: 'fresh-token' }, status: 200, statusText: 'OK', headers: {}, config };
  };
  apiClient.defaults.adapter = async config => {
    if (config.headers.Authorization !== 'Bearer fresh-token') {
      throw new axios.AxiosError('Expired', 'ERR_BAD_REQUEST', config, undefined,
        { data: {}, status: 401, statusText: 'Unauthorized', headers: {}, config });
    }
    return { data: { id: 'user' }, status: 200, statusText: 'OK', headers: {}, config };
  };
  try {
    setApiAccessToken(null);
    const firstStartup = refreshApiAccessToken();
    const secondStartup = refreshApiAccessToken();
    assert.equal(firstStartup, secondStartup);
    const pendingApi = apiClient.get('/users/me');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(refreshes, 1);
    release();
    const [first, second, response] = await Promise.all([firstStartup, secondStartup, pendingApi]);
    assert.equal(first, 'fresh-token');
    assert.equal(second, first);
    assert.equal(response.status, 200);
    assert.equal(refreshes, 1);
    assert.equal(getApiAccessToken(), first);
  } finally {
    axios.defaults.adapter = originalAdapter;
    apiClient.defaults.adapter = originalClientAdapter;
    setApiAccessToken(null);
  }
});

test('a failed refresh can be retried on a later sign-in', async () => {
  const originalAdapter = axios.defaults.adapter;
  let attempts = 0;
  axios.defaults.adapter = async config => {
    if (++attempts === 1) throw new Error('No session');
    return { data: { accessToken: 'retry-token' }, status: 200, statusText: 'OK', headers: {}, config };
  };
  try {
    await assert.rejects(refreshApiAccessToken(), /No session/);
    assert.equal(await refreshApiAccessToken(), 'retry-token');
    assert.equal(attempts, 2);
  } finally {
    axios.defaults.adapter = originalAdapter;
    setApiAccessToken(null);
  }
});
