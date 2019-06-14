import { promisify } from 'util'
import redisLib = require('redis')
import { Request, Response, SerializedData, Connection } from '.'

const createError = (error: Error, message: string) => ({
  status: 'error',
  error: `${message} ${error.message}`
})

const noIdError = (hasData: boolean) => (hasData)
  ? { status: 'error', error: 'Cannot set data with no id' }
  : { status: 'notfound', error: 'Cannot get data with no id' }

const objectToArray = (data: SerializedData) => Object.keys(data)
  .reduce((arr: string[], key: string) => [ ...arr, key, data[key] ], [])

const sendGet = async (client: redisLib.RedisClient, hash: string) => {
  const hgetall = promisify(client.hgetall).bind(client)

  try {
    const responseData = await hgetall(hash)
    return (responseData && Object.keys(responseData).length > 0)
      ? { status: 'ok', data: responseData }
      : { status: 'notfound', error: `Could not find hash '${hash}'` }
  } catch (error) {
    return createError(error, `Error from Redis while getting from hash '${hash}'.`)
  }
}

const sendSet = async (client: redisLib.RedisClient, hash: string, data: SerializedData) => {
  const hmset = promisify<string, string[], 'OK'>(client.hmset).bind(client)

  try {
    await hmset(hash, objectToArray(data))
    return { status: 'ok', data: null }
  } catch (error) {
    return createError(error, `Error from Redis while setting on hash '${hash}'.`)
  }
}

const hashFromIdAndPrefix = (id: string, prefix?: string) =>
  (typeof prefix === 'string' && prefix !== '') ? `${prefix}:${id}` : id

const isData = (data: any): data is SerializedData => (typeof data === 'object' && data !== null)

const sendData = async (client: redisLib.RedisClient, hash: string, data?: SerializedData) => {
  return (isData(data))
    ? sendSet(client, hash, data)
    : sendGet(client, hash)
}

const send = async (request: Request, connection: Connection | null): Promise<Response> => {
  if (!connection || connection.status !== 'ok' || !connection.redisClient) {
    return { status: 'error', error: 'No redis client given to redis adapter\'s send method' }
  }
  const { endpoint, data, params } = request
  if (!params || !params.id) {
    return noIdError(isData(request.data))
  }

  const hash = hashFromIdAndPrefix(params.id, endpoint && endpoint.prefix)

  return sendData(connection.redisClient, hash, data as SerializedData)
}

export default send
