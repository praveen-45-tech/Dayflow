/* ============================================================
   DAYFLOW — App shell logic
   ============================================================ */
const user = Store.currentUser();
if (!user) window.location.href = 'index.html';
const isAdmin = user.role === 'admin';

// admin can "view as" an employee in attendance/leave/payroll contexts
let viewingId = user.id;

document.getElementById('date-chip').textContent = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

/* ---------- Sidebar ---------- */
function avatarNode(u, size) {
  const style = u.photo ? `background-image:url(${u.photo})` : `background:${u.avatarColor}`;
  const content = u.photo ? '' : initials(u.name);
  return `<div class="avatar" style="${style}${size?`;width:${size}px;height:${size}px`:''}">${content}</div>`;
}

document.getElementById('side-avatar').outerHTML = avatarNode(user).replace('class="avatar"', 'class="avatar" id="side-avatar"');
document.getElementById('side-name').textContent = user.name;
document.getElementById('side-role').textContent = isAdmin ? 'HR Officer' : user.jobTitle;

const NAV_EMPLOYEE = [
  { id:'overview', label:'Overview', icon:'overview' },
  { id:'profile', label:'My Profile', icon:'profile' },
  { id:'attendance', label:'Attendance', icon:'attendance' },
  { id:'leave', label:'Leave', icon:'leave' },
  { id:'payroll', label:'Payroll', icon:'payroll' },
];
const NAV_ADMIN = [
  { id:'overview', label:'Overview', icon:'overview' },
  { id:'team', label:'Employees', icon:'team' },
  { id:'attendance', label:'Attendance', icon:'attendance' },
  { id:'leave', label:'Leave Approvals', icon:'leave', pip: () => Store.db.leaves.filter(l=>l.status==='pending').length },
  { id:'payroll', label:'Payroll', icon:'payroll' },
  { id:'profile', label:'My Profile', icon:'profile' },
];
const NAV = isAdmin ? NAV_ADMIN : NAV_EMPLOYEE;

function renderNav(active) {
  document.getElementById('side-nav').innerHTML = NAV.map(item => {
    const pip = item.pip ? item.pip() : 0;
    return `<a href="#${item.id}" data-route="${item.id}" class="${active===item.id?'active':''}">
      ${ICONS[item.icon]}<span class="side-label">${item.label}</span>
      ${pip ? `<span class="pip">${pip}</span>` : ''}
    </a>`;
  }).join('');
}

document.getElementById('logout-btn').addEventListener('click', () => {
  Store.clearSession();
  window.location.href = 'index.html';
});

/* ---------- Router ---------- */
const TITLES = { overview:'Overview', profile:'My Profile', attendance:'Attendance', leave: isAdmin ? 'Leave Approvals' : 'Leave', payroll:'Payroll', team:'Employees' };
function navigate(route) {
  if (!TITLES[route]) route = 'overview';
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + route).classList.add('active');
  document.getElementById('topbar-title').textContent = TITLES[route];
  renderNav(route);
  RENDERERS[route]();
  window.scrollTo({top:0, behavior:'smooth'});
}
window.addEventListener('hashchange', () => navigate(location.hash.slice(1)));
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-route]');
  if (a) { e.preventDefault(); location.hash = a.dataset.route; }
});

/* ---------- Modal helper ---------- */
function openModal(html) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-backdrop" id="mb"><div class="modal">${html}</div></div>`;
  root.querySelector('#mb').addEventListener('click', (e) => { if (e.target.id === 'mb') closeModal(); });
}
function closeModal() { document.getElementById('modal-root').innerHTML = ''; }

/* ============================================================
   OVERVIEW
   ============================================================ */
function renderOverview() {
  const el = document.getElementById('section-overview');
  const myAttendance = Store.attendanceFor(user.id);
  const presentDays = myAttendance.filter(a => a.status === 'present').length;
  const myLeaves = Store.leavesFor(user.id);
  const pendingLeaves = Store.db.leaves.filter(l => l.status === 'pending');
  const todayRec = Store.attendanceOn(user.id, todayStr());

  const quickCardsEmployee = `
    <div class="grid grid-4 stagger" style="margin-bottom:28px;">
      <div class="quick-card qc-1" data-route="profile"><div class="qc-icon">${ICONS.profile}</div><h4>My Profile</h4><p>View & edit your details</p></div>
      <div class="quick-card qc-2" data-route="attendance"><div class="qc-icon">${ICONS.attendance}</div><h4>Attendance</h4><p>Check in & track your days</p></div>
      <div class="quick-card qc-3" data-route="leave"><div class="qc-icon">${ICONS.leave}</div><h4>Leave Requests</h4><p>Apply & check status</p></div>
      <div class="quick-card qc-4" onclick="Store.clearSession();window.location.href='index.html'"><div class="qc-icon">${ICONS.arrow}</div><h4>Logout</h4><p>Sign out of Dayflow</p></div>
    </div>`;

  const statCardsEmployee = `
    <div class="grid grid-4 stagger" style="margin-bottom:24px;">
      ${statCard('Present days (14d)', presentDays, ICONS.check, 'teal')}
      ${statCard('Leave balance', 18 - myLeaves.filter(l=>l.status==='approved').length*2, ICONS.leave, 'indigo')}
      ${statCard("Today's status", todayRec ? cap(todayRec.status) : 'Not marked', ICONS.clock, 'amber')}
      ${statCard('Pending requests', myLeaves.filter(l=>l.status==='pending').length, ICONS.inbox, 'coral')}
    </div>`;

  const statCardsAdmin = `
    <div class="grid grid-4 stagger" style="margin-bottom:24px;">
      ${statCard('Total employees', Store.employees().length, ICONS.team, 'indigo')}
      ${statCard('Present today', Store.allAttendanceOn(todayStr()).filter(a=>a.status==='present').length, ICONS.check, 'teal')}
      ${statCard('Pending approvals', pendingLeaves.length, ICONS.inbox, 'coral')}
      ${statCard('Payroll this month', money(Store.employees().reduce((s,e)=>s+e.salary.basic+e.salary.hra+e.salary.allowances-e.salary.deductions,0)), ICONS.payroll, 'amber')}
    </div>`;

  el.innerHTML = `
    <div class="card" style="background:linear-gradient(120deg, var(--ink), #1c2350); color:white; margin-bottom:24px; display:flex; align-items:center; gap:32px; flex-wrap:wrap;">
      <div style="flex:1; min-width:220px;">
        <span class="badge badge-amber" style="margin-bottom:12px;">${isAdmin ? 'HR Control Tower' : 'Your Workday'}</span>
        <h2 style="font-size:24px; margin-bottom:8px;">Hey ${user.name.split(' ')[0]}, here's today at a glance.</h2>
        <p style="color:var(--text-on-ink-dim); font-size:14px; max-width:440px;">${isAdmin ? 'Track attendance, review leave requests, and keep payroll accurate — all synced in real time.' : 'Your check-ins, leave balance, and pay are always one click away.'}</p>
      </div>
      <div style="width:340px; max-width:100%;" id="overview-dayarc"></div>
    </div>

    ${isAdmin ? statCardsAdmin : ''}
    ${!isAdmin ? quickCardsEmployee : ''}
    ${!isAdmin ? statCardsEmployee : ''}

    <div class="grid grid-2">
      <div class="card">
        <div class="section-head"><h3>Recent activity</h3></div>
        <div id="activity-feed"></div>
      </div>
      <div class="card">
        <div class="section-head"><h3>${isAdmin ? 'Needs your approval' : 'My recent leave'}</h3><a class="see-all" data-route="leave">View all →</a></div>
        <div id="leave-preview"></div>
      </div>
    </div>
  `;

  renderDayArc(document.getElementById('overview-dayarc'), { width: 340, height: 160 });

  const feed = document.getElementById('activity-feed');
  const acts = Store.recentActivity(6);
  feed.innerHTML = acts.length ? acts.map(a => {
    const u = Store.getUser(a.userId) || { name:'Someone', avatarColor:'#999' };
    const colorMap = { in:'var(--teal)', leave:'var(--amber)', approve:'var(--indigo)', profile:'var(--text-3)' };
    return `<div class="activity-item"><div class="activity-dot" style="background:${colorMap[a.type]||'var(--text-3)'}"></div>
      <div class="txt"><b>${u.name}</b> ${a.text}<div class="time">${a.time}</div></div></div>`;
  }).join('') : emptyState('No recent activity yet.');

  const preview = document.getElementById('leave-preview');
  const list = isAdmin ? pendingLeaves.slice(0,4) : myLeaves.slice(0,4);
  preview.innerHTML = list.length ? list.map(l => leaveRow(l, isAdmin)).join('') : emptyState('Nothing here right now.');
  wireLeaveActions();
}

function statCard(label, val, icon, tone) {
  const bg = { teal:'var(--teal-soft)', indigo:'#EDEEFD', amber:'#FFF3DD', coral:'var(--coral-soft)' }[tone];
  const fg = { teal:'var(--teal)', indigo:'var(--indigo)', amber:'var(--amber-deep)', coral:'var(--coral)' }[tone];
  return `<div class="card stat-card">
    <div class="icon-box" style="background:${bg};color:${fg}">${icon}</div>
    <div class="val countup">${val}</div>
    <div class="lbl">${label}</div>
  </div>`;
}
function emptyState(msg) { return `<div class="empty-state">${ICONS.inbox}<div>${msg}</div></div>`; }
function cap(s) { return s.charAt(0).toUpperCase()+s.slice(1).replace('-',' '); }

/* ============================================================
   PROFILE
   ============================================================ */
function renderProfile() {
  const el = document.getElementById('section-profile');
  const u = user; // profile section always shows own profile
  el.innerHTML = `
    <div class="card profile-hero" style="margin-bottom:24px;">
      ${avatarNode(u, 84)}
      <div style="flex:1;">
        <h2>${u.name}</h2>
        <div class="role-line">${u.jobTitle} · ${u.department}</div>
        <div style="margin-top:10px; display:flex; gap:8px;">
          <span class="badge ${u.role==='admin'?'badge-indigo':'badge-teal'}">${u.role==='admin'?'HR Admin':'Employee'}</span>
          <span class="badge badge-amber">${u.verified ? 'Verified' : 'Pending verification'}</span>
        </div>
      </div>
      <button class="btn btn-ghost" id="edit-profile-btn">${ICONS.edit} Edit profile</button>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="section-head"><h3>Personal details</h3></div>
        ${detailRow('Employee ID', u.employeeId)}
        ${detailRow('Email', u.email)}
        ${detailRow('Phone', u.phone || '—')}
        ${detailRow('Address', u.address || '—')}
        ${detailRow('Joined', new Date(u.joinDate).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}))}
      </div>
      <div class="card">
        <div class="section-head"><h3>Job details</h3></div>
        ${detailRow('Title', u.jobTitle)}
        ${detailRow('Department', u.department)}
        ${detailRow('Reporting role', u.role === 'admin' ? 'Leadership' : 'HR Officer')}
        <div class="section-head" style="margin-top:22px;"><h3>Documents</h3></div>
        <div class="doc-row"><div class="di">${ICONS.doc}</div><div><b style="font-size:13px;">Offer Letter.pdf</b><div style="font-size:11.5px;color:var(--text-3)">Uploaded on joining</div></div></div>
        <div class="doc-row"><div class="di">${ICONS.doc}</div><div><b style="font-size:13px;">ID Proof.pdf</b><div style="font-size:11.5px;color:var(--text-3)">Verified</div></div></div>
      </div>
    </div>
  `;
  document.getElementById('edit-profile-btn').addEventListener('click', () => openEditProfile(u, false));
}
function detailRow(label, val) {
  return `<div style="display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--cloud);font-size:13.8px;">
    <span style="color:var(--text-2)">${label}</span><span style="font-weight:600;">${val}</span></div>`;
}

function openEditProfile(target, adminEditingOther) {
  openModal(`
    <h3>Edit profile ${adminEditingOther ? `— ${target.name}` : ''}</h3>
    <div class="field"><label>Phone</label><input id="ep-phone" value="${target.phone||''}"></div>
    <div class="field"><label>Address</label><input id="ep-address" value="${target.address||''}"></div>
    <div class="field"><label>Photo</label><input id="ep-photo" type="file" accept="image/*"></div>
    ${adminEditingOther ? `
      <div class="field"><label>Job title</label><input id="ep-title" value="${target.jobTitle||''}"></div>
      <div class="field"><label>Department</label><input id="ep-department" value="${target.department||''}"></div>
    ` : ''}
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px;">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-profile-btn">Save changes</button>
    </div>
  `);
  document.getElementById('save-profile-btn').addEventListener('click', () => {
    const patch = { phone: document.getElementById('ep-phone').value, address: document.getElementById('ep-address').value };
    if (adminEditingOther) {
      patch.jobTitle = document.getElementById('ep-title').value;
      patch.department = document.getElementById('ep-department').value;
    }
    const fileInput = document.getElementById('ep-photo');
    const finish = () => {
      Store.updateUser(target.id, patch);
      Store.addActivity(target.id, 'updated profile details', 'profile');
      toast('Profile updated.');
      closeModal();
      if (target.id === user.id) location.reload(); else RENDERERS.team();
    };
    if (fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = () => { patch.photo = reader.result; finish(); };
      reader.readAsDataURL(fileInput.files[0]);
    } else finish();
  });
}

/* ============================================================
   ATTENDANCE
   ============================================================ */
function ringSVG(pct, size, stroke, color, bg) {
  const r = (size - stroke) / 2, c = 2*Math.PI*r, off = c * (1 - pct);
  return `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="${bg}" stroke-width="${stroke}" fill="none"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="${color}" stroke-width="${stroke}" fill="none" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${off}" style="transition:stroke-dashoffset 1s var(--ease)"/></svg>`;
}
const STATUS_COLOR = { present:'var(--teal)', absent:'var(--coral)', 'half-day':'var(--amber)', leave:'var(--indigo)' };

function renderAttendance() {
  const el = document.getElementById('section-attendance');
  if (isAdmin) {
    const emp = Store.employees();
    const activeEmp = Store.getUser(viewingId) || emp[0];
    viewingId = activeEmp.id;
    const todayAll = Store.allAttendanceOn(todayStr());
    el.innerHTML = `
      <div class="grid grid-3" style="margin-bottom:24px;">
        ${statCard('Present today', todayAll.filter(a=>a.status==='present').length, ICONS.check, 'teal')}
        ${statCard('On leave today', todayAll.filter(a=>a.status==='leave').length, ICONS.leave, 'indigo')}
        ${statCard('Absent today', todayAll.filter(a=>a.status==='absent').length, ICONS.ban, 'coral')}
      </div>
      <div class="card" style="margin-bottom:24px;">
        <div class="section-head">
          <h3>Team attendance — ${new Date().toLocaleDateString('en-US',{month:'long', day:'numeric'})}</h3>
        </div>
        <table class="dy-table"><thead><tr><th>Employee</th><th>Status</th><th>Check in</th><th>Check out</th></tr></thead>
        <tbody>${emp.map(e => {
          const rec = Store.attendanceOn(e.id, todayStr());
          return `<tr><td><div class="name-cell">${avatarNode(e,32)}<div><div class="n">${e.name}</div><div class="e">${e.department}</div></div></div></td>
            <td><span class="badge" style="background:${STATUS_COLOR[rec?.status||'absent']}22;color:${STATUS_COLOR[rec?.status||'absent']}"><span class="badge-dot"></span>${cap(rec?.status||'Not marked')}</span></td>
            <td class="mono">${rec?.checkIn||'—'}</td><td class="mono">${rec?.checkOut||'—'}</td></tr>`;
        }).join('')}</tbody></table>
      </div>
      <div class="card">
        <div class="section-head">
          <h3>Individual history</h3>
          <select class="switch-employee-select" id="emp-switch">
            ${emp.map(e => `<option value="${e.id}" ${e.id===activeEmp.id?'selected':''}>${e.name}</option>`).join('')}
          </select>
        </div>
        <div id="week-grid-host"></div>
        <div id="att-history-host" style="margin-top:20px;"></div>
      </div>
    `;
    document.getElementById('emp-switch').addEventListener('change', (e) => { viewingId = e.target.value; renderAttendance(); });
    renderWeekGrid(document.getElementById('week-grid-host'), activeEmp.id);
    renderAttendanceHistory(document.getElementById('att-history-host'), activeEmp.id);
    return;
  }

  // Employee view
  const rec = Store.attendanceOn(user.id, todayStr());
  const checkedIn = rec && rec.checkIn && !rec.checkOut;
  const done = rec && rec.checkIn && rec.checkOut;
  el.innerHTML = `
    <div class="checkin-box" style="margin-bottom:24px;">
      <div class="checkin-ring">${ringSVG(done?1:checkedIn?0.5:0, 92, 8, 'var(--amber)', 'rgba(255,255,255,0.12)')}
        <div class="checkin-clock"><div class="t" id="live-clock"></div></div></div>
      <div class="checkin-info" style="flex:1;">
        <h4>${done ? 'Day complete ✓' : checkedIn ? 'You\'re checked in' : 'You haven\'t checked in yet'}</h4>
        <p>${rec?.checkIn ? `In at ${rec.checkIn}` : 'Mark your attendance for today'} ${rec?.checkOut ? `· Out at ${rec.checkOut}` : ''}</p>
      </div>
      <button class="btn ${done ? 'btn-ghost' : 'btn-primary'}" id="checkin-btn" ${done?'disabled':''}>
        ${done ? 'Completed' : checkedIn ? 'Check out' : 'Check in'}
      </button>
    </div>

    <div class="card" style="margin-bottom:24px;">
      <div class="section-head"><h3>This week</h3></div>
      <div id="week-grid-host"></div>
    </div>
    <div class="card">
      <div class="section-head"><h3>History</h3></div>
      <div id="att-history-host"></div>
    </div>
  `;
  updateLiveClock();
  setInterval(updateLiveClock, 1000);
  renderWeekGrid(document.getElementById('week-grid-host'), user.id);
  renderAttendanceHistory(document.getElementById('att-history-host'), user.id);

  document.getElementById('checkin-btn').addEventListener('click', () => {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
    if (!rec || !rec.checkIn) {
      Store.upsertAttendance(user.id, todayStr(), { checkIn: timeLabel, status:'present' });
      Store.addActivity(user.id, `checked in at ${timeLabel}`, 'in');
      toast('Checked in for today.');
    } else {
      Store.upsertAttendance(user.id, todayStr(), { checkOut: timeLabel });
      Store.addActivity(user.id, `checked out at ${timeLabel}`, 'in');
      toast('Checked out. See you tomorrow!');
    }
    renderAttendance();
  });
}
function updateLiveClock() { const el = document.getElementById('live-clock'); if (el) el.textContent = timeNowLabel(); }

function renderWeekGrid(host, userId) {
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(daysAgo(i));
  host.innerHTML = `<div class="week-grid">${days.map(d => {
    const rec = Store.attendanceOn(userId, d);
    const dow = new Date(d).getDay();
    const weekend = dow === 0 || dow === 6;
    const status = weekend ? null : rec?.status;
    return `<div class="day-cell">
      <div class="dname">${new Date(d).toLocaleDateString('en-US',{weekday:'short'})}</div>
      <div class="dnum">${new Date(d).getDate()}</div>
      <div class="dstatus" style="background:${status ? STATUS_COLOR[status] : 'var(--cloud-dim)'}"></div>
    </div>`;
  }).join('')}</div>`;
}
function renderAttendanceHistory(host, userId) {
  const recs = Store.attendanceFor(userId).slice(0, 10);
  host.innerHTML = `<table class="dy-table"><thead><tr><th>Date</th><th>Status</th><th>Check in</th><th>Check out</th></tr></thead>
    <tbody>${recs.map(r => `<tr><td>${new Date(r.date).toLocaleDateString('en-US',{month:'short',day:'numeric',weekday:'short'})}</td>
      <td><span class="badge" style="background:${STATUS_COLOR[r.status]}22;color:${STATUS_COLOR[r.status]}"><span class="badge-dot"></span>${cap(r.status)}</span></td>
      <td class="mono">${r.checkIn||'—'}</td><td class="mono">${r.checkOut||'—'}</td></tr>`).join('')}</tbody></table>`;
}

/* ============================================================
   LEAVE
   ============================================================ */
const LEAVE_ICON = { Paid: ICONS.plane, Sick: ICONS.pill, Unpaid: ICONS.ban };
const LEAVE_TONE = { Paid:'indigo', Sick:'coral', Unpaid:'amber' };
const STATUS_BADGE = { pending:'badge-amber', approved:'badge-teal', rejected:'badge-coral' };

function leaveRow(l, showEmployee) {
  const u = Store.getUser(l.userId);
  const tone = LEAVE_TONE[l.type];
  const bg = { indigo:'#EDEEFD', coral:'var(--coral-soft)', amber:'#FFF3DD' }[tone];
  const fg = { indigo:'var(--indigo)', coral:'var(--coral)', amber:'var(--amber-deep)' }[tone];
  return `<div class="leave-row">
    <div class="leave-type-icon" style="background:${bg};color:${fg}">${LEAVE_ICON[l.type]}</div>
    <div class="lr-info">
      <div class="t1">${showEmployee ? u.name + ' · ' : ''}${l.type} leave</div>
      <div class="t2">${fmtRange(l.from,l.to)} ${l.remarks ? '— ' + l.remarks : ''}</div>
    </div>
    ${showEmployee && l.status === 'pending' ? `
      <div class="leave-actions">
        <button class="btn btn-sm btn-primary" data-approve="${l.id}">${ICONS.check} Approve</button>
        <button class="btn btn-sm btn-danger" data-reject="${l.id}">${ICONS.x} Reject</button>
      </div>` : `<span class="badge ${STATUS_BADGE[l.status]}"><span class="badge-dot"></span>${cap(l.status)}</span>`}
  </div>`;
}
function fmtRange(from, to) {
  const f = new Date(from), t = new Date(to);
  const opts = {month:'short', day:'numeric'};
  return from === to ? f.toLocaleDateString('en-US',opts) : `${f.toLocaleDateString('en-US',opts)} – ${t.toLocaleDateString('en-US',opts)}`;
}
function wireLeaveActions() {
  document.querySelectorAll('[data-approve]').forEach(b => b.addEventListener('click', () => decideLeave(b.dataset.approve, 'approved')));
  document.querySelectorAll('[data-reject]').forEach(b => b.addEventListener('click', () => decideLeave(b.dataset.reject, 'rejected')));
}
function decideLeave(id, status) {
  openModal(`
    <h3>${status === 'approved' ? 'Approve' : 'Reject'} leave request</h3>
    <div class="field"><label>Comment (optional)</label><textarea id="lv-comment" rows="3" placeholder="Add a note for the employee…"></textarea></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn ${status==='approved'?'btn-primary':'btn-danger'}" id="confirm-decide">${status === 'approved' ? 'Approve' : 'Reject'}</button>
    </div>
  `);
  document.getElementById('confirm-decide').addEventListener('click', () => {
    const comment = document.getElementById('lv-comment').value;
    const l = Store.updateLeave(id, { status, adminComment: comment });
    Store.addActivity(user.id, `${status} ${Store.getUser(l.userId).name}'s leave request`, 'approve');
    toast(`Leave request ${status}.`);
    closeModal();
    navigate('leave');
  });
}

function renderLeave() {
  const el = document.getElementById('section-leave');
  if (isAdmin) {
    const all = Store.allLeaves();
    const pending = all.filter(l=>l.status==='pending');
    const decided = all.filter(l=>l.status!=='pending');
    el.innerHTML = `
      <div class="grid grid-3" style="margin-bottom:24px;">
        ${statCard('Pending', pending.length, ICONS.inbox, 'amber')}
        ${statCard('Approved', all.filter(l=>l.status==='approved').length, ICONS.check, 'teal')}
        ${statCard('Rejected', all.filter(l=>l.status==='rejected').length, ICONS.x, 'coral')}
      </div>
      <div class="card" style="margin-bottom:24px;">
        <div class="section-head"><h3>Pending approvals</h3></div>
        ${pending.length ? pending.map(l=>leaveRow(l,true)).join('') : emptyState('No pending requests. All caught up!')}
      </div>
      <div class="card">
        <div class="section-head"><h3>History</h3></div>
        ${decided.length ? decided.map(l=>leaveRow(l,true)).join('') : emptyState('No decisions yet.')}
      </div>
    `;
    wireLeaveActions();
    return;
  }

  const mine = Store.leavesFor(user.id);
  const approvedDays = mine.filter(l=>l.status==='approved').length;
  el.innerHTML = `
    <div class="grid grid-2" style="margin-bottom:24px;">
      <div class="card">
        <div class="section-head"><h3>Leave balance</h3></div>
        <div class="balance-ring-row">
          ${balanceRing('Paid', 12 - Math.min(12,approvedDays), 12, 'var(--indigo)')}
          ${balanceRing('Sick', 8 - Math.min(8, mine.filter(l=>l.status==='approved'&&l.type==='Sick').length*2), 8, 'var(--coral)')}
          ${balanceRing('Unpaid', 5, 5, 'var(--amber)')}
        </div>
      </div>
      <div class="card" style="display:flex;flex-direction:column;justify-content:center;align-items:center;gap:14px;text-align:center;">
        <div class="qc-icon" style="background:#EDEEFD;color:var(--indigo);width:52px;height:52px;">${ICONS.leave}</div>
        <div><h4 style="margin-bottom:4px;">Need time off?</h4><p style="font-size:13px;color:var(--text-2);">Submit a request in seconds.</p></div>
        <button class="btn btn-primary" id="apply-leave-btn">+ Apply for leave</button>
      </div>
    </div>
    <div class="card">
      <div class="section-head"><h3>My requests</h3></div>
      ${mine.length ? mine.map(l=>leaveRow(l,false)).join('') : emptyState('No leave requests yet.')}
    </div>
  `;
  document.getElementById('apply-leave-btn').addEventListener('click', openApplyLeave);
}
function balanceRing(label, remaining, total, color) {
  const pct = Math.max(0, remaining) / total;
  return `<div><div class="balance-ring">${ringSVG(pct, 84, 8, color, 'var(--cloud-dim)')}<div class="num">${Math.max(0,remaining)}</div></div><div style="font-size:12.5px;color:var(--text-2);font-weight:600;">${label} left</div></div>`;
}
function openApplyLeave() {
  openModal(`
    <h3>Apply for leave</h3>
    <div class="field"><label>Leave type</label>
      <select id="al-type"><option>Paid</option><option>Sick</option><option>Unpaid</option></select>
    </div>
    <div style="display:flex;gap:12px;">
      <div class="field" style="flex:1;"><label>From</label><input type="date" id="al-from" value="${todayStr()}"></div>
      <div class="field" style="flex:1;"><label>To</label><input type="date" id="al-to" value="${todayStr()}"></div>
    </div>
    <div class="field"><label>Remarks</label><textarea id="al-remarks" rows="3" placeholder="Reason for leave…"></textarea></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="submit-leave">Submit request</button>
    </div>
  `);
  document.getElementById('submit-leave').addEventListener('click', () => {
    const type = document.getElementById('al-type').value;
    const from = document.getElementById('al-from').value;
    const to = document.getElementById('al-to').value;
    const remarks = document.getElementById('al-remarks').value;
    if (!from || !to || to < from) { toast('Please choose a valid date range.', 'error'); return; }
    Store.addLeave({ id: uid('lv'), userId: user.id, type, from, to, remarks, status:'pending', adminComment:'', appliedOn: todayStr() });
    Store.addActivity(user.id, `applied for ${type} leave`, 'leave');
    toast('Leave request submitted.');
    closeModal();
    navigate('leave');
  });
}

/* ============================================================
   PAYROLL
   ============================================================ */
function payBreakdown(u) {
  const { basic, hra, allowances, deductions } = u.salary;
  const gross = basic + hra + allowances;
  const net = gross - deductions;
  return { basic, hra, allowances, deductions, gross, net };
}
function payslipHTML(u) {
  const p = payBreakdown(u);
  return `<div class="payslip">
    <div style="position:relative;z-index:1;display:flex;justify-content:space-between;margin-bottom:18px;">
      <div><div style="font-size:11px;color:var(--text-on-ink-dim);text-transform:uppercase;letter-spacing:.06em;">Payslip · ${new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'})}</div>
      <h3 style="margin-top:4px;">${u.name}</h3></div>
      <span class="badge badge-amber">${u.employeeId}</span>
    </div>
    <div class="payslip-row"><span class="lbl">Basic salary</span><span>${money(p.basic)}</span></div>
    <div class="payslip-row"><span class="lbl">HRA</span><span>${money(p.hra)}</span></div>
    <div class="payslip-row"><span class="lbl">Allowances</span><span>${money(p.allowances)}</span></div>
    <div class="payslip-row"><span class="lbl">Deductions</span><span>−${money(p.deductions)}</span></div>
    <div class="payslip-row total"><span>Net pay</span><span>${money(p.net)}</span></div>
  </div>`;
}
function renderPayroll() {
  const el = document.getElementById('section-payroll');
  if (isAdmin) {
    const emp = Store.employees();
    el.innerHTML = `
      <div class="grid grid-3" style="margin-bottom:24px;">
        ${statCard('Employees on payroll', emp.length, ICONS.team, 'indigo')}
        ${statCard('Total net payout', money(emp.reduce((s,e)=>s+payBreakdown(e).net,0)), ICONS.payroll, 'teal')}
        ${statCard('Avg. net salary', money(Math.round(emp.reduce((s,e)=>s+payBreakdown(e).net,0)/emp.length)), ICONS.overview, 'amber')}
      </div>
      <div class="card">
        <div class="section-head"><h3>Salary structure — all employees</h3></div>
        <table class="dy-table"><thead><tr><th>Employee</th><th>Basic</th><th>HRA</th><th>Allowances</th><th>Deductions</th><th>Net pay</th><th></th></tr></thead>
        <tbody>${emp.map(e => { const p = payBreakdown(e); return `<tr>
          <td><div class="name-cell">${avatarNode(e,32)}<div><div class="n">${e.name}</div><div class="e">${e.department}</div></div></div></td>
          <td class="mono">${money(p.basic)}</td><td class="mono">${money(p.hra)}</td><td class="mono">${money(p.allowances)}</td>
          <td class="mono" style="color:var(--coral)">−${money(p.deductions)}</td><td class="mono" style="font-weight:700;">${money(p.net)}</td>
          <td><button class="btn btn-sm btn-ghost" data-edit-salary="${e.id}">${ICONS.edit}</button></td></tr>`; }).join('')}</tbody></table>
      </div>
    `;
    document.querySelectorAll('[data-edit-salary]').forEach(b => b.addEventListener('click', () => openEditSalary(Store.getUser(b.dataset.editSalary))));
    return;
  }

  const p = payBreakdown(user);
  const months = ['Mar','Apr','May','Jun','Jul','Aug'];
  const vals = months.map((_,i) => Math.round(p.net * (0.94 + Math.random()*0.1)));
  vals[vals.length-1] = p.net;
  const max = Math.max(...vals);
  el.innerHTML = `
    <div class="grid grid-2">
      <div>${payslipHTML(user)}</div>
      <div class="card">
        <div class="section-head"><h3>Net pay trend</h3></div>
        <div class="bar-chart">${vals.map((v,i)=>`<div class="bar-wrap"><div class="bar" style="height:${(v/max*100)}%"></div><div class="blabel">${months[i]}</div></div>`).join('')}</div>
      </div>
    </div>
    <div class="card" style="margin-top:20px;">
      <div class="section-head"><h3>Note</h3></div>
      <p style="font-size:13.5px;color:var(--text-2);">Payroll figures are read-only for employees. Reach out to HR for any corrections.</p>
    </div>
  `;
}
function openEditSalary(u) {
  openModal(`
    <h3>Edit salary — ${u.name}</h3>
    <div class="field"><label>Basic</label><input type="number" id="es-basic" value="${u.salary.basic}"></div>
    <div class="field"><label>HRA</label><input type="number" id="es-hra" value="${u.salary.hra}"></div>
    <div class="field"><label>Allowances</label><input type="number" id="es-allow" value="${u.salary.allowances}"></div>
    <div class="field"><label>Deductions</label><input type="number" id="es-ded" value="${u.salary.deductions}"></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-salary">Save</button>
    </div>
  `);
  document.getElementById('save-salary').addEventListener('click', () => {
    Store.updateUser(u.id, { salary: {
      basic: +document.getElementById('es-basic').value, hra: +document.getElementById('es-hra').value,
      allowances: +document.getElementById('es-allow').value, deductions: +document.getElementById('es-ded').value,
    }});
    toast('Salary structure updated.');
    closeModal();
    navigate('payroll');
  });
}

/* ============================================================
   TEAM (admin)
   ============================================================ */
function renderTeam() {
  const el = document.getElementById('section-team');
  const emp = Store.employees();
  el.innerHTML = `
    <div class="card" style="margin-bottom:20px;">
      <div class="search-input"><input id="team-search" placeholder="Search employees by name or department…">${ICONS.search}</div>
    </div>
    <div class="card"><table class="dy-table"><thead><tr><th>Employee</th><th>Department</th><th>Role</th><th>Joined</th><th></th></tr></thead>
      <tbody id="team-tbody"></tbody></table></div>
  `;
  function draw(list) {
    document.getElementById('team-tbody').innerHTML = list.map(e => `<tr>
      <td><div class="name-cell">${avatarNode(e,32)}<div><div class="n">${e.name}</div><div class="e">${e.email}</div></div></div></td>
      <td>${e.department}</td><td><span class="badge badge-indigo">${e.jobTitle}</span></td>
      <td class="mono">${new Date(e.joinDate).toLocaleDateString('en-US',{month:'short',year:'numeric'})}</td>
      <td style="display:flex;gap:6px;">
        <button class="btn btn-sm btn-ghost" data-view-att="${e.id}">Attendance</button>
        <button class="btn btn-sm btn-ghost" data-edit-user="${e.id}">${ICONS.edit}</button>
      </td></tr>`).join('') || `<tr><td colspan="5">${emptyState('No employees match your search.')}</td></tr>`;
    document.querySelectorAll('[data-view-att]').forEach(b => b.addEventListener('click', () => { viewingId = b.dataset.viewAtt; location.hash = 'attendance'; }));
    document.querySelectorAll('[data-edit-user]').forEach(b => b.addEventListener('click', () => openEditProfile(Store.getUser(b.dataset.editUser), true)));
  }
  draw(emp);
  document.getElementById('team-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    draw(emp.filter(x => x.name.toLowerCase().includes(q) || x.department.toLowerCase().includes(q)));
  });
}

/* ---------- Init ---------- */
const RENDERERS = { overview: renderOverview, profile: renderProfile, attendance: renderAttendance, leave: renderLeave, payroll: renderPayroll, team: renderTeam };
navigate(location.hash.slice(1) || 'overview');
