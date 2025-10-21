// server.js
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql2');

const app = express();

// ---------- MySQL connection ----------
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'ammu@1234',   // <-- replace with your MySQL password
  database: 'finance_tracker'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('✅ Connected to MySQL database');
  }
});

// ---------- Middleware ----------
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'change_this_secret',
  resave: false,
  saveUninitialized: false
}));

// ---------- Auth middleware ----------
function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// ---------- Routes ----------

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hash = await bcrypt.hash(password, 10);
    db.query(
      `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
      [name, email, hash],
      function(err, result) {
        if (err) return res.status(400).json({ error: 'Email already exists' });
        req.session.user = { user_id: result.insertId, name, email };
        res.json({ message: 'Registered', user: req.session.user });
      }
    );
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.query(
    `SELECT * FROM users WHERE email = ?`,
    [email],
    async (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!rows.length) return res.status(400).json({ error: 'Invalid credentials' });
      const row = rows[0];
      const match = await bcrypt.compare(password, row.password);
      if (!match) return res.status(400).json({ error: 'Invalid credentials' });
      req.session.user = { user_id: row.user_id, name: row.name, email: row.email };
      res.json({ message: 'Logged in', user: req.session.user });
    }
  );
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out' }));
});

// Add income
app.post('/api/income', requireLogin, (req, res) => {
  const { source, amount, date } = req.body;
  const user_id = req.session.user.user_id;
  db.query(
    `INSERT INTO income (user_id, source, amount, date) VALUES (?, ?, ?, ?)`,
    [user_id, source, amount, date || new Date().toISOString().slice(0,10)],
    function(err, result) {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ message: 'Income added', income_id: result.insertId });
    }
  );
});

// Add expense
app.post('/api/expense', requireLogin, (req, res) => {
  const { category, amount, date, note } = req.body;
  const user_id = req.session.user.user_id;
  db.query(
    `INSERT INTO expense (user_id, category, amount, date, note) VALUES (?, ?, ?, ?, ?)`,
    [user_id, category, amount, date || new Date().toISOString().slice(0,10), note],
    function(err, result) {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ message: 'Expense added', expense_id: result.insertId });
    }
  );
});

// ---------- Summary route ----------
app.get('/api/summary', requireLogin, (req, res) => {
  const user_id = req.session.user.user_id;
  const summary = {};

  db.query(
    `SELECT IFNULL(SUM(amount),0) AS total_income FROM income WHERE user_id = ?`,
    [user_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      summary.total_income = rows[0].total_income;

      db.query(
        `SELECT IFNULL(SUM(amount),0) AS total_expense FROM expense WHERE user_id = ?`,
        [user_id],
        (err2, rows2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          summary.total_expense = rows2[0].total_expense;

          db.query(
            `SELECT category, IFNULL(SUM(amount),0) AS total 
             FROM expense 
             WHERE user_id = ? 
             GROUP BY category`,
            [user_id],
            (err3, rows3) => {
              if (err3) return res.status(500).json({ error: err3.message });
              summary.by_category = rows3;
              res.json(summary);
            }
          );
        }
      );
    }
  );
});

// ---------- Transactions ----------
app.get('/api/transactions', requireLogin, (req, res) => {
  const user_id = req.session.user.user_id;
  db.query(
    `SELECT 'income' AS type, income_id AS id, source AS description, amount, date
     FROM income WHERE user_id = ?
     UNION ALL
     SELECT 'expense' AS type, expense_id AS id, category AS description, amount, date
     FROM expense WHERE user_id = ?
     ORDER BY date DESC
     LIMIT 50`,
    [user_id, user_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Serve frontend
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------- Start server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
