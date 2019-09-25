import mapAny = require('map-any')
import { map } from 'ramda'
import { Request, Data } from '.'

const serializeObject = (value: object) => (value instanceof Date)
  ? value.toISOString() : JSON.stringify(value)

const serializeValue = (value?: string | number | boolean | object | null) =>
  (value === null || typeof value === 'undefined')
    ? ''
    : (typeof value === 'object')
      ? serializeObject(value)
      : value

const isData = (data: any): data is Data => (typeof data === 'object' && data !== null)

export default async function serialize (request: Request): Promise<Request> {
  return {
    ...request,
    data: (isData(request.data))
      ? mapAny(map<Data, Data>(serializeValue), request.data)
      : null
  }
}
