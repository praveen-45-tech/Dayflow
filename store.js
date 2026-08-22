/* ============================================================
   DAYFLOW — Data store (localStorage-backed mock backend)
   ============================================================ */
const DB_KEY = 'dayflow_db_v1';
const SESSION_KEY = 'dayflow_session_v1';

const LEAVE_TYPES = ['Paid', 'Sick', 'Unpaid'];
const AVATAR_COLORS = ['#4C4FF0','#16A3A0','#FF5470','#E8961A','#7A5CF0','#1CA6C9'];

function uid(prefix='id') { return prefix + '_' + Math.random().toString(36).slice(2,9); }
function initials(name) { return name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase(); }
function fmtDate(d) { return new Date(d).toISOString().slice(0,10); }
function todayStr() { return fmtDate(new Date()); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate()-n); return fmtDate(d); }
function money(n) { return '₹' + Number(n).toLocaleString('en-IN'); }

function seedDB() {
  const users = [
    { id:'u_admin', employeeId:'DF-1001', name:'Ananya Rao', email:'ananya.hr@dayflow.io', password:'Admin@123', role:'admin',
      jobTitle:'HR Officer', department:'People Operations', phone:'+91 98450 12233', address:'12 Lake View Rd, Bengaluru',
      joinDate:'2021-03-15', avatarColor:AVATAR_COLORS[0], photo:null, verified:true,
      salary:{basic:95000, hra:38000, allowances:12000, deductions:9500} },

    { id:'u_1', employeeId:'DF-2041', name:'Rahul Mehta', email:'rahul.mehta@dayflow.io', password:'Employee@123', role:'employee',
      jobTitle:'Frontend Engineer', department:'Engineering', phone:'+91 90210 44521', address:'44 MG Road, Pune',
      joinDate:'2022-06-01', avatarColor:AVATAR_COLORS[1], photo:null, verified:true,
      salary:{basic:68000, hra:27000, allowances:8000, deductions:6100} },

    { id:'u_2', employeeId:'DF-2042', name:'Sneha Kulkarni', email:'sneha.k@dayflow.io', password:'Employee@123', role:'employee',
      jobTitle:'Product Designer', department:'Design', phone:'+91 99870 33210', address:'9 Baner Hills, Pune',
      joinDate:'2023-01-20', avatarColor:AVATAR_COLORS[2], photo:null, verified:true,
      salary:{basic:62000, hra:24800, allowances:7000, deductions:5600} },

    { id:'u_3', employeeId:'DF-2043', name:'Arjun Nair', email:'arjun.nair@dayflow.io', password:'Employee@123', role:'employee',
      jobTitle:'Backend Engineer', department:'Engineering', phone:'+91 88990 11223', address:'21 Marine Lines, Kochi',
      joinDate:'2021-11-08', avatarColor:AVATAR_COLORS[3], photo:null, verified:true,
      salary:{basic:72000, hra:28800, allowances:9000, deductions:6900} },

    { id:'u_4', employeeId:'DF-2044', name:'Priya Iyer', email:'priya.iyer@dayflow.io', password:'Employee@123', role:'employee',
      jobTitle:'QA Analyst', department:'Engineering', phone:'+91 91234 56780', address:'7 Anna Nagar, Chennai',
      joinDate:'2023-08-14', avatarColor:AVATAR_COLORS[4], photo:null, verified:true,
      salary:{basic:52000, hra:20800, allowances:6000, deductions:4700} },

    { id:'u_5', employeeId:'DF-2045', name:'Karan Verma', email:'karan.verma@dayflow.io', password:'Employee@123', role:'employee',
      jobTitle:'Sales Executive', department:'Revenue', phone:'+91 97654 32109', address:'3 Sector 21, Gurugram',
      joinDate:'2022-02-02', avatarColor:AVATAR_COLORS[5], photo:null, verified:true,
      salary:{basic:48000, hra:19200, allowances:9500, deductions:4200} },
  ];

  const attendance = [];
  const statuses = ['present','present','present','present','half-day','absent'];
  users.forEach(u => {
    for (let i = 13; i >= 0; i--) {
      const date = daysAgo(i);
      const dow = new Date(date).getDay();
      if (dow === 0 || dow === 6) continue; // skip weekends
      const status = i === 0 ? 'present' : statuses[Math.floor(Math.random()*statuses.length)];
      attendance.push({
        id: uid('att'), userId: u.id, date, status,
        checkIn: status === 'absent' ? null : `0${8+Math.floor(Math.random()*1)}:${10+Math.floor(Math.random()*40)} AM`,
        checkOut: status === 'absent' || i === 0 ? null : `0${5+Math.floor(Math.random()*2)}:${10+Math.floor(Math.random()*40)} PM`,
      });
    }
  });

  const leaves = [
    { id: uid('lv'), userId:'u_1', type:'Sick', from: daysAgo(20), to: daysAgo(19), remarks:'Fever and cold', status:'approved', adminComment:'Get well soon.', appliedOn: daysAgo(21) },
    { id: uid('lv'), userId:'u_2', type:'Paid', from: daysAgo(5), to: daysAgo(3), remarks:'Family function', status:'approved', adminComment:'Approved, enjoy!', appliedOn: daysAgo(9) },
    { id: uid('lv'), userId:'u_3', type:'Unpaid', from: daysAgo(1), to: todayStr(), remarks:'Personal work', status:'pending', adminComment:'', appliedOn: daysAgo(2) },
    { id: uid('lv'), userId:'u_4', type:'Sick', from: daysAgo(30), to: daysAgo(29), remarks:'Migraine', status:'rejected', adminComment:'Please apply in advance next time.', appliedOn: daysAgo(31) },
    { id: uid('lv'), userId:'u_1', type:'Paid', from: daysAheadHelper(2), to: daysAheadHelper(4), remarks:'Trip with family', status:'pending', adminComment:'', appliedOn: todayStr() },
  ];

  const activity = [
    { id: uid('ac'), userId:'u_1', text:'checked in at 09:12 AM', time: 'Today, 9:12 AM', type:'in' },
    { id: uid('ac'), userId:'u_2', text:'applied for Paid leave', time: 'Yesterday, 4:40 PM', type:'leave' },
    { id: uid('ac'), userId:'u_admin', text:'approved Sneha Kulkarni\'s leave request', time: 'Yesterday, 5:02 PM', type:'approve' },
    { id: uid('ac'), userId:'u_3', text:'requested Unpaid leave', time: '2 days ago', type:'leave' },
    { id: uid('ac'), userId:'u_4', text:'updated profile phone number', time: '3 days ago', type:'profile' },
  ];

  return { users, attendance, leaves, activity };
}

function daysAheadHelper(n){ const d = new Date(); d.setDate(d.getDate()+n); return fmtDate(d); }

function loadDB() {
  let raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const seeded = seedDB();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try { return JSON.parse(raw); } catch(e) { const seeded = seedDB(); localStorage.setItem(DB_KEY, JSON.stringify(seeded)); return seeded; }
}
function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

const Store = {
  db: loadDB(),
  reset() { this.db = seedDB(); saveDB(this.db); },
  persist() { saveDB(this.db); },

  findUserByEmail(email) { return this.db.users.find(u => u.email.toLowerCase() === email.toLowerCase()); },
  findUserByEmployeeId(id) { return this.db.users.find(u => u.employeeId.toLowerCase() === id.toLowerCase()); },
  getUser(id) { return this.db.users.find(u => u.id === id); },
  employees() { return this.db.users.filter(u => u.role === 'employee'); },

  addUser(u) { this.db.users.push(u); this.persist(); },
  updateUser(id, patch) { const u = this.getUser(id); Object.assign(u, patch); this.persist(); return u; },

  attendanceFor(userId) { return this.db.attendance.filter(a => a.userId === userId).sort((a,b)=> b.date.localeCompare(a.date)); },
  attendanceOn(userId, date) { return this.db.attendance.find(a => a.userId === userId && a.date === date); },
  allAttendanceOn(date) { return this.db.attendance.filter(a => a.date === date); },
  upsertAttendance(userId, date, patch) {
    let rec = this.attendanceOn(userId, date);
    if (!rec) { rec = { id: uid('att'), userId, date, status:'present', checkIn:null, checkOut:null }; this.db.attendance.push(rec); }
    Object.assign(rec, patch); this.persist(); return rec;
  },

  leavesFor(userId) { return this.db.leaves.filter(l => l.userId === userId).sort((a,b)=> b.appliedOn.localeCompare(a.appliedOn)); },
  allLeaves() { return [...this.db.leaves].sort((a,b)=> b.appliedOn.localeCompare(a.appliedOn)); },
  addLeave(l) { this.db.leaves.unshift(l); this.persist(); },
  updateLeave(id, patch) { const l = this.db.leaves.find(x=>x.id===id); Object.assign(l, patch); this.persist(); return l; },

  addActivity(userId, text, type) {
    this.db.activity.unshift({ id: uid('ac'), userId, text, time:'Just now', type });
    this.db.activity = this.db.activity.slice(0, 30);
    this.persist();
  },
  recentActivity(n=6) { return this.db.activity.slice(0, n); },

  session() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch(e) { return null; } },
  setSession(userId) { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId })); },
  clearSession() { sessionStorage.removeItem(SESSION_KEY); },
  currentUser() { const s = this.session(); return s ? this.getUser(s.userId) : null; },
};
