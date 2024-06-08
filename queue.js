const express = require('express')
const bodyParser = require('body-parser')
const sqlite3 = require('sqlite3').verbose()
const redis = require('redis')
const session = require('express-session')
const RedisStore = require('connect-redis').default
const Queue = require('bull')
const nodemailer = require('nodemailer')

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

// การตั้งค่า session middleware
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // secure: true สำหรับ production ที่ใช้ https
  })
)

// สร้างคิวงานสำหรับการประมวลผล background jobs
const emailQueue = new Queue('emailQueue', {
  redis: { url: 'redis://localhost:6379' },
})

// ตัวอย่างการประมวลผลงานในคิว
emailQueue.process(async (job) => {
  console.log('Processing email job:', job.id, job.data)

  try {
    // ตั้งค่า nodemailer transporter
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password',
      },
    })

    // ข้อมูลอีเมล
    let mailOptions = {
      from: '"Your App" <your-email@gmail.com>',
      to: job.data.email,
      subject: 'Welcome to Our Service',
      text: `Hello ${job.data.username}, welcome to our service!`,
      html: `<b>Hello ${job.data.username}</b>, <br> Welcome to our service!`,
    }

    // ส่งอีเมล
    let info = await transporter.sendMail(mailOptions)
    console.log('Email sent: %s', info.messageId)
  } catch (error) {
    console.error('Error processing email job:', error)
    // เพิ่มการจัดการข้อผิดพลาดเพิ่มเติมถ้าจำเป็น เช่น การบันทึกลงในฐานข้อมูลหรือแจ้งเตือนผู้ดูแลระบบ
  }
})

// สร้างตารางสำหรับ users ถ้ายังไม่มี
db.serialize(() => {
  db.run(
    'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, email TEXT)'
  )
})

// สร้างผู้ใช้ใหม่และเพิ่มงานเข้าไปในคิวอีเมล
app.post('/register', async (req, res) => {
  const { username, email } = req.body
  try {
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, email) VALUES (?, ?)',
        [username, email],
        function (err) {
          if (err) reject(err)
          resolve(this.lastID)
        }
      )
    })
    const lastID = await new Promise((resolve, reject) => {
      db.get('SELECT last_insert_rowid() as id', (err, row) => {
        if (err) reject(err)
        resolve(row.id)
      })
    })

    // เพิ่มงานเข้าไปในคิวอีเมล
    await emailQueue.add({ username, email })

    res.json({ id: lastID, username, email })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// ตรวจสอบการ login
app.post('/login', (req, res) => {
  const { username } = req.body
  if (username) {
    req.session.username = username
    res.json({ message: 'Logged in' })
  } else {
    res.status(400).json({ error: 'Username is required' })
  }
})

// ตรวจสอบการ logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' })
    }
    res.json({ message: 'Logged out' })
  })
})

// ตรวจสอบสถานะการ login
app.get('/status', (req, res) => {
  if (req.session.username) {
    res.json({ loggedIn: true, username: req.session.username })
  } else {
    res.json({ loggedIn: false })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
