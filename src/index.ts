import redis = require('redis')
import connect from './connect'
import disconnect from './disconnect'
import send from './send'

export interface Options extends Record<string, unknown> {
  prefix?: string
  redis?: {
    [key: string]: string
  }
  concurrency?: number
  connectionTimeout?: number
}

export interface Payload extends Record<string, unknown> {
  type?: string | string[]
  id?: string | string[]
  data?: unknown
  params?: Record<string, unknown>
}

export interface Meta extends Record<string, unknown> {
  options?: Options
}

export interface Action {
  type: string
  payload: Payload
  response?: Response
  meta?: Meta
}

export interface Response {
  status: string | null
  data?: unknown
  error?: string
}

export interface Connection extends Record<string, unknown> {
  status: string
  error?: string
  expire?: null | number
  redisClient?: redis.RedisClient | null
}

export default {
  authentication: null,

  prepareOptions: (options: Options): Options => options,

  connect: connect(redis),

  send,

  disconnect,
}
