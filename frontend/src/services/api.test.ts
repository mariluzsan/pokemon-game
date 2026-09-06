import { getRanking } from './api'

function createJsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('getRanking', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('consulta el ranking sin permitir cache del navegador', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({
        ranking: [{ playerName: 'Ash', score: 1200 }],
      }),
    )

    const ranking = await getRanking()

    expect(ranking).toEqual([{ playerName: 'Ash', score: 1200 }])
    expect(fetchSpy).toHaveBeenCalledWith('/api/ranking', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: undefined,
    })
  })
})