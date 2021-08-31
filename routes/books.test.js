process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let isbn;
beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url, author, language, pages, publisher, title, year)
    VALUES (
      '1234567890',
      'http://amazon.com/yoink',
      'Me',
      'English',
      30,
      'Thru the Roof Comix',
      'The Very Stupid Snowboarder',
      2004)
    RETURNING isbn`);
  isbn = result.rows[0].isbn
})

describe('POST /books', () => {
  test("Creates a new book", async () => {
    const resp = await request(app).post('/books')
      .send({
        isbn: '6798547893',
        amazon_url: 'http://sfgaeof.gov',
        author: 'Mr. Expert',
        language: 'janglish',
        pages: 5000,
        publisher: 'The Universe',
        title: "Some cool stuff",
        year: 2021
      })
    
    expect(resp.statusCode).toBe(201)
    expect(resp.body.book).toHaveProperty("isbn")
  })
  test('Respond with 400 when required info is missing', async () => {
    const resp = await request(app).post('/books')
      .send({language: 'English'})
    
    expect(resp.statusCode).toBe(400)
  })
})

describe('GET /books', () => {
  test('Get all books', async () => {
    const resp = await request(app).get('/books')
    const books = resp.body.books

    expect(resp.statusCode).toBe(200)
    expect(books[0]).toHaveProperty("isbn")
  })
})

describe('GET /books/:isbn', () => {
  test('Get a single book', async () => {
    const resp = await request(app).get(`/books/${isbn}`)
    const book = resp.body.book

    expect(resp.statusCode).toBe(200)
    expect(book).toHaveProperty("isbn")
    expect(book.isbn).toBe(isbn)
  })
  test('Respond with 404 when invalid isbn received', async () => {
    const resp = await request(app).get('/books/99999999999999999')
    
    expect(resp.statusCode).toBe(404)
  })
})

describe('PUT /books/:isbn', () => {
  test("Updates a book", async () => {
    const resp = await request(app).put(`/books/${isbn}`)
      .send({
        author: 'You',
        language: 'English',
        pages: 30,
        title: 'The Story of the Averagely Intelligent Snowboarder',
        year: 2005
      })

    expect(resp.statusCode).toBe(200)
    expect(resp.body.book.title).toEqual('The Story of the Averagely Intelligent Snowboarder')
  })
  test('Respond with 404 when invalid isbn received', async () => {
    const resp = await request(app).put('/books/99999999999999999')
      .send({
        author: 'You',
        language: 'English',
        pages: 30,
        title: 'The Story of the Averagely Intelligent Snowboarder',
        year: 2005
      })
    
    expect(resp.statusCode).toBe(404)
  })
})

describe('DELETE /books/:isbn', () => {
  test('Deletes a book', async () => {
    const resp = await request(app).delete(`/books/${isbn}`)

    expect(resp.statusCode).toBe(200)
    expect(resp.body).toEqual({"message": "Book deleted"})
  })
  test('Respond with 404 when invalid isbn received', async () => {
    const resp = await request(app).delete(`/books/2345678`)

    expect(resp.statusCode).toBe(404)
  })
})

afterEach(async () => {
  await db.query("DELETE FROM books");
});

afterAll(async () => {
  await db.end();
});
