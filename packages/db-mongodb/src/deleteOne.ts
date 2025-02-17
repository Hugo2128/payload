import type { QueryOptions } from 'mongoose'

import { APIError, type DeleteOne } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const deleteOne: DeleteOne = async function deleteOne(
  this: MongooseAdapter,
  { collection: collectionSlug, req, select, where },
) {
  const Model = this.collections[collectionSlug]

  if (!Model) {
    throw new APIError(`Could not find collection ${collectionSlug} Mongoose model`)
  }

  const collection = this.payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(`Could not find collection ${collectionSlug}`)
  }

  const options: QueryOptions = {
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: collection.config.flattenedFields,
      select,
    }),
    session: await getSession(this, req),
  }

  const query = await buildQuery({
    adapter: this,
    collectionSlug,
    fields: collection.config.flattenedFields,
    where,
  })

  const doc = await Model.findOneAndDelete(query, options)?.lean()

  if (!doc) {
    return null
  }

  transform({
    adapter: this,
    data: doc,
    fields: collection.config.fields,
    operation: 'read',
  })

  return doc
}
