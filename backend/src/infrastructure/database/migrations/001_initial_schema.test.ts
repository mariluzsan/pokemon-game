import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const migrationPath = path.join(
  process.cwd(),
  'src',
  'infrastructure',
  'database',
  'migrations',
  '001_initial_schema.sql',
)

async function readInitialSchema() {
  return readFile(migrationPath, 'utf8')
}

async function testCreatesCoreGameTables() {
  const schema = await readInitialSchema()

  assert.match(schema, /CREATE TABLE games/i)
  assert.match(schema, /CREATE TABLE rounds/i)
  assert.match(schema, /CREATE TABLE hints/i)
}

async function testLinksRoundsAndHints() {
  const schema = await readInitialSchema()

  assert.match(schema, /FOREIGN KEY \(game_id\)/i)
  assert.match(schema, /REFERENCES games\(id\)/i)
  assert.match(schema, /FOREIGN KEY \(round_id\)/i)
  assert.match(schema, /REFERENCES rounds\(id\)/i)
}

async function testEnforcesHintLimits() {
  const schema = await readInitialSchema()

  assert.match(schema, /CHECK \(hints_used BETWEEN 0 AND 3\)/i)
  assert.match(schema, /CHECK \(level BETWEEN 1 AND 3\)/i)
  assert.match(schema, /UNIQUE \(round_id, level\)/i)
}

async function runTests() {
  await testCreatesCoreGameTables()
  await testLinksRoundsAndHints()
  await testEnforcesHintLimits()

  console.log('Initial schema tests passed')
}

void runTests()
