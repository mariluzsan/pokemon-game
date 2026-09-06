import assert from 'node:assert/strict'
import express from 'express'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createRankingRouter } from './ranking.routes.js'
import type { RankingReader } from './ranking.service.js'

async function withServer(
  rankingReader: RankingReader,
  run: (baseUrl: string) => Promise<void>,
) {
  const app = express()
  app.use('/api', createRankingRouter(rankingReader))

  const server = createServer(app)

  await new Promise<void>((resolve) => {
    server.listen(0, resolve)
  })

  const address = server.address() as AddressInfo

  try {
    await run(`http://127.0.0.1:${address.port}`)
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }
}

async function testReturnsRankingCollectionThroughDocumentedEndpoint() {
  await withServer(
    {
      listRanking: async () => [
        { playerName: 'Ash', score: 1200 },
        { playerName: 'Brock', score: 0 },
      ],
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/ranking`)

      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), {
        ranking: [
          { playerName: 'Ash', score: 1200 },
          { playerName: 'Brock', score: 0 },
        ],
      })
    },
  )
}

async function testReturnsEmptyRankingWhenNoFinishedGamesExist() {
  await withServer(
    {
      listRanking: async () => [],
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/ranking`)

      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), { ranking: [] })
    },
  )
}

async function testReturnsSafeDatabaseErrorWhenRepositoryFails() {
  await withServer(
    {
      listRanking: async () => {
        throw new Error('db down')
      },
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/ranking`)

      assert.equal(response.status, 500)
      assert.deepEqual(await response.json(), {
        error: {
          code: 'DATABASE_ERROR',
          message: 'No fue posible consultar el ranking.',
        },
      })
    },
  )
}

async function runTests() {
  await testReturnsRankingCollectionThroughDocumentedEndpoint()
  await testReturnsEmptyRankingWhenNoFinishedGamesExist()
  await testReturnsSafeDatabaseErrorWhenRepositoryFails()

  console.log('Ranking route tests passed')
}

void runTests()