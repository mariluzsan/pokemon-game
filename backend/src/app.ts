import express from 'express'
import cors from 'cors'
import { testDatabaseConnection } from './infrastructure/database/database.js'
import { gameRouter } from './modules/game/game.routes.js'
import { rankingRouter } from './modules/ranking/ranking.routes.js'

const app = express()
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

app.use(cors({
  origin: frontendOrigin,
}))
app.use(express.json())
app.use('/api', gameRouter)
app.use('/api', rankingRouter)

app.get('/api/health', async (_req, res) => {
  try {
    const database = await testDatabaseConnection()

    res.status(200).json({
      status: 'ok',
      message: 'API funcionando correctamente',
      database: {
        status: 'connected',
        currentTime: database.current_time,
      },
    })
  } catch {
    console.error('Error de conexion con PostgreSQL')

    res.status(503).json({
      status: 'error',
      message: 'Base de datos no disponible',
      database: {
        status: 'disconnected',
      },
    })
  }
})

export default app
