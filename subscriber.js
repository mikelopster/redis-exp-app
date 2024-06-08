const redis = require('redis')

const subClient = redis.createClient({
  url: 'redis://localhost:6379',
})

subClient.on('error', (err) => {
  console.error('Redis error:', err)
})

;(async () => {
  await subClient.connect()

  // Subscribe to the 'notifications' channel
  await subClient.subscribe('notifications', (message) => {
    const data = JSON.parse(message)
    console.log('Message received:', data)
  })
})()
