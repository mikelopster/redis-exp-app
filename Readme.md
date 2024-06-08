## Command Example

curl -X POST http://localhost:3000/authors -H "Content-Type: application/json" -d '{"name": "J.K. Rowling"}'

curl -X POST http://localhost:3000/books -H "Content-Type: application/json" -d '{"title": "New Book", "author_id": 1}'

curl -X GET http://localhost:3000/books/1

## ตัวอย่างที่ 1 - Session

curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"username": "user1"}'
curl -X GET http://localhost:3000/status
curl -X POST http://localhost:3000/logout 

## ตัวอย่างที่ 2 - Register + Queue
curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d '{"username": "user1", "email": "tanit.pani@gmail.com"}'

