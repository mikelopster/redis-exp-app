## Command Example

curl -X POST http://localhost:3000/authors -H "Content-Type: application/json" -d '{"name": "J.K. Rowling"}'

curl -X POST http://localhost:3000/books -H "Content-Type: application/json" -d '{"title": "New Book", "author_id": 1}'

curl -X GET http://localhost:3000/books/1
