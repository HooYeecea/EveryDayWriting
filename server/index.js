import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import express from 'express'
import cors from 'cors'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../data')
const SAVES_FILE = path.join(DATA_DIR, 'writing-saves.json')
const SUBMITS_FILE = path.join(DATA_DIR, 'writing-submits.json')

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '2mb' }))

async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  for (const file of [SAVES_FILE, SUBMITS_FILE]) {
    try {
      await fs.access(file)
    } catch {
      await fs.writeFile(file, '[\n]\n', 'utf-8')
    }
  }
}

async function readRecords(filePath) {
  await ensureDataFiles()
  const content = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

async function writeRecords(filePath, records) {
  await fs.writeFile(filePath, `${JSON.stringify(records, null, 2)}\n`, 'utf-8')
}

function filterByUser(records, userId) {
  return records.filter((item) => item.userId === userId)
}

app.get('/api/writings/saves', async (req, res) => {
  try {
    const { userId } = req.query
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: '缺少 userId' })
    }
    const records = await readRecords(SAVES_FILE)
    const list = filterByUser(records, userId).sort((a, b) => b.time.localeCompare(a.time))
    res.json(list)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/writings/submits', async (req, res) => {
  try {
    const { userId } = req.query
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: '缺少 userId' })
    }
    const records = await readRecords(SUBMITS_FILE)
    const list = filterByUser(records, userId).sort((a, b) => b.time.localeCompare(a.time))
    res.json(list)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/writings/saves/latest', async (req, res) => {
  try {
    const { userId } = req.query
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: '缺少 userId' })
    }
    const records = filterByUser(await readRecords(SAVES_FILE), userId)
    if (records.length === 0) {
      return res.json(null)
    }
    const latest = [...records].sort((a, b) => b.time.localeCompare(a.time))[0]
    res.json(latest)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/writings/saves/:id', async (req, res) => {
  try {
    const { userId } = req.query
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: '缺少 userId' })
    }
    const records = await readRecords(SAVES_FILE)
    const record = records.find(
      (item) => item.id === req.params.id && item.userId === userId,
    )
    if (!record) {
      return res.status(404).json({ message: '记录不存在' })
    }
    res.json(record)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/writings/submits/:id', async (req, res) => {
  try {
    const { userId } = req.query
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: '缺少 userId' })
    }
    const records = await readRecords(SUBMITS_FILE)
    const record = records.find(
      (item) => item.id === req.params.id && item.userId === userId,
    )
    if (!record) {
      return res.status(404).json({ message: '记录不存在' })
    }
    res.json(record)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.post('/api/writings/save', async (req, res) => {
  try {
    const { userId, id, topicId, topic, topicType, title, content } = req.body
    if (!userId || !topic || title === undefined || content === undefined) {
      return res.status(400).json({ message: '缺少必要字段' })
    }

    const records = await readRecords(SAVES_FILE)
    const now = new Date().toISOString()
    const existingIndex = id ? records.findIndex((item) => item.id === id && item.userId === userId) : -1

    const record = {
      id: id ?? randomUUID(),
      userId,
      topicId,
      topic,
      topicType,
      title,
      content,
      time: now,
    }

    if (existingIndex >= 0) {
      records[existingIndex] = record
    } else {
      records.push(record)
    }

    await writeRecords(SAVES_FILE, records)
    res.json(record)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.post('/api/writings/submit', async (req, res) => {
  try {
    const { userId, id, topicId, topic, topicType, title, content } = req.body
    if (!userId || !topic || title === undefined || content === undefined) {
      return res.status(400).json({ message: '缺少必要字段' })
    }

    const now = new Date().toISOString()
    const record = {
      id: randomUUID(),
      userId,
      topicId,
      topic,
      topicType,
      title,
      content,
      time: now,
    }

    const submits = await readRecords(SUBMITS_FILE)
    submits.push(record)
    await writeRecords(SUBMITS_FILE, submits)

    if (id) {
      const saves = await readRecords(SAVES_FILE)
      const filtered = saves.filter((item) => !(item.id === id && item.userId === userId))
      await writeRecords(SAVES_FILE, filtered)
    }

    res.json(record)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

await ensureDataFiles()
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`)
})
