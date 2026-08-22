// If already signed in, skip straight to app
(function(){
  if (Store.currentUser()) window.location.href = 'app.html';
})();

renderDayArc(document.getElementById('dayarc-hero'), { width: 460, height: 190 });
setInterval(() => renderDayArc(document.getElementById('dayarc-hero'), { width: 460, height: 190 }), 60000);

document.getElementById('stat-approvals').textContent =
  Store.db.leaves.filter(l => l.status === 'pending').length;
document.getElementById('stat-employees').textContent = Store.employees().length;

/* ---------- Tab switching ---------- */
const tabSignin = document.getElementById('tab-signin');
const tabSignup = document.getElementById('tab-signup');
const panelSignin = document.getElementById('panel-signin');
const panelSignup = document.getElementById('panel-signup');

tabSignin.addEventListener('click', () => {
  tabSignin.classList.add('active'); tabSignup.classList.remove('active');
  panelSignin.style.display = ''; panelSignup.style.display = 'none';
  panelSignin.classList.remove('form-fade'); void panelSignin.offsetWidth; panelSignin.classList.add('form-fade');
});
tabSignup.addEventListener('click', () => {
  tabSignup.classList.add('active'); tabSignin.classList.remove('active');
  panelSignup.style.display = ''; panelSignin.style.display = 'none';
  panelSignup.classList.remove('form-fade'); void panelSignup.offsetWidth; panelSignup.classList.add('form-fade');
});

/* ---------- Role toggle visuals ---------- */
document.querySelectorAll('.role-toggle input').forEach(inp => {
  inp.addEventListener('change', () => {
    document.querySelectorAll('.role-toggle .opt').forEach(o => o.classList.remove('active'));
    inp.closest('.opt').classList.add('active');
  });
});

/* ---------- Sign in ---------- */
document.getElementById('form-signin').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('si-email').value.trim();
  const password = document.getElementById('si-password').value;
  const errEl = document.getElementById('si-error');
  const user = Store.findUserByEmail(email);

  if (!user || user.password !== password) {
    errEl.style.display = 'block';
    document.getElementById('si-password-field').classList.add('has-error');
    document.getElementById('si-password').focus();
    return;
  }
  errEl.style.display = 'none';
  Store.setSession(user.id);
  Store.addActivity(user.id, 'signed in', 'in');
  toast(`Welcome back, ${user.name.split(' ')[0]}.`);
  setTimeout(() => window.location.href = 'app.html', 500);
});

/* ---------- Sign up password rule live-check ---------- */
const suPassword = document.getElementById('su-password');
suPassword.addEventListener('input', () => {
  const v = suPassword.value;
  toggleRule('rule-len', v.length >= 8);
  toggleRule('rule-upper', /[A-Z]/.test(v));
  toggleRule('rule-num', /[0-9]/.test(v));
  toggleRule('rule-special', /[^A-Za-z0-9]/.test(v));
});
function toggleRule(id, ok) { document.getElementById(id).classList.toggle('ok', ok); }

/* ---------- Sign up submit ---------- */
document.getElementById('form-signup').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('su-name').value.trim();
  const empId = document.getElementById('su-empid').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const password = document.getElementById('su-password').value;
  const role = document.querySelector('input[name="role"]:checked').value;
  const emailErr = document.getElementById('su-email-error');

  if (Store.findUserByEmail(email)) {
    emailErr.style.display = 'block';
    document.getElementById('su-email-field').classList.add('has-error');
    return;
  }
  emailErr.style.display = 'none';

  const strong = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  if (!strong) { toast('Password must meet all requirements shown.', 'error'); return; }

  const colors = ['#4C4FF0','#16A3A0','#FF5470','#E8961A','#7A5CF0','#1CA6C9'];
  const newUser = {
    id: uid('u'), employeeId: empId || uid('DF').toUpperCase(), name, email, password, role,
    jobTitle: role === 'admin' ? 'HR Officer' : 'New Employee', department: role === 'admin' ? 'People Operations' : 'General',
    phone: '', address: '', joinDate: todayStr(), avatarColor: colors[Math.floor(Math.random()*colors.length)],
    photo: null, verified: false,
    salary: { basic: 45000, hra: 18000, allowances: 5000, deductions: 4000 },
  };
  Store.addUser(newUser);
  Store.addActivity(newUser.id, 'created an account', 'profile');

  toast('Account created — verification email sent (simulated).');
  setTimeout(() => {
    toast(`Email verified. Signing you in…`);
    Store.setSession(newUser.id);
    setTimeout(() => window.location.href = 'app.html', 700);
  }, 1200);
});
