// public/app.js

// Helper function to call backend API
async function api(path, method = 'GET', body) {
  const resp = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  return resp.json();
}

// REGISTER
document.getElementById('btnRegister').onclick = async () => {
  const name = document.getElementById('reg_name').value;
  const email = document.getElementById('reg_email').value;
  const password = document.getElementById('reg_pass').value;

  const r = await api('/register', 'POST', { name, email, password });
  if (r.error) return alert(r.error);
  afterLogin(r.user);
};

// LOGIN
document.getElementById('btnLogin').onclick = async () => {
  const email = document.getElementById('login_email').value;
  const password = document.getElementById('login_pass').value;

  const r = await api('/login', 'POST', { email, password });
  if (r.error) return alert(r.error);
  afterLogin(r.user);
};

// LOGOUT
document.getElementById('btnLogout').onclick = async () => {
  await api('/logout', 'POST');
  location.reload();
};

// ADD INCOME
document.getElementById('btnAddIncome').onclick = async () => {
  const source = document.getElementById('income_source').value;
  const amount = parseFloat(document.getElementById('income_amount').value);
  const date = document.getElementById('income_date').value;

  const r = await api('/income', 'POST', { source, amount, date });
  if (r.error) return alert(r.error);
  alert('Income added ✅');
  refreshSummary(); // immediately refresh summary and transactions
};

// ADD EXPENSE
document.getElementById('btnAddExpense').onclick = async () => {
  const category = document.getElementById('expense_cat').value;
  const amount = parseFloat(document.getElementById('expense_amount').value);
  const date = document.getElementById('expense_date').value;
  const note = document.getElementById('expense_note').value;

  const r = await api('/expense', 'POST', { category, amount, date, note });
  if (r.error) return alert(r.error);
  alert('Expense added ✅');
  refreshSummary(); // immediately refresh summary and transactions
};

// AFTER LOGIN
function afterLogin(user) {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('userName').innerText = user.name || user.email;
  refreshSummary();
}

// REFRESH SUMMARY AND TRANSACTIONS
async function refreshSummary() {
  const s = await api('/summary');
  if (s.error) return console.error(s.error);

  // Summary
  document.getElementById('totalIncome').innerText = parseFloat(s.total_income).toFixed(2);
  document.getElementById('totalExpense').innerText = parseFloat(s.total_expense).toFixed(2);


  const ulCat = document.getElementById('byCategory');
  ulCat.innerHTML = '';
  (s.by_category || []).forEach(c => {
    const li = document.createElement('li');
    li.innerText = `${c.category}: ${parseFloat(c.total).toFixed(2)}`;
    ulCat.appendChild(li);
  });

  // Transactions
  const tx = await api('/transactions');
  const txList = document.getElementById('txList');
  txList.innerHTML = '';
  tx.forEach(t => {
    const li = document.createElement('li');
    li.className = t.type;
    li.innerText = `[${t.date}] ${t.type.toUpperCase()} - ${t.description} : ${parseFloat(t.amount).toFixed(2)}`;
    txList.appendChild(li);
  });
}
