/* ============================================================
   TASKLY — App JavaScript
   ============================================================ */

// ---- Data ----
const ASSIGNEE_COLORS = {
  'Elchin A.': '#6366f1',
  'Jordan M.': '#818cf8',
  'Sofia R.':  '#f472b6',
  'Alex K.':   '#34d399',
};

let tasks = [
  { id: 1, title: 'Design landing page',        desc: 'Create mockups for the new landing page redesign.', assignee: 'Sofia R.',  priority: 'high',   due: '2026-05-08', status: 'todo' },
  { id: 2, title: 'Write Q2 blog post',          desc: 'Cover the major product updates from Q1.',           assignee: 'Jordan M.', priority: 'low',    due: '2026-05-14', status: 'todo' },
  { id: 3, title: 'Set up analytics dashboard',  desc: 'Integrate Plausible and set up conversion funnels.', assignee: 'Alex K.',   priority: 'medium', due: '2026-05-20', status: 'todo' },
  { id: 4, title: 'Build onboarding flow',       desc: 'Design and implement the multi-step onboarding.',    assignee: 'Elchin A.', priority: 'urgent', due: '2026-05-06', status: 'inprogress' },
  { id: 5, title: 'API integration',             desc: 'Connect the backend API to the frontend dashboard.', assignee: 'Elchin A.', priority: 'high',   due: '2026-05-10', status: 'inprogress' },
  { id: 6, title: 'Code review for auth module', desc: 'Review the PR for the new OAuth2 implementation.',   assignee: 'Jordan M.', priority: 'medium', due: '2026-05-05', status: 'review' },
  { id: 7, title: 'Set up CI/CD pipeline',       desc: 'Configure GitHub Actions for automated deploys.',    assignee: 'Alex K.',   priority: 'medium', due: '2026-04-28', status: 'done' },
  { id: 8, title: 'Brand guidelines doc',        desc: 'Write and publish the updated brand guidelines.',    assignee: 'Sofia R.',  priority: 'low',    due: '2026-04-25', status: 'done' },
];

let nextId = 9;
let editingTaskId = null;
let calendarDate = new Date(2026, 4, 1); // May 2026

// ---- Utilities ----
function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(d) {
  if (!d) return false;
  return new Date(d + 'T00:00:00') < new Date();
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

// ---- Sidebar / Nav ----
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const layout = document.getElementById('layout');

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

// Page switching
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const target = document.getElementById('page-' + pageId);
  if (target) target.style.display = 'block';
}

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const page = item.dataset.page;
    document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    showPage(page);
  });
});

// My Tasks → show board
document.querySelectorAll('.nav-item[data-page="board"]').forEach(item => {
  item.addEventListener('click', () => renderBoard());
});

// ---- Notifications ----
const notifBtn   = document.getElementById('notifBtn');
const notifPanel = document.getElementById('notifPanel');
const notifClose = document.getElementById('notifClose');

notifBtn.addEventListener('click', e => {
  e.stopPropagation();
  notifPanel.classList.toggle('open');
});
notifClose.addEventListener('click', () => notifPanel.classList.remove('open'));
document.addEventListener('click', e => {
  if (!notifPanel.contains(e.target) && e.target !== notifBtn) {
    notifPanel.classList.remove('open');
  }
});

// ---- Task Card HTML ----
function taskCardHTML(task) {
  const avatarColor = ASSIGNEE_COLORS[task.assignee] || '#6366f1';
  const dueTxt = formatDate(task.due);
  const overdue = isOverdue(task.due) && task.status !== 'done';
  return `
    <div class="task-card" data-id="${task.id}" onclick="openTask(${task.id})">
      <div class="task-card-title">${escHtml(task.title)}</div>
      <div class="task-card-meta">
        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
        ${dueTxt ? `<span class="task-due${overdue ? ' overdue' : ''}">${dueTxt}${overdue ? ' ⚠' : ''}</span>` : ''}
        ${task.assignee ? `<span class="task-assignee" style="--c:${avatarColor}" title="${escHtml(task.assignee)}">${initials(task.assignee)}</span>` : ''}
      </div>
    </div>
  `;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ---- Board Render ----
function renderBoard() {
  const statuses = ['todo','inprogress','review','done'];
  statuses.forEach(s => {
    const col = document.getElementById('col-' + s);
    const count = document.getElementById('count-' + s);
    const filtered = tasks.filter(t => t.status === s);
    col.innerHTML = filtered.map(taskCardHTML).join('');
    if (count) count.textContent = filtered.length;
  });
}

// ---- List Render ----
function renderList() {
  const tbody = document.getElementById('listBody');
  tbody.innerHTML = tasks.map(t => {
    const avatarColor = ASSIGNEE_COLORS[t.assignee] || '#6366f1';
    const overdue = isOverdue(t.due) && t.status !== 'done';
    return `
      <tr onclick="openTask(${t.id})" style="cursor:pointer">
        <td><input type="checkbox" class="task-check" ${t.status === 'done' ? 'checked' : ''} onclick="event.stopPropagation();toggleDone(${t.id},this)" /></td>
        <td>${escHtml(t.title)}</td>
        <td>
          ${t.assignee ? `<div style="display:flex;align-items:center;gap:6px">
            <span class="task-assignee" style="--c:${avatarColor};width:22px;height:22px;font-size:9px">${initials(t.assignee)}</span>
            ${escHtml(t.assignee)}</div>` : '—'}
        </td>
        <td><span class="priority-badge priority-${t.priority}">${t.priority}</span></td>
        <td><span class="${overdue ? 'task-due overdue' : 'task-due'}">${formatDate(t.due) || '—'}${overdue ? ' ⚠' : ''}</span></td>
        <td><span class="status-pill status-${t.status}">${statusLabel(t.status)}</span></td>
      </tr>
    `;
  }).join('');
}

function statusLabel(s) {
  return { todo:'To Do', inprogress:'In Progress', review:'In Review', done:'Done' }[s] || s;
}

function toggleDone(id, cb) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.status = cb.checked ? 'done' : 'todo';
  renderList();
  renderBoard();
}

// ---- Calendar Render ----
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  document.getElementById('calMonthYear').textContent = MONTHS[month] + ' ' + year;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  let html = DAYS.map(d => `<div class="cal-day-name">${d}</div>`).join('');

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const prevMonthDays = new Date(year, month, 0).getDate();
    html += `<div class="cal-day other-month"><div class="cal-day-num">${prevMonthDays - firstDay + i + 1}</div></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = today.getFullYear()===year && today.getMonth()===month && today.getDate()===d;
    const dayTasks = tasks.filter(t => t.due === dateStr);
    const events = dayTasks.map(t => `<div class="cal-event">${escHtml(t.title)}</div>`).join('');
    html += `<div class="cal-day${isToday ? ' today' : ''}">
      <div class="cal-day-num">${d}</div>
      ${events}
    </div>`;
  }

  // Fill remaining cells
  const total = firstDay + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="cal-day other-month"><div class="cal-day-num">${i}</div></div>`;
  }

  grid.innerHTML = html;
}

document.getElementById('calPrev').addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});
document.getElementById('calNext').addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

// ---- View Tabs ----
document.querySelectorAll('.view-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const view = tab.dataset.view;
    document.querySelectorAll('.view-pane').forEach(p => p.style.display = 'none');
    document.getElementById('view-' + view).style.display = 'block';
    if (view === 'list') renderList();
    if (view === 'calendar') renderCalendar();
  });
});

// ---- Column add buttons ----
document.querySelectorAll('.col-add').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const status = btn.dataset.status;
    openNewTask(status);
  });
});

// ---- Task Modal ----
const taskModal   = document.getElementById('taskModal');
const modalClose  = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const modalSave   = document.getElementById('modalSave');
const newTaskBtn  = document.getElementById('newTaskBtn');

function openNewTask(defaultStatus = 'todo') {
  editingTaskId = null;
  document.getElementById('modalTitle').textContent = 'New Task';
  document.getElementById('taskTitleInput').value = '';
  document.getElementById('taskDescInput').value = '';
  document.getElementById('taskAssigneeInput').value = '';
  document.getElementById('taskPriorityInput').value = 'medium';
  document.getElementById('taskDueDateInput').value = '';
  document.getElementById('taskStatusInput').value = defaultStatus;
  document.getElementById('subtaskList').innerHTML = '';
  modalSave.textContent = 'Create Task';
  taskModal.classList.add('open');
  document.getElementById('taskTitleInput').focus();
}

function openTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingTaskId = id;
  document.getElementById('modalTitle').textContent = 'Edit Task';
  document.getElementById('taskTitleInput').value = task.title;
  document.getElementById('taskDescInput').value = task.desc || '';
  document.getElementById('taskAssigneeInput').value = task.assignee || '';
  document.getElementById('taskPriorityInput').value = task.priority;
  document.getElementById('taskDueDateInput').value = task.due || '';
  document.getElementById('taskStatusInput').value = task.status;
  document.getElementById('subtaskList').innerHTML = (task.subtasks || []).map(st => subtaskRowHTML(st)).join('');
  modalSave.textContent = 'Save Changes';
  taskModal.classList.add('open');
}

function subtaskRowHTML(text = '') {
  return `<div class="subtask-row">
    <input type="checkbox" />
    <input type="text" placeholder="Subtask..." value="${escHtml(text)}" />
  </div>`;
}

newTaskBtn.addEventListener('click', () => openNewTask());
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
taskModal.addEventListener('click', e => { if (e.target === taskModal) closeModal(); });

function closeModal() { taskModal.classList.remove('open'); }

document.getElementById('addSubtask').addEventListener('click', () => {
  const list = document.getElementById('subtaskList');
  const div = document.createElement('div');
  div.innerHTML = subtaskRowHTML();
  list.appendChild(div.firstElementChild);
  list.lastElementChild.querySelector('input[type=text]').focus();
});

modalSave.addEventListener('click', () => {
  const title = document.getElementById('taskTitleInput').value.trim();
  if (!title) { document.getElementById('taskTitleInput').focus(); return; }

  const subtasks = [...document.querySelectorAll('#subtaskList input[type=text]')]
    .map(i => i.value.trim()).filter(Boolean);

  const data = {
    title,
    desc:     document.getElementById('taskDescInput').value,
    assignee: document.getElementById('taskAssigneeInput').value,
    priority: document.getElementById('taskPriorityInput').value,
    due:      document.getElementById('taskDueDateInput').value,
    status:   document.getElementById('taskStatusInput').value,
    subtasks,
  };

  if (editingTaskId) {
    const idx = tasks.findIndex(t => t.id === editingTaskId);
    tasks[idx] = { ...tasks[idx], ...data };
  } else {
    tasks.push({ id: nextId++, ...data });
  }

  closeModal();
  renderBoard();
  renderList();
  renderCalendar();
});

// ---- Docs ----
document.querySelectorAll('.doc-list-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.doc-list-item').forEach(d => d.classList.remove('active'));
    item.classList.add('active');
  });
});

document.getElementById('newDocBtn')?.addEventListener('click', () => {
  document.getElementById('docTitleInput').value = 'Untitled';
  document.getElementById('docContent').innerHTML = '<p>Start writing here...</p>';
  document.querySelectorAll('.doc-list-item').forEach(d => d.classList.remove('active'));
});

// Toolbar buttons for doc editor
document.querySelectorAll('.toolbar-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const cmd = btn.dataset.cmd;
    if (cmd === 'h1') {
      document.execCommand('formatBlock', false, 'h1');
    } else if (cmd === 'h2') {
      document.execCommand('formatBlock', false, 'h2');
    } else if (cmd === 'link') {
      const url = prompt('Enter URL:');
      if (url) document.execCommand('createLink', false, url);
    } else {
      document.execCommand(cmd, false, null);
    }
    document.getElementById('docContent').focus();
  });
});

// ---- Settings tabs ----
document.querySelectorAll('.settings-nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.settings-nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
  });
});

// ---- Search ----
document.getElementById('searchInput').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  if (!q) { renderBoard(); return; }
  // Filter cards in board
  document.querySelectorAll('.task-card').forEach(card => {
    const title = card.querySelector('.task-card-title').textContent.toLowerCase();
    card.style.opacity = title.includes(q) ? '1' : '0.25';
  });
});

// ---- Init ----
showPage('board');
renderBoard();
renderCalendar();
