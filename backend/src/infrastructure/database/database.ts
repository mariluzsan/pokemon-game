import { Pool } from 'pg'

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

export async function testDatabaseConnection() {
  const client = await pool.connect()

  try {
    const result = await client.query('SELECT NOW() AS current_time')
    return result.rows[0]
  } finally {
    client.release()
  }
}