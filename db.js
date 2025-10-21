// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbFile = path.join(__dirname, 'finance.db');
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT
  );`);

  // Income table
  db.run(`CREATE TABLE IF NOT EXISTS Income (
    income_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    source TEXT,
    amount REAL,
    date TEXT,
    FOREIGN KEY(user_id) REFERENCES Users(user_id)
  );`);

  // Expense table
  db.run(`CREATE TABLE IF NOT EXISTS Expense (
    expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category TEXT,
    amount REAL,
    date TEXT,
    note TEXT,
    FOREIGN KEY(user_id) REFERENCES Users(user_id)
  );`);

  // Budget table
  db.run(`CREATE TABLE IF NOT EXISTS Budget (
    budget_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category TEXT,
    limit_amount REAL,
    month TEXT,
    FOREIGN KEY(user_id) REFERENCES Users(user_id)
  );`);
});

module.exports = db;
