# Redis use case - guide

ตัวอย่างการ implement redis 4 use case
1. Session (app.js)
2. Register + Queue (queue.js)
3. Realtime (socket.js)
4. Publisher / Subscriber (publisher.js, subscriber.js)

สามารถ start project ได้ด้วย command

```shell
npm install
node <ชื่อไฟล์ที่ต้องการทดลอง>
```

สำหรับ redis ใน git นี้ทำการลงด้วย `docker-compose.yml` สามารถดำเนินการ run redis ด้วยคำสั่งของ docker-compose ได้เลย

```shell
docker-compose up -d --build
```

โดย code ใน github นี้เป็นส่วนหนึ่งของ video นี้ สามารถดูเนื้อหาของ code นี้ฉบับเต็มที่ video ได้

[![redis-use-case](https://img.youtube.com/vi/hpy8rMuQsfQ/0.jpg)](https://youtu.be/hpy8rMuQsfQ)
