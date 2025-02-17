import type { CreateOptions } from 'mongoose'

import { APIError, type Create } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './utilities/getSession.js'
import { handleError } from './utilities/handleError.js'
import { transform } from './utilities/transform.js'

export const create: Create = async function create(
  this: MongooseAdapter,
  { collection: collectionSlug, data, req },
) {
  const Model = this.collections[collectionSlug]

  if (!Model) {
    throw new APIError(`Could not find collection ${collectionSlug} Mongoose model`)
  }

  const collection = this.payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError('')
  }

  const options: CreateOptions = {
    session: await getSession(this, req),
  }

  let doc

  transform({
    adapter: this,
    data,
    fields: collection.config.fields,
    operation: 'write',
  })

  if (collection.customIDType) {
    data._id = data.id
  }

  try {
    ;[doc] = await Model.create([data], options)
  } catch (error) {
    handleError({ collection: collectionSlug, error, req })
  }

  doc = doc.toObject()

  transform({
    adapter: this,
    data: doc,
    fields: collection.config.fields,
    operation: 'read',
  })

  return doc
}
