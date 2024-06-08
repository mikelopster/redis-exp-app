const express = require('express')
const bodyParser = require('body-parser')
const sqlite3 = require('sqlite3').verbose()
const redis = require('redis')

const app = express()
app.use(bodyParser.json())

const db = new sqlite3.Database('database.sqlite')
const redisClient = redis.createClient({
  url: 'redis://localhost:6379',
})

redisClient.on('error', (err) => {
  console.error('Redis error:', err)
})

;(async () => {
  await redisClient.connect()
})()

// สร้างตารางสำหรับ authors และ books ถ้ายังไม่มี
db.serialize(() => {
  db.run(
    'CREATE TABLE IF NOT EXISTS authors (id INTEGER PRIMARY KEY, name TEXT)'
  )
  db.run(
    'CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY, title TEXT, author_id INTEGER, FOREIGN KEY(author_id) REFERENCES authors(id))'
  )
})

// สร้าง author ใหม่
app.post('/authors', async (req, res) => {
  const { name } = req.body
  try {
    await db.run('INSERT INTO authors (name) VALUES (?)', [name])
    const lastID = await new Promise((resolve, reject) => {
      db.get('SELECT last_insert_rowid() as id', (err, row) => {
        if (err) reject(err)
        resolve(row.id)
      })
    })
    res.json({ id: lastID, name })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// รับรายชื่อ authors ทั้งหมด
app.get('/authors', async (req, res) => {
  try {
    const rows = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM authors', [], (err, rows) => {
        if (err) reject(err)
        resolve(rows)
      })
    })
    res.json({ authors: rows })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// รับข้อมูล author โดย id
app.get('/authors/:id', async (req, res) => {
  const { id } = req.params
  try {
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM authors WHERE id = ?', [id], (err, row) => {
        if (err) reject(err)
        resolve(row)
      })
    })
    res.json({ author: row })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// แก้ไขข้อมูล author โดย id
app.put('/authors/:id', async (req, res) => {
  const { id } = req.params
  const { name } = req.body
  try {
    await db.run('UPDATE authors SET name = ? WHERE id = ?', [name, id])
    res.json({ message: 'Author updated' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// ลบ author โดย id
app.delete('/authors/:id', async (req, res) => {
  const { id } = req.params
  try {
    await db.run('DELETE FROM authors WHERE id = ?', [id])
    res.json({ message: 'Author deleted' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// สร้าง book ใหม่
app.post('/books', async (req, res) => {
  const { title, author_id } = req.body
  try {
    await db.run('INSERT INTO books (title, author_id) VALUES (?, ?)', [
      title,
      author_id,
    ])
    const lastID = await new Promise((resolve, reject) => {
      db.get('SELECT last_insert_rowid() as id', (err, row) => {
        if (err) reject(err)
        resolve(row.id)
      })
    })
    await redisClient.del('books') // Clear the cache
    res.json({ id: lastID, title, author_id })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// รับรายชื่อ books ทั้งหมด
app.get('/books', async (req, res) => {
  try {
    const booksCache = await redisClient.get('books')
    if (booksCache) {
      res.json({ books: JSON.parse(booksCache) })
    } else {
      const rows = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM books', [], (err, rows) => {
          if (err) reject(err)
          resolve(rows)
        })
      })
      await redisClient.setEx('books', 3600, JSON.stringify(rows)) // Cache for 1 hour
      res.json({ books: rows })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// รับข้อมูล book โดย id
app.get('/books/:id', async (req, res) => {
  const { id } = req.params
  try {
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM books WHERE id = ?', [id], (err, row) => {
        if (err) reject(err)
        resolve(row)
      })
    })
    res.json({ book: row })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// แก้ไขข้อมูล book โดย id
app.put('/books/:id', async (req, res) => {
  const { id } = req.params
  const { title, author_id } = req.body
  try {
    await db.run('UPDATE books SET title = ?, author_id = ? WHERE id = ?', [
      title,
      author_id,
      id,
    ])
    await redisClient.del('books') // Clear the cache
    res.json({ message: 'Book updated' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// ลบ book โดย id
app.delete('/books/:id', async (req, res) => {
  const { id } = req.params
  try {
    await db.run('DELETE FROM books WHERE id = ?', [id])
    await redisClient.del('books') // Clear the cache
    res.json({ message: 'Book deleted' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})