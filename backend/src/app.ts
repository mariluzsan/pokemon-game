import express from 'express'
import cors from 'cors'
import { testDatabaseConnection } from './infrastructure/database/database.js'

const app = express()

app.use(cors())
app.use(express.json())

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
  } catch (error) {
    console.error('Error de conexión con PostgreSQL:', error)

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