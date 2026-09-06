import { render, screen, waitFor } from '@testing-library/react'
import Ranking from './Ranking'

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('Ranking', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('muestra un estado de carga mientras consulta el ranking', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => undefined))

    render(<Ranking />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando ranking...')
  })

  test('muestra posicion, jugador y puntuacion usando el orden exacto del backend', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({
        ranking: [
          { playerName: 'B', score: 100 },
          { playerName: 'A', score: 900 },
          { playerName: 'C', score: 500 },
        ],
      }),
    )

    render(<Ranking />)

    const rows = await screen.findAllByRole('row')

    expect(rows).toHaveLength(4)
    expect(rows[1]).toHaveTextContent('1')
    expect(rows[1]).toHaveTextContent('B')
    expect(rows[1]).toHaveTextContent('100')
    expect(rows[2]).toHaveTextContent('2')
    expect(rows[2]).toHaveTextContent('A')
    expect(rows[2]).toHaveTextContent('900')
    expect(rows[3]).toHaveTextContent('3')
    expect(rows[3]).toHaveTextContent('C')
    expect(rows[3]).toHaveTextContent('500')
    expect(screen.queryByText('pokemon_id')).not.toBeInTheDocument()
    expect(screen.queryByText('difficulty')).not.toBeInTheDocument()
  })

  test('muestra un estado vacio cuando el backend devuelve una coleccion vacia', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(createJsonResponse({ ranking: [] }))

    render(<Ranking />)

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Todavía no hay resultados registrados.')
    })
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  test('muestra un mensaje seguro cuando falla la consulta', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({
        error: {
          code: 'DATABASE_ERROR',
          message: 'No fue posible consultar el ranking.',
        },
      }, 500),
    )

    render(<Ranking />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No fue posible consultar el ranking. Intenta nuevamente en unos instantes.')
    expect(alert).not.toHaveTextContent('DATABASE_ERROR')
    expect(alert).not.toHaveTextContent('SELECT')
  })
})