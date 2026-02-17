const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const { param } = require('express/lib/router')
const PORT = process.env.PORT || 8000
const PrismaClient = require('@prisma/client').PrismaClient
const prisma = new PrismaClient()

const app = express()
app.use(cors())
app.use(bodyParser.json())

const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) return res.status(401).json({ error: 'Auth token required' })

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' })
    req.user = user
    next()
  })
}

app.get('/', (req, res) => {
  res.json({ message: 'Basic distributed logging server' })
})

async function saveLog(log, teamId) {
  let request_id
  if (isNaN(parseInt(log.request_id))) {
    request_id = null
  } else {
    request_id = parseInt(log.request_id)
  }
  return prisma.log.create({
    data: {
      message: log.message,
      logLevel: log.level,
      timestamp: log.timestamp,
      machineId: log.machine_id,
      requestId: request_id,
      teamId: teamId || 1
    }
  })
}

app.post('/log', async (req, res) => {
  // Logs can be public OR authenticated
  // If authenticated, we attach the teamId
  let teamId = null
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      teamId = decoded.teamId
    } catch (e) {
      // ignore invalid token for posting logs, just use default team
    }
  }

  await saveLog(req.body, teamId)
  res.status(201).json(req.body)
})

app.get('/logs/search/all', authenticateToken, async (req, res) => {
  // Returns all the log messages for the user's team
  const logs = await prisma.log.findMany({
    where: { teamId: req.user.teamId }
  })
  res.json(logs)
})

app.get('/logs/search/machine_id', authenticateToken, async (req, res) => {
  if (!req.query.machine_id) {
    res.status(400).json({ message: 'machine_id is required' })
    return
  }
  const logs = await prisma.log.findMany({
    where: {
      machineId: req.query.machine_id,
      teamId: req.user.teamId
    }
  })
  res.json(logs)
})

app.get('/logs/search/time_period', authenticateToken, async (req, res) => {
  if (!valid_date_range(req)) {
    res.status(400).json({ message: 'from and to must both be present or neither be present' }).send()
    return
  }
  let where_clause = { teamId: req.user.teamId }
  if (req.query.from !== undefined) {
    where_clause.timestamp = {
      gte: new Date(req.query.from),
      lte: new Date(req.query.to)
    }
  }
  const logs = await prisma.log.findMany({
    where: where_clause
  })
  res.json(logs)
})

app.get('/logs/search/message', authenticateToken, async (req, res) => {
  const logs = await prisma.log.findMany({
    where: {
      message: {
        contains: req.query.message,
        mode: 'insensitive'
      },
      teamId: req.user.teamId
    }
  })
  res.json(logs)
})

app.get('/logs/search/request_id', authenticateToken, async (req, res) => {
  if (!req.query.request_id) {
    res.status(400).json({ message: 'request_id is required' })
    return
  }
  const logs = await prisma.log.findMany({
    where: {
      requestId: parseInt(req.query.request_id),
      teamId: req.user.teamId
    }
  })
  res.json(logs)
})

app.get('/logs/search/level', authenticateToken, async (req, res) => {
  // TODO: should make this be able to search for multiple log levels
  if (!req.query.level) {
    res.status(400).json({ message: 'level is required' })
  }
  const logs = await prisma.log.findMany({
    where: {
      logLevel: req.query.level,
      teamId: req.user.teamId
    }
  })
  res.json(logs)
})

app.get('/logs/search', authenticateToken, async (req, res) => {
  // generic search that can receive multiple parameters and parse them appropriately
  let where_clause = { teamId: req.user.teamId }
  if (valid_date_range(req)) {
    if (req.query.from !== undefined) {
      where_clause.timestamp = {
        gte: new Date(req.query.from),
        lte: new Date(req.query.to)
      }
    }
  } else {
    res.status(400).json({ message: 'from and to must both be present or neither be present' }).send()
    return
  }
  if (req.query.machine_id) {
    where_clause.machineId = req.query.machine_id
  }
  if (req.query.level) {
    where_clause.logLevel = req.query.level
  }
  if (req.query.message) {
    where_clause.message = {
      contains: req.query.message,
      mode: 'insensitive'
    }
  }
  if (req.query.request_id) {
    where_clause.requestId = parseInt(req.query.request_id)
  }

  const logs = await prisma.log.findMany({
    where: where_clause
  })
  res.json(logs)
}
)

function valid_date_range(req) {
  const from_undefined = (req.query.from === undefined)
  const to_undefined = (req.query.to === undefined)
  return from_undefined === to_undefined
}

server = app.listen(PORT, () => {
  console.log(`log collection server running at http://localhost:${PORT}`)
})
module.exports = { server: server, app: app, prisma: prisma }
