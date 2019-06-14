import test from 'ava'
import sinon = require('sinon')
import redisLib = require('redis')

import send from './send'

// Setup

const redisOptions = {
  uri: 'redis://localhost:6379'
}

// Tests

test('should GET from redis', async (t) => {
  const redisData = {
    title: 'Entry 1',
    description: 'The first entry'
  }
  const redisClient = {
    hgetall: sinon.stub().yieldsRight(null, redisData)
  }
  const request = {
    action: 'GET',
    endpoint: {
      redis: redisOptions
    },
    params: {
      type: 'meta',
      id: 'meta:entries'
    }
  }
  const expected = {
    status: 'ok',
    data: redisData
  }

  const ret = await send(request, redisClient as any)

  t.deepEqual(ret, expected)
  t.is(redisClient.hgetall.callCount, 1)
  t.deepEqual(redisClient.hgetall.args[0][0], 'meta:entries')
})

test('should prepend prefix to redis hash', async (t) => {
  const redisData = {
    title: 'Entry 1',
    description: 'The first entry'
  }
  const redisClient = {
    hgetall: sinon.stub().yieldsRight(null, redisData)
  }
  const request = {
    action: 'GET',
    endpoint: {
      prefix: 'store',
      redis: redisOptions
    },
    params: {
      type: 'meta',
      id: 'meta:entries'
    }
  }

  await send(request, redisClient as any)

  t.deepEqual(redisClient.hgetall.args[0][0], 'store:meta:entries')
})

test('should return not found for GET on empty data', async (t) => {
  const redisData = {}
  const redisClient = {
    hgetall: sinon.stub().yieldsRight(null, redisData)
  }
  const request = {
    action: 'GET',
    endpoint: {
      redis: redisOptions
    },
    params: {
      type: 'meta',
      id: 'meta:entries'
    }
  }
  const expected = {
    status: 'notfound',
    error: 'Could not find hash \'meta:entries\''
  }

  const ret = await send(request, redisClient as any)

  t.deepEqual(ret, expected)
})

test('should return not found for GET with no id', async (t) => {
  const redisClient = {
    hgetall: sinon.stub().yieldsRight(null, null)
  }
  const request = {
    action: 'GET',
    endpoint: {
      redis: redisOptions
    },
    params: {
      type: 'meta'
    }
  }
  const expected = {
    status: 'notfound',
    error: 'Cannot get data with no id'
  }

  const ret = await send(request, redisClient as any)

  t.deepEqual(ret, expected)
})

test('should SET to redis', async (t) => {
  const redisClient = {
    hmset: sinon.stub().yieldsRight(null, 'OK')
  }
  const request = {
    action: 'SET',
    endpoint: {
      redis: redisOptions
    },
    params: {
      type: 'meta',
      id: 'meta:entries'
    },
    data: {
      title: 'Entry 1',
      description: 'The first entry'
    }
  }
  const expected = {
    status: 'ok',
    data: null
  }
  const expectedArgs = ['title', 'Entry 1', 'description', 'The first entry']

  const ret = await send(request, redisClient as any)

  t.deepEqual(ret, expected)
  t.is(redisClient.hmset.callCount, 1)
  t.deepEqual(redisClient.hmset.args[0][0], 'meta:entries')
  t.deepEqual(redisClient.hmset.args[0][1], expectedArgs)
})

test('should return error for SET with no id', async (t) => {
  const redisClient = {
    hmset: sinon.stub().yieldsRight(null, 'OK')
  }
  const request = {
    action: 'SET',
    endpoint: {
      redis: redisOptions
    },
    params: {
      type: 'meta'
    },
    data: {
      title: 'Entry 1'
    }
  }
  const expected = {
    status: 'error',
    error: 'Cannot set data with no id'
  }

  const ret = await send(request, redisClient as any)

  t.deepEqual(ret, expected)
})

test('should return error when redis throws on get', async (t) => {
  const redisClient = {
    hgetall: sinon.stub().yieldsRight(new Error('Horror!'), null)
  }
  const request = {
    action: 'GET',
    endpoint: {
      redis: redisOptions
    },
    params: {
      type: 'meta',
      id: 'meta:entries'
    }
  }
  const expected = {
    status: 'error',
    error: 'Error from Redis while getting from hash \'meta:entries\'. Horror!'
  }

  const ret = await send(request, redisClient as any)

  t.deepEqual(ret, expected)
})

test('should return error when redis throws on set', async (t) => {
  const redisClient = {
    hmset: sinon.stub().yieldsRight(new Error('Horror!'), null)
  }
  const request = {
    action: 'SET',
    endpoint: {
      redis: redisOptions
    },
    params: {
      type: 'meta',
      id: 'meta:entries'
    },
    data: {
      title: 'Entry 1'
    }
  }
  const expected = {
    status: 'error',
    error: 'Error from Redis while setting on hash \'meta:entries\'. Horror!'
  }

  const ret = await send(request, redisClient as any)

  t.deepEqual(ret, expected)
})

test('should return error when no redis client', async (t) => {
  const request = {
    action: 'GET',
    endpoint: {
      redis: redisOptions
    },
    params: {
      type: 'meta',
      id: 'meta:entries'
    }
  }
  const expected = {
    status: 'error',
    error: 'No redis client given to redis adapter\'s send method'
  }

  const ret = await send(request, null)

  t.deepEqual(ret, expected)
})
