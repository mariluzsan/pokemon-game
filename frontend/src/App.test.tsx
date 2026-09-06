import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'

function createJsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('App routing', () => {
  const originalLocation = window.location

  beforeEach(() => {
    window.history.pushState({}, '', '/')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(createJsonResponse({ ranking: [] }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  test('permite acceder al ranking desde la pantalla inicial', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: 'Ver ranking' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Clasificación de jugadores' })).toBeInTheDocument()
    })
  })
})