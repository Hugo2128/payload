import { buildVersionGlobalFields, type CreateGlobalVersion } from 'payload'
import { APIError } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const createGlobalVersion: CreateGlobalVersion = async function createGlobalVersion(
  this: MongooseAdapter,
  {
    autosave,
    createdAt,
    globalSlug,
    parent,
    publishedLocale,
    req,
    snapshot,
    updatedAt,
    versionData,
  },
) {
  const VersionModel = this.versions[globalSlug]

  if (!VersionModel) {
    throw new APIError(`Could not find global ${globalSlug} version Mongoose model`)
  }

  const globalConfig = this.payload.config.globals.find((global) => global.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`Could not find global with slug ${globalSlug}`)
  }

  const options = {
    session: await getSession(this, req),
  }

  const data = {
    autosave,
    createdAt,
    latest: true,
    parent,
    publishedLocale,
    snapshot,
    updatedAt,
    version: versionData,
  }

  const fields = buildVersionGlobalFields(this.payload.config, globalConfig)

  transform({
    adapter: this,
    data,
    fields,
    operation: 'write',
  })

  let [doc] = await VersionModel.create([data], options, req)

  await VersionModel.updateMany(
    {
      $and: [
        {
          _id: {
            $ne: doc._id,
          },
        },
        {
          parent: {
            $eq: parent,
          },
        },
        {
          latest: {
            $eq: true,
          },
        },
      ],
    },
    { $unset: { latest: 1 } },
    options,
  )

  doc = doc.toObject()

  transform({
    adapter: this,
    data: doc,
    fields,
    operation: 'read',
  })

  return doc
}
