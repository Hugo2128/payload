import type { CreateOptions } from 'mongoose'

import { APIError, type CreateGlobal } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const createGlobal: CreateGlobal = async function createGlobal(
  this: MongooseAdapter,
  { slug, data, req },
) {
  const Model = this.globals

  const globalConfig = this.payload.config.globals.find(
    (globalConfig) => globalConfig.slug === slug,
  )

  if (!globalConfig) {
    throw new APIError('')
  }

  transform({
    adapter: this,
    data,
    fields: globalConfig.fields,
    globalSlug: slug,
    operation: 'write',
  })

  const options: CreateOptions = {
    session: await getSession(this, req),
  }

  let [result] = (await Model.create([data], options)) as any

  result = result.toObject()

  transform({
    adapter: this,
    data: result,
    fields: globalConfig.fields,
    operation: 'read',
  })

  return result
}
