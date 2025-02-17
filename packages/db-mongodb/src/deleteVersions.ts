import { APIError, buildVersionCollectionFields, type DeleteVersions } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { getSession } from './utilities/getSession.js'

export const deleteVersions: DeleteVersions = async function deleteVersions(
  this: MongooseAdapter,
  { collection: collectionSlug, locale, req, where },
) {
  const VersionsModel = this.versions[collectionSlug]

  if (!VersionsModel) {
    throw new APIError(`Could not find collection ${collectionSlug} version Mongoose model`)
  }

  const collection = this.payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError('')
  }

  const session = await getSession(this, req)

  const query = await buildQuery({
    adapter: this,
    fields: buildVersionCollectionFields(this.payload.config, collection.config, true),
    locale,
    where,
  })

  await VersionsModel.deleteMany(query, { session })
}
