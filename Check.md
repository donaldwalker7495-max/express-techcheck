## Run the server:
```bash
npm run dev
```

## Problem: 1
### Create products:
```bash
curl -X POST http://localhost:3000/api/v1/products -H "Content-Type: application/json" -d '{"name":"Laptop","description":"14-inch","price":1299.99}'
```
```bash
curl -X POST http://localhost:3000/api/v1/products -H "Content-Type: application/json" -d '{"name":"Phone","description":"6-inch","price":499.99}'
```
### Retrieve all products:
```bash
curl http://localhost:3000/api/v1/products
```
### Retrieve a specific product by its ID:
```bash
curl http://localhost:3000/api/v1/products/1
```
### Update a product’s information:
```bash
curl -X PUT http://localhost:3000/api/v1/products/1 -H "Content-Type: application/json" -d '{"name":"Laptop","description":"14-inch","price":1199.99}'
```
### Delete a product by its ID:
```bash
curl -X DELETE http://localhost:3000/api/v1/products/1
```
### Input validation check:
After creating a valid product (use the above curl command), try to update a product with invalid data (e.g., missing name, negative price, empty field)
```bash
curl -X PUT http://localhost:3000/api/v1/products/1 -H "Content-Type: application/json" -d '{}'
```

## Problem: 2
### Register the user:
```bash
$ curl -X POST http://localhost:3000/api/v1/auth/register -H "Content-Type: application/json" -d '{"username":"alice","password":"secret123"}'
```
### Login the user:
```bash
$ curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"username":"alice","password":"secret123"}'
```
### Protected route:
```bash
$ curl -X POST http://localhost:3000/api/v1/auth/protected -H "Authorization: Bearer <token>"
```

### Rate limit check:
To check the rate limi try to login with wrong password more than 5 times in 10 minutes
```bash
$ curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"username":"alice","password":"wrong"}'
``` 

## Problem: 3
### Create a product:
```bash
$ curl -X POST http://localhost:3000/api/v1/products -H "Content-Type: application/json" -d '{"name":"Phone","description":"6-inch","price":499.99}'
```
### Search
```bash
$ curl "http://localhost:3000/api/v1/products/search?q=Phone"
```
### To search in specific page with limit
```bash
$ curl "http://localhost:3000/api/v1/products/search?q=Phone&page=1&limit=10"
```
