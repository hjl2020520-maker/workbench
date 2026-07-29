// ============= 数据存储 =============
const STORE_KEY = 'workbench-v5';

function getData() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || defaultData(); }
  catch { return defaultData(); }
}
function setData(data) { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }

function defaultData() {
  return {
    records: [],
    members: ['我', '家人'],
    periodStart: null, periodLength: 5, cycleLength: 28,
    periodRecords: {},
    // 经期项目可自定义
    periodItems: [
      { key: 'color', label: '颜色', emoji: '🎨', color: '#f3e8ff', type: 'text' },
      { key: 'pain', label: '痛经', emoji: '⚡', color: '#ffd1dc', type: 'text' },
      { key: 'love', label: '爱爱', emoji: '💗', color: '#ffe4ef', type: 'love' },
      { key: 'symptom', label: '症状', emoji: '💊', color: '#e0f2fe', type: 'text' },
      { key: 'mood', label: '心情', emoji: '😊', color: '#fef3c7', type: 'mood' },
      { key: 'discharge', label: '白带', emoji: '🪻', color: '#f3e8ff', type: 'text' },
      { key: 'temp', label: '体温', emoji: '🌡️', color: '#ccfbf1', type: 'text' },
      { key: 'weight', label: '体重', emoji: '💜', color: '#ede9fe', type: 'text' },
      { key: 'medicine', label: '吃药', emoji: '💊', color: '#fee2e2', type: 'text' }
    ],
    // 支出/收入类别可自定义
    categoriesOut: [
      { name: '餐饮', emoji: '🍚' },{ name: '交通', emoji: '🚗' },{ name: '购物', emoji: '🛍️' },
      { name: '居家', emoji: '🏠' },{ name: '娱乐', emoji: '🎮' },{ name: '医疗', emoji: '💊' },
      { name: '教育', emoji: '📚' },{ name: '通讯', emoji: '📱' },{ name: '人情', emoji: '🎁' },
      { name: '水电', emoji: '💡' },{ name: '服饰', emoji: '👕' },{ name: '零食', emoji: '🍪' },
      { name: '宠物', emoji: '🐶' },{ name: '其他', emoji: '📌' }
    ],
    categoriesIn: [
      { name: '工资', emoji: '💵' },{ name: '奖金', emoji: '🧧' },{ name: '理财', emoji: '📈' },
      { name: '兼职', emoji: '💻' },{ name: '红包', emoji: '🎉' },{ name: '其他', emoji: '📌' }
    ]
  };
}

const BOOK_LABELS = { all:'总账', family:'家庭开销', personal:'个人开支' };
const BOOK_TITLES = { all:'我们家的记账本', family:'家庭开销', personal:'个人开支' };
const BOOK_SUBS = { all:'一家人在一起的每一笔小日子', family:'家里的每一笔开销', personal:'记录属于你的每一笔' };

// ============= 工具 =============
let toastTimer = null;
function showToast(text) {
  const t = document.getElementById('toast');
  t.textContent = text; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

function todayStr() { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function formatDateCN(d) { const date = new Date(d); return date.getFullYear()+'年'+(date.getMonth()+1)+'月'+date.getDate()+'日'; }
function formatDateShort(d) { const date = new Date(d); return (date.getMonth()+1)+'月'+date.getDate()+'日'; }
function diffDays(d1,d2) { return Math.round((new Date(d2)-new Date(d1))/86400000); }
function addDays(d,n) { const date = new Date(d); date.setDate(date.getDate()+n); return date.toISOString().slice(0,10); }
function generateId() { return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

// ============= Tab =============
function switchTab(tab) {
  document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-'+tab).classList.add('active');
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  document.querySelector(`.tab-item[data-tab="${tab}"]`).classList.add('active');
  if (tab === 'period') { renderCalendar(); updatePeriodHero(); renderPeriodList(); }
}

// ============= 存钱 =============
let currentBook = 'all', currentType = 'out', currentCategory = '', currentAmount = '0', recentFilter = 'all';
let recordDate = todayStr();

function getCategories(type) { const data = getData(); return type==='out' ? data.categoriesOut : data.categoriesIn; }

function switchBook(book) {
  currentBook = book;
  document.querySelectorAll('.account-pill').forEach(b => b.classList.remove('active'));
  document.querySelector(`.account-pill[data-book="${book}"]`).classList.add('active');
  document.getElementById('summaryTitle').textContent = BOOK_TITLES[book];
  document.getElementById('summarySub').textContent = BOOK_SUBS[book];
  document.getElementById('recentTitle').textContent = '最近的小账本 - '+BOOK_LABELS[book];
  renderMoneySummary(); renderRecentList();
}

function switchType(type) {
  currentType = type;
  const list = getCategories(type);
  currentCategory = list[0].name;
  currentAmount = '0';
  document.getElementById('amountDisplay').textContent = '0';
  document.querySelectorAll('.tt-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.tt-btn[data-type="${type}"]`).classList.add('active');
  renderCategories();
}

function renderCategories() {
  const grid = document.getElementById('categoryGrid');
  const list = getCategories(currentType);
  let html = list.map(c => `
    <div class="cat-item ${c.name===currentCategory?'active':''}" onclick="selectCategory('${c.name.replace(/'/g,'\\\'')}')">
      <div class="cat-emoji">${c.emoji}</div><div class="cat-name">${c.name}</div>
    </div>`).join('');
  // 编辑按钮
  html += `
    <div class="cat-item" onclick="editMoneyCategories()">
      <div class="cat-emoji" style="background:#f0f0f0">✏️</div><div class="cat-name">编辑</div>
    </div>`;
  grid.innerHTML = html;
}

function selectCategory(name) { currentCategory = name; renderCategories(); }
function clearAmount() { currentAmount = '0'; document.getElementById('amountDisplay').textContent = '0'; }

function pickRecordDate() {
  const input = document.getElementById('recordDateInput');
  input.value = recordDate;
  input.showPicker && input.showPicker();
}

function onRecordDateChange(val) {
  recordDate = val;
  document.getElementById('dateText').textContent = formatDateCN(val);
}

function saveRecord() {
  const amount = parseFloat(currentAmount);
  if (isNaN(amount)||amount<=0) { showToast('请输入金额'); return; }
  if (currentBook==='all') { showToast('请选择「家庭开销」或「个人开支」记账'); return; }
  const data = getData();
  const note = document.getElementById('noteInput').value;
  const cat = getCategories(currentType).find(c => c.name===currentCategory);
  data.records.unshift({
    id: generateId(), book: currentBook, type: currentType, amount,
    category: currentCategory, emoji: cat ? cat.emoji : '📌', note,
    date: recordDate,
    time: new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})
  });
  setData(data);
  currentAmount='0'; document.getElementById('amountDisplay').textContent='0'; document.getElementById('noteInput').value='';
  renderMoneySummary(); renderRecentList();
  showToast('✓ 已记一笔' + (currentType==='out'?'支出':'收入') + ' - '+BOOK_LABELS[currentBook]);
}

function deleteRecord(id) {
  if (!confirm('确定删除吗？')) return;
  const data = getData(); data.records = data.records.filter(r => r.id!==id);
  setData(data); renderMoneySummary(); renderRecentList(); showToast('已删除');
}

function filterRecent(type) {
  recentFilter = type;
  document.querySelectorAll('.rf-pill').forEach(b => b.classList.remove('active'));
  document.querySelector(`.rf-pill[onclick*="${type}"]`).classList.add('active');
  renderRecentList();
}

function renderMoneySummary() {
  const data = getData();
  const records = currentBook==='all' ? data.records : data.records.filter(r => r.book===currentBook);
  let ti=0,to=0; records.forEach(r => { if(r.type==='in') ti+=r.amount; else to+=r.amount; });
  document.getElementById('totalIn').textContent = ti.toFixed(2);
  document.getElementById('totalOut').textContent = to.toFixed(2);
  document.getElementById('balance').textContent = (ti-to).toFixed(2);
  document.getElementById('count').textContent = records.length;
}

function renderRecentList() {
  const data = getData();
  let records = currentBook==='all' ? data.records : data.records.filter(r => r.book===currentBook);
  if (recentFilter!=='all') records = records.filter(r => r.type===recentFilter);
  records.sort((a,b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  const empty = document.getElementById('recentEmpty'), list = document.getElementById('recentList');
  if (!records.length) { empty.style.display='block'; list.style.display='none'; return; }
  empty.style.display='none'; list.style.display='block';
  list.innerHTML = records.slice(0,50).map(r => `
    <li class="rl-item-wrap" data-id="${r.id}">
      <div class="rl-item" id="ri-${r.id}">
        <div class="rl-left"><div class="rl-icon">${r.emoji}</div>
          <div class="rl-info">
            <span class="rl-cat">${r.category}</span>
            <span class="rl-note">${r.note || ''}
              <span class="rl-book-tag">${BOOK_LABELS[r.book]}</span>
              <span class="rl-book-tag">${r.date}</span>
            </span>
          </div>
        </div>
        <div class="rl-right"><div class="rl-amount ${r.type}">${r.type==='in'?'+':'-'}¥${r.amount.toFixed(2)}</div><div class="rl-time">${r.time}</div></div>
      </div>
      <button class="rl-delete-btn" onclick="deleteRecord('${r.id}')">删除</button>
    </li>`).join('');
  bindSwipeDelete(list);
}

function bindSwipeDelete(container) {
  container.querySelectorAll('.rl-item-wrap').forEach(wrap => {
    const item = wrap.querySelector('.rl-item');
    let sx=0,sw=false;
    item.addEventListener('touchstart', e => { sx=e.touches[0].clientX; sw=false; });
    item.addEventListener('touchmove', e => { const dx=sx-e.touches[0].clientX; if(dx>25&&!sw){item.classList.add('swiped');sw=true;} if(dx<-25&&sw){item.classList.remove('swiped');sw=false;} });
    document.addEventListener('click', ev => { if(!wrap.contains(ev.target)&&item.classList.contains('swiped')) item.classList.remove('swiped'); });
  });
}

// ============= 编辑存钱类别 =============
let editCatType = 'out', editingCatName = null;

function editMoneyCategories() {
  const data = getData();
  const list = data.categoriesOut.concat(data.categoriesIn);
  const outHtml = data.categoriesOut.map(c => `<button class="edit-cat-pill" onclick="openCatEdit('out','${c.name.replace(/'/g,'\\\'')}')">${c.emoji} ${c.name}</button>`).join('');
  const inHtml = data.categoriesIn.map(c => `<button class="edit-cat-pill" onclick="openCatEdit('in','${c.name.replace(/'/g,'\\\'')}')">${c.emoji} ${c.name}</button>`).join('');

  document.getElementById('editModalTitle').textContent = '编辑类别';
  document.getElementById('editModalBody').innerHTML = `
    <div style="margin-bottom:12px;"><strong>支出类别</strong><div class="edit-cat-grid">${outHtml}</div></div>
    <div style="margin-bottom:12px;"><strong>收入类别</strong><div class="edit-cat-grid">${inHtml}</div></div>
    <div class="edit-add-row">
      <select id="newCatType"><option value="out">支出</option><option value="in">收入</option></select>
      <input type="text" id="newCatEmoji" placeholder="图标如 🍚" maxlength="2">
      <input type="text" id="newCatName" placeholder="名称">
      <button class="modal-btn save" style="flex:0 0 auto;" onclick="addCategory()">添加</button>
    </div>
  `;
  document.getElementById('editDeleteBtn').style.display = 'none';
  document.getElementById('editOverlay').classList.add('show');
}

function openCatEdit(type, name) {
  editCatType = type; editingCatName = name;
  const data = getData();
  const list = type==='out' ? data.categoriesOut : data.categoriesIn;
  const c = list.find(x => x.name === name);
  document.getElementById('editModalBody').innerHTML = `
    <div class="modal-date-row"><label>图标：</label><input type="text" id="editCatEmoji" value="${c.emoji}" maxlength="2"></div>
    <div class="modal-date-row"><label>名称：</label><input type="text" id="editCatName" value="${c.name}"></div>
  `;
  document.getElementById('editDeleteBtn').style.display = 'block';
}

function addCategory() {
  const type = document.getElementById('newCatType').value;
  const emoji = document.getElementById('newCatEmoji').value || '📌';
  const name = document.getElementById('newCatName').value.trim();
  if (!name) { showToast('请输入名称'); return; }
  const data = getData();
  const target = type==='out' ? data.categoriesOut : data.categoriesIn;
  if (target.find(c => c.name === name)) { showToast('类别已存在'); return; }
  target.push({ name, emoji });
  setData(data); renderCategories(); editMoneyCategories(); showToast('已添加');
}

function saveEditItem() {
  if (document.getElementById('editModalTitle').textContent === '编辑类别') return;
  if (!editingCatName) return;
  const emoji = document.getElementById('editCatEmoji').value || '📌';
  const name = document.getElementById('editCatName').value.trim();
  if (!name) { showToast('请输入名称'); return; }
  const data = getData();
  const target = editCatType==='out' ? data.categoriesOut : data.categoriesIn;
  const idx = target.findIndex(c => c.name === editingCatName);
  if (idx >= 0) {
    if (name !== editingCatName && target.find(c => c.name === name)) { showToast('名称已存在'); return; }
    target[idx] = { name, emoji };
    data.records.forEach(r => { if (r.type===editCatType && r.category===editingCatName) { r.category=name; r.emoji=emoji; } });
    setData(data);
    renderCategories(); renderRecentList(); editMoneyCategories(); showToast('已保存');
  }
}

function deleteEditItem() {
  if (!editingCatName) return;
  if (!confirm('确定删除「'+editingCatName+'」吗？\n已记账的数据类别名会变，但不会删除记录')) return;
  const data = getData();
  const target = editCatType==='out' ? data.categoriesOut : data.categoriesIn;
  const idx = target.findIndex(c => c.name === editingCatName);
  if (idx >= 0) { target.splice(idx, 1); setData(data); renderCategories(); renderRecentList(); editMoneyCategories(); showToast('已删除'); }
}

function closeEditModal(e) {
  if (e && e.target !== document.getElementById('editOverlay')) return;
  document.getElementById('editOverlay').classList.remove('show');
  editingCatName = null;
}

// ============= 工具菜单 =============
function openToolMenu() {
  const m = document.getElementById('toolMenu');
  m.classList.toggle('show');
  document.addEventListener('click', function close(ev) {
    if (!ev.target.closest('.tool-menu') && !ev.target.closest('.header-btn')) {
      m.classList.remove('show'); document.removeEventListener('click', close);
    }
  });
}

function exportCSV() {
  const data = getData();
  if (!data.records.length) { showToast('没有数据可导出'); return; }
  let csv = '账本,类型,金额,类别,备注,日期,时间\n';
  data.records.forEach(r => csv += `${BOOK_LABELS[r.book]},${r.type==='in'?'收入':'支出'},${r.amount},${r.category},"${(r.note||'').replace(/"/g,'""')}",${r.date},${r.time}\n`);
  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='记账数据_'+todayStr()+'.csv'; a.click();
  URL.revokeObjectURL(url); document.getElementById('toolMenu').classList.remove('show');
  showToast('📤 导出成功');
}

function importCSV() {
  document.getElementById('toolMenu').classList.remove('show');
  const input = document.createElement('input'); input.type='file'; input.accept='.csv';
  input.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target.result; const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { showToast('文件格式不对'); return; }
      const data = getData(); let count=0;
      for (let i=1;i<lines.length;i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 7) continue;
        const bookMap = {'家庭开销':'family','个人开支':'personal','总账':'family'};
        const book = bookMap[cols[0]] || 'family';
        const type = cols[1]==='收入'?'in':'out';
        const amount = parseFloat(cols[2]);
        if (isNaN(amount)) continue;
        const cat = getCategories(type).find(c => c.name===cols[3]);
        data.records.unshift({ id:generateId(), book, type, amount, category:cols[3], emoji: cat?cat.emoji:'📌', note:cols[4], date:cols[5], time:cols[6] });
        count++;
      }
      setData(data); renderMoneySummary(); renderRecentList(); showToast('📥 导入了 '+count+' 条记录');
    };
    reader.readAsText(file, 'UTF-8');
  };
  input.click();
}

function parseCSVLine(line) {
  const res = []; let cur=''; let inQuote=false;
  for (let i=0;i<line.length;i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i+1] === '"') { cur += '"'; i++; }
      else { inQuote = !inQuote; continue; }
    } else if (ch === ',' && !inQuote) { res.push(cur); cur=''; }
    else { cur += ch; }
  }
  res.push(cur); return res;
}

function manageMembers() {
  document.getElementById('toolMenu').classList.remove('show');
  const data = getData();
  const action = prompt('当前成员：'+data.members.join('、')+'\n\n输入「添加 名字」添加成员，输入「删除 名字」删除成员');
  if (!action) return;
  const [cmd, name] = action.trim().split(/\s+/);
  if (cmd==='添加' && name) {
    if (!data.members.includes(name)) { data.members.push(name); setData(data); showToast('已添加 '+name); }
    else showToast('成员已存在');
  } else if (cmd==='删除' && name) {
    data.members = data.members.filter(m => m!==name); setData(data); showToast('已删除 '+name);
  } else showToast('格式错误');
}

// ============= 经期日历 =============
let periodYear = new Date().getFullYear();
let periodMonth = new Date().getMonth();
let selectedDay = todayStr();

function changeYear(n) { periodYear += n; document.getElementById('yearLabel').textContent = periodYear; renderCalendar(); }
function changeMonth(n) {
  periodMonth += n;
  if (periodMonth < 0) { periodMonth = 11; periodYear--; }
  if (periodMonth > 11) { periodMonth = 0; periodYear++; }
  document.getElementById('yearLabel').textContent = periodYear;
  document.getElementById('periodMonthTitle').textContent = periodYear+'年'+(periodMonth+1)+'月';
  renderCalendar();
}
function goToday() {
  const now = new Date();
  periodYear = now.getFullYear(); periodMonth = now.getMonth();
  document.getElementById('yearLabel').textContent = periodYear;
  document.getElementById('periodMonthTitle').textContent = periodYear+'年'+(periodMonth+1)+'月';
  renderCalendar();
}

function renderCalendar() {
  const data = getData();
  const grid = document.getElementById('calGrid');
  const today = todayStr();
  const firstDay = new Date(periodYear, periodMonth, 1);
  const lastDay = new Date(periodYear, periodMonth+1, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  let predictStart = null;
  if (data.periodStart) {
    const ps = new Date(data.periodStart);
    while (ps <= new Date(today)) ps.setDate(ps.getDate() + data.cycleLength);
    predictStart = ps.toISOString().slice(0,10);
  }

  let html = '';
  for (let i=0;i<startWeekday;i++) html += '<div class="cal-day"></div>';

  for (let d=1; d<=totalDays; d++) {
    const dateStr = `${periodYear}-${String(periodMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    let cls = '', mark='';

    if (data.periodStart && dateStr >= data.periodStart && dateStr <= addDays(data.periodStart, data.periodLength-1)) {
      cls = 'period'; if (dateStr === data.periodStart) mark = '▶';
    }
    if (predictStart && dateStr >= predictStart && dateStr <= addDays(predictStart, data.periodLength-1)) {
      if (cls !== 'period') cls = 'predict';
    }
    if (predictStart) {
      const ovuStart = addDays(predictStart, -14);
      if (dateStr >= ovuStart && dateStr <= addDays(ovuStart, 5)) { if (cls !== 'period') cls = 'oval'; }
      if (dateStr === addDays(predictStart, -14)) { if (cls !== 'period') cls = 'oval-day'; }
    }

    const rec = data.periodRecords[dateStr] || {};
    const hasRec = Object.keys(rec).length > 0;
    let icons = '';
    if (hasRec) {
      data.periodItems.forEach(item => {
        const v = rec[item.key];
        if (v === undefined || v === null || v === '' || v === false) return;
        icons += item.emoji;
      });
    }

    const isToday = dateStr === today;
    const isSelected = dateStr === selectedDay;
    html += `
      <div class="cal-day ${cls} ${isToday?'today':''} ${isSelected?'selected':''} ${hasRec?'has-record':''}" onclick="selectCalendarDay('${dateStr}')">
        <span class="cal-date">${d}</span>
        ${mark ? `<span style="font-size:8px;position:absolute;top:0">${mark}</span>` : ''}
        ${icons ? `<span class="cal-icons">${icons}</span>` : ''}
      </div>`;
  }
  grid.innerHTML = html;
  document.getElementById('periodMonthTitle').textContent = periodYear+'年'+(periodMonth+1)+'月';
  document.getElementById('yearLabel').textContent = periodYear;
}

function selectCalendarDay(dateStr) {
  selectedDay = dateStr;
  renderCalendar();
  renderPeriodList();
  renderDayPreview();
}

function renderDayPreview() {
  // 更新标题为选中日期
  const date = new Date(selectedDay);
  document.querySelector('.record-title-bar span').textContent = '🌷 ' + formatDateCN(selectedDay) + ' 速记';
}

function updatePeriodHero() {
  const data = getData(); const today = todayStr();
  if (!data.periodStart) {
    document.getElementById('phTitle').textContent = '未记录经期';
    document.getElementById('phEndDate').textContent = '--';
    document.getElementById('phChance').textContent = '--'; return;
  }
  const dayNum = diffDays(data.periodStart, today) + 1;
  document.getElementById('phTitle').textContent = '经期第 ' + (dayNum > 0 ? dayNum : 1) + ' 天';
  document.getElementById('phEndDate').textContent = formatDateShort(addDays(data.periodStart, data.periodLength-1));
  const daysSince = diffDays(data.periodStart, today);
  let chance = 3.2;
  if (daysSince >= 10 && daysSince <= 16) { chance = 28.5; if (daysSince === 14) chance = 32.0; }
  document.getElementById('phChance').textContent = chance + '%';
}

// ============= 经期项目列表 =============
function renderPeriodList() {
  const data = getData();
  const list = document.getElementById('recordList');
  const rec = data.periodRecords[selectedDay] || {};

  list.innerHTML = data.periodItems.map(item => {
    let v = rec[item.key];
    if (item.type === 'love') v = v===true || v==='有' ? '有' : (v ? v : '--');
    else if (item.type === 'mood') v = v || '--';
    else v = v || '--';
    return `
      <li class="period-item-wrap" data-key="${item.key}">
        <div class="period-item" id="pi-${item.key}" onclick="openItemModal('${item.key}','${selectedDay}')">
          <span class="ri-icon" style="background:${item.color}">${item.emoji}</span>
          <span class="ri-label">${item.label}</span>
          <span class="ri-val" id="val-${item.key}">${v}</span>
          <span class="ri-add">+</span>
        </div>
        <button class="period-delete-btn" onclick="deletePeriodItemRecord('${item.key}','${selectedDay}')">删除</button>
      </li>`;
  }).join('');

  bindPeriodItemSwipe(list);
}

function bindPeriodItemSwipe(container) {
  container.querySelectorAll('.period-item-wrap').forEach(wrap => {
    const item = wrap.querySelector('.period-item');
    let sx=0, sw=false;
    item.addEventListener('touchstart', e => { sx=e.touches[0].clientX; sw=false; });
    item.addEventListener('touchmove', e => {
      const dx = sx - e.touches[0].clientX;
      if (dx > 30 && !sw) { item.classList.add('swiped'); sw = true; }
      if (dx < -30 && sw) { item.classList.remove('swiped'); sw = false; }
    });
    document.addEventListener('click', ev => { if (!wrap.contains(ev.target) && item.classList.contains('swiped')) item.classList.remove('swiped'); });
  });
}

function deletePeriodItemRecord(key, dateStr) {
  const data = getData();
  if (data.periodRecords[dateStr]) {
    delete data.periodRecords[dateStr][key];
    if (Object.keys(data.periodRecords[dateStr]).length === 0) delete data.periodRecords[dateStr];
  }
  setData(data);
  renderCalendar(); renderPeriodList(); renderDayPreview();
  showToast('已删除');
}

// ============= 每日记录弹窗 =============
function openDayModal(dateStr) {
  selectCalendarDay(dateStr);
  document.getElementById('dayModalTitle').textContent = formatDateCN(dateStr);
  const data = getData();
  const rec = data.periodRecords[dateStr] || {};
  const container = document.getElementById('dayRecordsList');

  let recordsHtml = '';
  data.periodItems.forEach(item => {
    const v = rec[item.key];
    if (v === undefined || v === null || v === '' || v === false) return;
    const show = item.type==='love' ? (v===true||v==='有'?'有':'无') : v;
    recordsHtml += `
      <div class="day-record-item" onclick="openItemModal('${item.key}','${dateStr}')">
        <span class="dri-icon">${item.emoji}</span>
        <span class="dri-key">${item.label}</span>
        <span class="dri-val">${show}</span>
      </div>`;
  });

  let buttonsHtml = data.periodItems.map(item => `
    <button class="modal-btn save" onclick="openItemModal('${item.key}','${dateStr}')">${item.emoji} ${item.label}</button>
  `).join('');

  container.innerHTML = `
    ${recordsHtml ? `<div class="day-record-group"><h4>当日记录</h4>${recordsHtml}</div>` : '<div class="day-empty">🌷 这一天还没有记录</div>'}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px;">${buttonsHtml}</div>
  `;
  document.getElementById('dayOverlay').classList.add('show');
}

function closeDayModal(e) {
  if (e && e.target !== document.getElementById('dayOverlay')) return;
  document.getElementById('dayOverlay').classList.remove('show');
}

// ============= 记录弹窗 =============
let currentRecordKey = null;
let currentRecordDate = todayStr();

function openItemModal(key, dateStr) {
  currentRecordKey = key;
  currentRecordDate = dateStr || selectedDay || todayStr();
  const data = getData();
  const item = data.periodItems.find(i => i.key === key);
  if (!item) return;

  document.getElementById('modalTitle').textContent = item.emoji + ' ' + item.label;
  const body = document.getElementById('modalBody');

  if (item.type === 'mood') {
    // 心情弹窗
    document.getElementById('moodDateInput').value = currentRecordDate;
    selectedMood = null;
    document.querySelectorAll('.mood-opt').forEach(m => m.classList.remove('active'));
    document.getElementById('moodOverlay').classList.add('show');
    return;
  }

  let inputHtml = `<div class="modal-date-row"><label>日期：</label><input type="date" id="recordDateInput" value="${currentRecordDate}"></div>`;

  const quickOptions = {
    color: ['鲜红','暗红','褐色','粉色','黑色'],
    pain: ['无痛','轻度','中度','严重'],
    symptom: ['头痛','腹痛','乳房胀痛','腰酸','乏力','恶心'],
    discharge: ['正常','增多','减少','异常'],
    temp: ['36.0','36.3','36.5','36.8','37.0','37.3'],
    weight: ['50.0','55.0','60.0','65.0','70.0'],
    medicine: ['维生素','布洛芬','叶酸','止痛药','感冒药']
  };

  if (item.type === 'love') {
    inputHtml += `
      <div style="display:flex;gap:10px;margin-top:8px;">
        <button type="button" id="loveYes" onclick="setLoveValue(true)" style="flex:1;padding:12px;border:1.5px solid var(--primary-light);border-radius:12px;background:#fff;font-size:15px;">有</button>
        <button type="button" id="loveNo" onclick="setLoveValue(false)" style="flex:1;padding:12px;border:1.5px solid var(--primary-light);border-radius:12px;background:#fff;font-size:15px;">无</button>
      </div>
      <input type="hidden" id="recordValInput">`;
  } else {
    const ph = { color:'如：鲜红、暗红、褐色', pain:'如：无痛、轻度、中度、严重', symptom:'如：头痛、腹痛、乳房胀痛',
                 discharge:'如：正常、增多、异常', temp:'如：36.5℃', weight:'如：60.8kg', medicine:'如：维生素、布洛芬、叶酸' };
    const opts = quickOptions[key] || [];
    let optsHtml = '';
    if (opts.length) {
      optsHtml = `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;">
        ${opts.map(o => `<button type="button" class="quick-opt-btn" onclick="setRecordVal('${o.replace(/'/g,'\\\'')}')">${o}</button>`).join('')}
        <button type="button" class="quick-opt-btn edit" onclick="focusRecordInput()">✏️ 编辑</button>
      </div>`;
    }
    inputHtml += optsHtml + `<input type="text" id="recordValInput" placeholder="${ph[key] || '请输入'}" style="width:100%;padding:10px;border:1.5px solid var(--primary-light);border-radius:10px;font-size:14px;">`;
  }

  body.innerHTML = inputHtml;
  document.getElementById('modalOverlay').classList.add('show');
  if (item.type === 'love') setTimeout(() => setLoveValue(true), 50);
}

function setRecordVal(val) {
  const input = document.getElementById('recordValInput');
  input.value = val;
  input.style.background = 'var(--primary-light)';
  setTimeout(() => input.style.background = '#fff', 200);
}

function focusRecordInput() {
  document.getElementById('recordValInput').focus();
}

function setLoveValue(val) {
  document.getElementById('recordValInput').value = val ? '有' : '无';
  document.getElementById('loveYes').style.background = val ? 'var(--primary-light)' : '#fff';
  document.getElementById('loveYes').style.borderColor = val ? 'var(--primary)' : 'var(--primary-light)';
  document.getElementById('loveNo').style.background = val ? '#fff' : 'var(--primary-light)';
  document.getElementById('loveNo').style.borderColor = val ? 'var(--primary-light)' : 'var(--primary)';
}

function savePeriodRecord() {
  const date = document.getElementById('recordDateInput').value;
  const val = document.getElementById('recordValInput').value;
  if (!date) { showToast('请选择日期'); return; }

  const data = getData();
  const item = data.periodItems.find(i => i.key === currentRecordKey);
  if (!item) return;
  if (item.type === 'love' && !val) { showToast('请选择有无'); return; }
  if (item.type !== 'love' && item.type !== 'mood' && !val) { showToast('请输入内容'); return; }

  if (!data.periodRecords[date]) data.periodRecords[date] = {};
  data.periodRecords[date][currentRecordKey] = item.type==='love' ? (val==='有'?true:false) : val;
  setData(data);

  closeModal();
  selectedDay = date;
  renderCalendar();
  renderPeriodList();
  renderDayPreview();
  if (document.getElementById('dayOverlay').classList.contains('show')) openDayModal(date);
  showToast('✓ 已保存');
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modalOverlay')) return;
  document.getElementById('modalOverlay').classList.remove('show');
}

// ============= 心情弹窗 =============
let selectedMood = null;
function selectMood(mood) { selectedMood = mood; document.querySelectorAll('.mood-opt').forEach(m => m.classList.remove('active')); document.querySelector(`.mood-opt[data-mood="${mood}"]`).classList.add('active'); }
function saveMoodRecord() {
  if (!selectedMood) { showToast('请选择一个心情'); return; }
  const date = document.getElementById('moodDateInput').value;
  if (!date) { showToast('请选择日期'); return; }
  const data = getData();
  if (!data.periodRecords[date]) data.periodRecords[date] = {};
  data.periodRecords[date]['mood'] = selectedMood;
  setData(data);
  document.getElementById('moodOverlay').classList.remove('show');
  selectedDay = date;
  renderCalendar(); renderPeriodList(); renderDayPreview();
  if (document.getElementById('dayOverlay').classList.contains('show')) openDayModal(date);
  showToast('✓ 心情已保存');
}
function closeMoodModal(e) {
  if (e && e.target !== document.getElementById('moodOverlay')) return;
  document.getElementById('moodOverlay').classList.remove('show');
}

// ============= 编辑经期项目 =============
let editingPeriodKey = null;

function editPeriodItems() {
  const data = getData();
  const itemsHtml = data.periodItems.map(item => `
    <div class="edit-period-row" onclick="openPeriodItemEdit('${item.key}')">
      <span>${item.emoji} ${item.label}</span>
      <span>${item.type==='text'?'文字':(item.type==='love'?'有/无':'心情')}</span>
    </div>
  `).join('');

  document.getElementById('editModalTitle').textContent = '编辑经期项目';
  document.getElementById('editModalBody').innerHTML = `
    <div style="margin-bottom:12px;">${itemsHtml}</div>
    <div class="edit-add-row">
      <input type="text" id="newPeriodEmoji" placeholder="图标" maxlength="2">
      <input type="text" id="newPeriodLabel" placeholder="名称">
      <select id="newPeriodType"><option value="text">文字</option><option value="love">有/无</option><option value="mood">心情</option></select>
      <button class="modal-btn save" style="flex:0 0 auto;" onclick="addPeriodItem()">添加</button>
    </div>
  `;
  document.getElementById('editDeleteBtn').style.display = 'none';
  document.getElementById('editOverlay').classList.add('show');
}

function openPeriodItemEdit(key) {
  editingPeriodKey = key;
  const data = getData();
  const item = data.periodItems.find(i => i.key === key);
  document.getElementById('editModalBody').innerHTML = `
    <div class="modal-date-row"><label>图标：</label><input type="text" id="editPeriodEmoji" value="${item.emoji}" maxlength="2"></div>
    <div class="modal-date-row"><label>名称：</label><input type="text" id="editPeriodLabel" value="${item.label}"></div>
    <div class="modal-date-row"><label>类型：</label>
      <select id="editPeriodType" style="flex:1;padding:8px 12px;border:1.5px solid var(--primary-light);border-radius:10px;background:#faf8ff;">
        <option value="text" ${item.type==='text'?'selected':''}>文字</option>
        <option value="love" ${item.type==='love'?'selected':''}>有/无</option>
        <option value="mood" ${item.type==='mood'?'selected':''}>心情</option>
      </select>
    </div>
  `;
  document.getElementById('editDeleteBtn').style.display = 'block';
}

function addPeriodItem() {
  const emoji = document.getElementById('newPeriodEmoji').value || '📌';
  const label = document.getElementById('newPeriodLabel').value.trim();
  const type = document.getElementById('newPeriodType').value;
  if (!label) { showToast('请输入名称'); return; }
  const data = getData();
  const key = 'p_' + generateId();
  if (data.periodItems.find(i => i.label === label)) { showToast('项目已存在'); return; }
  data.periodItems.push({ key, label, emoji, color: '#f3e8ff', type });
  setData(data); renderPeriodList(); renderCalendar(); editPeriodItems(); showToast('已添加');
}

function saveEditItem() {
  const title = document.getElementById('editModalTitle').textContent;
  if (title === '编辑经期项目') {
    if (!editingPeriodKey) return;
    const emoji = document.getElementById('editPeriodEmoji').value || '📌';
    const label = document.getElementById('editPeriodLabel').value.trim();
    const type = document.getElementById('editPeriodType').value;
    if (!label) { showToast('请输入名称'); return; }
    const data = getData();
    const item = data.periodItems.find(i => i.key === editingPeriodKey);
    if (item) {
      if (label !== item.label && data.periodItems.find(i => i.label === label)) { showToast('名称已存在'); return; }
      item.emoji = emoji; item.label = label; item.type = type;
      setData(data); renderPeriodList(); renderCalendar(); editPeriodItems(); showToast('已保存');
    }
  } else if (title === '编辑类别') {
    if (!editingCatName) return;
    const emoji = document.getElementById('editCatEmoji').value || '📌';
    const name = document.getElementById('editCatName').value.trim();
    if (!name) { showToast('请输入名称'); return; }
    const data = getData();
    const target = editCatType==='out' ? data.categoriesOut : data.categoriesIn;
    const idx = target.findIndex(c => c.name === editingCatName);
    if (idx >= 0) {
      if (name !== editingCatName && target.find(c => c.name === name)) { showToast('名称已存在'); return; }
      target[idx] = { name, emoji };
      data.records.forEach(r => { if (r.type===editCatType && r.category===editingCatName) { r.category=name; r.emoji=emoji; } });
      setData(data); renderCategories(); renderRecentList(); editMoneyCategories(); showToast('已保存');
    }
  }
}

function deleteEditItem() {
  const title = document.getElementById('editModalTitle').textContent;
  if (title === '编辑经期项目') {
    if (!editingPeriodKey) return;
    const data = getData();
    data.periodItems = data.periodItems.filter(i => i.key !== editingPeriodKey);
    Object.keys(data.periodRecords).forEach(date => {
      delete data.periodRecords[date][editingPeriodKey];
      if (Object.keys(data.periodRecords[date]).length === 0) delete data.periodRecords[date];
    });
    setData(data); renderPeriodList(); renderCalendar(); editPeriodItems(); showToast('已删除');
  } else if (title === '编辑类别') {
    if (!editingCatName) return;
    const data = getData();
    const target = editCatType==='out' ? data.categoriesOut : data.categoriesIn;
    const idx = target.findIndex(c => c.name === editingCatName);
    if (idx >= 0) { target.splice(idx, 1); setData(data); renderCategories(); renderRecentList(); editMoneyCategories(); showToast('已删除'); }
  }
}

function closeEditModal(e) {
  if (e && e.target !== document.getElementById('editOverlay')) return;
  document.getElementById('editOverlay').classList.remove('show');
  editingCatName = null; editingPeriodKey = null;
}

// ============= 启动 =============
function showSplash() {
  const splash = document.getElementById('splashScreen');
  const visited = sessionStorage.getItem('workbench-launched');
  if (visited) { splash.style.display='none'; initApp(); }
  else { setTimeout(() => { splash.classList.add('hide'); setTimeout(() => splash.style.display='none', 600); }, 2200); sessionStorage.setItem('workbench-launched','1'); initApp(); }
}

function initApp() {
  const data = getData();
  currentBook = 'all'; currentType = 'out'; currentAmount = '0';
  const cats = getCategories('out');
  currentCategory = cats[0].name;
  recordDate = todayStr();
  document.getElementById('recordDateInput').value = recordDate;
  document.getElementById('dateText').textContent = formatDateCN(recordDate);

  switchBook('all'); switchType('out');
  renderMoneySummary(); renderRecentList();

  const now = new Date();
  periodYear = now.getFullYear(); periodMonth = now.getMonth();
  document.getElementById('yearLabel').textContent = periodYear;
  document.getElementById('periodMonthTitle').textContent = periodYear+'年'+(periodMonth+1)+'月';

  document.getElementById('amountDisplay').addEventListener('click', () => {
    const val = prompt('请输入金额：', currentAmount==='0' ? '' : currentAmount);
    if (val === null) return;
    const clean = val.replace(/[^0-9.]/g, '');
    if (clean) { currentAmount = clean; document.getElementById('amountDisplay').textContent = clean; }
  });

  updatePeriodHero(); renderPeriodList(); renderDayPreview();
}

document.addEventListener('DOMContentLoaded', showSplash);
