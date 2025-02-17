import type { QueryOptions } from 'mongoose'

import { APIError, type UpdateGlobal } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const updateGlobal: UpdateGlobal = async function updateGlobal(
  this: MongooseAdapter,
  { slug, data, options: optionsArgs = {}, req, select },
) {
  const Model = this.globals

  const globalConfig = this.payload.config.globals.find(
    (globalConfig) => globalConfig.slug === slug,
  )

  if (!globalConfig) {
    throw new APIError(`Could not find global with slug ${slug}`)
  }

  const fields = globalConfig.fields

  const options: QueryOptions = {
    ...optionsArgs,
    lean: true,
    new: true,
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: globalConfig.flattenedFields,
      select,
    }),
    session: await getSession(this, req),
  }

  transform({ adapter: this, data, fields, globalSlug: slug, operation: 'write' })

  const result: any = await Model.findOneAndUpdate({ globalType: slug }, data, options)

  transform({ adapter: this, data: result, fields, globalSlug: slug, operation: 'read' })

  return result
}
