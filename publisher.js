const redis = require('redis')

const pubClient = redis.createClient({
  url: 'redis://localhost:6379',
})

pubClient.on('error', (err) => {
  console.error('Redis error:', err)
})
;(async () => {
  await pubClient.connect()

  // Publish a message to the 'notifications' channel every 5 seconds
  setInterval(async () => {
    const message = JSON.stringify({
      event: 'new_notification',
      timestamp: new Date(),
    })
    await pubClient.publish('notifications', message)
    console.log('Message published:', message)
  }, 5000)
})()
