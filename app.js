// ============= 数据存储 =============
const STORE_KEY = 'workbench-v3';

function getData() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || defaultData(); }
  catch { return defaultData(); }
}
function setData(data) { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }

function defaultData() {
  return {
    currentBook: 'all',
    currentType: 'out',
    currentCategory: '餐饮',
    records: [], // {id, book:'family'|'personal', type:'in'|'out', amount, category, emoji, note, date, time}
    periodStart: null,
    periodLength: 5,
    cycleLength: 28,
    periodRecords: {} // { '2026-07-29': { color:'红', pain:'轻度', love:true, symptom:'头痛', mood:'😀', discharge:'正常', temp:'36.5', weight:'60.8', medicine:'维生素' } }
  };
}

// ============= 分类数据 =============
const CATEGORIES = {
  out: [
    { name: '餐饮', emoji: '🍚' }, { name: '交通', emoji: '🚗' }, { name: '购物', emoji: '🛍️' },
    { name: '居家', emoji: '🏠' }, { name: '娱乐', emoji: '🎮' }, { name: '医疗', emoji: '💊' },
    { name: '教育', emoji: '📚' }, { name: '通讯', emoji: '📱' }, { name: '人情', emoji: '🎁' },
    { name: '水电', emoji: '💡' }, { name: '服饰', emoji: '👕' }, { name: '零食', emoji: '🍪' },
    { name: '宠物', emoji: '🐶' }, { name: '其他', emoji: '📌' }, { name: '编辑', emoji: '✏️' }
  ],
  in: [
    { name: '工资', emoji: '💵' }, { name: '奖金', emoji: '🧧' }, { name: '理财', emoji: '📈' },
    { name: '兼职', emoji: '💻' }, { name: '红包', emoji: '🎉' }, { name: '其他', emoji: '📌' }
  ]
};

const BOOK_LABELS = { all: '总账', family: '家庭开销', personal: '个人开支' };
const BOOK_TITLES = { all: '我们家的记账本', family: '家庭开销', personal: '个人开支' };
const BOOK_SUBS = { all: '一家人在一起的每一笔小日子', family: '家里的每一笔开销', personal: '记录属于你的每一笔' };

// ============= 工具 =============
let toastTimer = null;
function showToast(text) {
  const t = document.getElementById('toast');
  t.textContent = text; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

function todayStr() { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function formatDateCN(d) { const date = new Date(d); return date.getFullYear()+'年'+(date.getMonth()+1)+'月'+date.getDate()+'日'; }
function formatDateShort(d) { const date = new Date(d); return (date.getMonth()+1)+'月'+date.getDate()+'日'; }
function diffDays(d1,d2) { return Math.round((new Date(d2)-new Date(d1))/86400000); }
function addDays(d,n) { const date = new Date(d); date.setDate(date.getDate()+n); return date.toISOString().slice(0,10); }

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

// ============= Tab切换 =============
function switchTab(tab) {
  document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-'+tab).classList.add('active');
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  document.querySelector(`.tab-item[data-tab="${tab}"]`).classList.add('active');
  if (tab === 'period') { renderCalendar(); updatePeriodHero(); updatePeriodRecordVals(); }
}

// ============= 存钱页 =============
let currentBook = 'all';
let currentType = 'out';
let currentCategory = '餐饮';
let currentAmount = '0';
let recentFilter = 'all';

function switchBook(book) {
  currentBook = book;
  document.querySelectorAll('.account-pill').forEach(b => b.classList.remove('active'));
  document.querySelector(`.account-pill[data-book="${book}"]`).classList.add('active');

  document.getElementById('summaryTitle').textContent = BOOK_TITLES[book];
  document.getElementById('summarySub').textContent = BOOK_SUBS[book];
  document.getElementById('recentTitle').textContent = '最近的小账本 - ' + BOOK_LABELS[book];

  renderMoneySummary();
  renderRecentList();
}

function switchType(type) {
  currentType = type;
  currentCategory = type === 'out' ? '餐饮' : '工资';
  currentAmount = '0';
  document.getElementById('amountDisplay').textContent = '0';
  document.querySelectorAll('.tt-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.tt-btn[data-type="${type}"]`).classList.add('active');
  renderCategories();
}

function renderCategories() {
  const grid = document.getElementById('categoryGrid');
  const list = CATEGORIES[currentType];
  grid.innerHTML = list.map(c => `
    <div class="cat-item ${c.name===currentCategory?'active':''}" onclick="selectCategory('${c.name}')">
      <div class="cat-emoji">${c.emoji}</div>
      <div class="cat-name">${c.name}</div>
    </div>
  `).join('');
}

function selectCategory(name) { currentCategory = name; renderCategories(); }

function clearAmount() { currentAmount = '0'; document.getElementById('amountDisplay').textContent = '0'; }

function saveRecord() {
  const amount = parseFloat(currentAmount);
  if (isNaN(amount) || amount <= 0) { showToast('请输入金额'); return; }
  if (currentBook === 'all') { showToast('请选择「家庭开销」或「个人开支」记账'); return; }

  const data = getData();
  const note = document.getElementById('noteInput').value;
  const cat = CATEGORIES[currentType].find(c => c.name === currentCategory);

  data.records.unshift({
    id: generateId(),
    book: currentBook,
    type: currentType,
    amount: amount,
    category: currentCategory,
    emoji: cat.emoji,
    note: note,
    date: todayStr(),
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  });

  setData(data);
  currentAmount = '0';
  document.getElementById('amountDisplay').textContent = '0';
  document.getElementById('noteInput').value = '';
  renderMoneySummary();
  renderRecentList();
  showToast('✓ 已记一笔' + (currentType === 'out' ? '支出' : '收入') + ' - ' + BOOK_LABELS[currentBook]);
}

function deleteRecord(id) {
  if (!confirm('确定删除这条记录吗？')) return;
  const data = getData();
  data.records = data.records.filter(r => r.id !== id);
  setData(data);
  renderMoneySummary();
  renderRecentList();
  showToast('已删除');
}

function filterRecent(type) {
  recentFilter = type;
  document.querySelectorAll('.rf-pill').forEach(b => b.classList.remove('active'));
  document.querySelector(`.rf-pill[onclick*="${type}"]`).classList.add('active');
  renderRecentList();
}

function renderMoneySummary() {
  const data = getData();
  const records = currentBook === 'all' ? data.records : data.records.filter(r => r.book === currentBook);
  let totalIn = 0, totalOut = 0;
  records.forEach(r => { if (r.type === 'in') totalIn += r.amount; else totalOut += r.amount; });
  document.getElementById('totalIn').textContent = totalIn.toFixed(2);
  document.getElementById('totalOut').textContent = totalOut.toFixed(2);
  document.getElementById('balance').textContent = (totalIn - totalOut).toFixed(2);
  document.getElementById('count').textContent = records.length;
}

function renderRecentList() {
  const data = getData();
  let records = currentBook === 'all' ? data.records : data.records.filter(r => r.book === currentBook);
  if (recentFilter !== 'all') records = records.filter(r => r.type === recentFilter);

  const empty = document.getElementById('recentEmpty');
  const list = document.getElementById('recentList');
  if (!records.length) { empty.style.display = 'block'; list.style.display = 'none'; return; }
  empty.style.display = 'none'; list.style.display = 'block';

  list.innerHTML = records.slice(0, 30).map(r => `
    <li class="rl-item-wrap" data-id="${r.id}">
      <div class="rl-item" id="ri-${r.id}">
        <div class="rl-left">
          <div class="rl-icon">${r.emoji}</div>
          <div class="rl-info">
            <span class="rl-cat">${r.category}</span>
            <span class="rl-note">${r.note || r.date + ' ' + r.time}
              <span class="rl-book-tag">${BOOK_LABELS[r.book]}</span>
            </span>
          </div>
        </div>
        <div class="rl-right">
          <div class="rl-amount ${r.type}">${r.type==='in'?'+':'-'}¥${r.amount.toFixed(2)}</div>
          <div class="rl-time">${r.time}</div>
        </div>
      </div>
      <button class="rl-delete-btn" onclick="deleteRecord('${r.id}')">删除</button>
    </li>
  `).join('');

  // 绑定滑动事件
  list.querySelectorAll('.rl-item-wrap').forEach(wrap => {
    const item = wrap.querySelector('.rl-item');
    let startX = 0, curX = 0, swiped = false;
    item.addEventListener('touchstart', e => { startX = e.touches[0].clientX; swiped = false; });
    item.addEventListener('touchmove', e => {
      curX = e.touches[0].clientX;
      const dx = startX - curX;
      if (dx > 20 && !swiped) { item.classList.add('swiped'); swiped = true; }
      if (dx < -20 && swiped) { item.classList.remove('swiped'); swiped = false; }
    });
    item.addEventListener('touchend', () => {});
    // 点击其他地方收起
    document.addEventListener('click', ev => { if (!wrap.contains(ev.target) && item.classList.contains('swiped')) item.classList.remove('swiped'); });
  });
}

// ============= 经期页 - 日历 =============
let periodYear = new Date().getFullYear();
let periodMonth = new Date().getMonth(); // 0-based

function changeYear(n) {
  periodYear += n;
  document.getElementById('yearLabel').textContent = periodYear;
  renderCalendar();
}

function changeMonth(n) {
  periodMonth += n;
  if (periodMonth < 0) { periodMonth = 11; periodYear--; }
  if (periodMonth > 11) { periodMonth = 0; periodYear++; }
  document.getElementById('yearLabel').textContent = periodYear;
  document.getElementById('periodMonthTitle').textContent = periodYear + '年' + (periodMonth+1) + '月';
  renderCalendar();
}

function goToday() {
  const now = new Date();
  periodYear = now.getFullYear();
  periodMonth = now.getMonth();
  document.getElementById('yearLabel').textContent = periodYear;
  document.getElementById('periodMonthTitle').textContent = periodYear + '年' + (periodMonth+1) + '月';
  renderCalendar();
}

const PERIOD_RECORD_EMOJI = {
  color: '🎨', pain: '⚡', love: '💗', symptom: '💊', mood: null,
  discharge: '🪻', temp: '🌡️', weight: '💜', medicine: '💊'
};

function renderCalendar() {
  const data = getData();
  const grid = document.getElementById('calGrid');
  const today = todayStr();

  const firstDay = new Date(periodYear, periodMonth, 1);
  const lastDay = new Date(periodYear, periodMonth+1, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  let periodStart = data.periodStart;
  let predictStart = null;
  if (periodStart) {
    const ps = new Date(periodStart);
    while (ps <= new Date(today)) ps.setDate(ps.getDate() + data.cycleLength);
    predictStart = ps.toISOString().slice(0, 10);
  }

  let html = '';
  for (let i = 0; i < startWeekday; i++) html += '<div class="cal-day"></div>';

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${periodYear}-${String(periodMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    let cls = '', mark = '';

    if (periodStart && dateStr >= periodStart && dateStr <= addDays(periodStart, data.periodLength-1)) {
      cls = 'period';
      if (dateStr === periodStart) mark = '▶';
    }
    if (predictStart && dateStr >= predictStart && dateStr <= addDays(predictStart, data.periodLength-1)) {
      if (cls !== 'period') cls = 'predict';
    }
    if (predictStart) {
      const ovuStart = addDays(predictStart, -14);
      if (dateStr >= ovuStart && dateStr <= addDays(ovuStart, 5)) { if (cls !== 'period') cls = 'oval'; }
      if (dateStr === addDays(predictStart, -14)) { if (cls !== 'period') cls = 'oval-day'; }
    }

    // 检查是否有记录
    const hasRec = data.periodRecords[dateStr] && Object.keys(data.periodRecords[dateStr]).length > 0;
    let icons = '';
    if (hasRec) {
      const rec = data.periodRecords[dateStr];
      if (rec.love) icons += '💗';
      if (rec.mood) icons += rec.mood;
      if (rec.medicine) icons += '💊';
      if (rec.pain) icons += '⚡';
    }

    const isToday = dateStr === today;
    html += `
      <div class="cal-day ${cls} ${isToday?'today':''} ${hasRec?'has-record':''}" onclick="onCalDayClick('${dateStr}')">
        <span class="cal-date">${d}</span>
        ${mark ? `<span style="font-size:8px;position:absolute;top:1px">${mark}</span>` : ''}
        ${icons ? `<span class="cal-icons">${icons}</span>` : ''}
      </div>
    `;
  }

  grid.innerHTML = html;
  document.getElementById('periodMonthTitle').textContent = periodYear + '年' + (periodMonth+1) + '月';
  document.getElementById('yearLabel').textContent = periodYear;
}

function onCalDayClick(dateStr) {
  const data = getData();
  const today = todayStr();
  if (dateStr <= today) {
    if (data.periodStart === dateStr) {
      if (!confirm('取消标记经期开始？')) return;
      data.periodStart = null;
    } else {
      data.periodStart = dateStr;
      showToast('🌷 已标记经期开始: ' + formatDateShort(dateStr));
    }
    setData(data);
    renderCalendar();
    updatePeriodHero();
  }
}

function updatePeriodHero() {
  const data = getData();
  const today = todayStr();
  if (!data.periodStart) {
    document.getElementById('phTitle').textContent = '未记录经期';
    document.getElementById('phEndDate').textContent = '--';
    document.getElementById('phChance').textContent = '--';
    return;
  }
  const dayNum = diffDays(data.periodStart, today) + 1;
  const endDate = addDays(data.periodStart, data.periodLength - 1);
  document.getElementById('phTitle').textContent = '经期第 ' + (dayNum > 0 ? dayNum : 1) + ' 天';
  document.getElementById('phEndDate').textContent = formatDateShort(endDate);

  const daysSince = diffDays(data.periodStart, today);
  let chance = 3.2;
  if (daysSince >= 10 && daysSince <= 16) { chance = 28.5; if (daysSince === 14) chance = 32.0; }
  document.getElementById('phChance').textContent = chance + '%';
}

// ============= 经期记录弹窗 =============
let currentRecordKey = null;

function openRecordModal(title, emoji, key) {
  currentRecordKey = key;
  document.getElementById('modalTitle').textContent = emoji + ' ' + title;
  const body = document.getElementById('modalBody');

  const data = getData();
  const records = data.periodRecords;
  const history = Object.entries(records)
    .filter(([date, val]) => val[key] !== undefined && val[key] !== null && val[key] !== '' && val[key] !== false)
    .sort((a, b) => b[0].localeCompare(a[0]));

  const placeholders = {
    color: '如：鲜红、暗红、褐色...',
    pain: '如：无痛、轻度、中度、严重',
    love: '如：有/无',
    symptom: '如：头痛、腹痛、乳房胀痛',
    discharge: '如：正常、增多、异常',
    temp: '如：36.5℃',
    weight: '如：60.8kg',
    medicine: '如：维生素、布洛芬、叶酸'
  };

  body.innerHTML = `
    <div class="modal-date-row">
      <label>日期：</label>
      <input type="date" id="recordDateInput" value="${todayStr()}">
    </div>
    <input type="text" id="recordValInput" placeholder="${placeholders[key] || '请输入'}" style="width:100%;padding:10px;border:1.5px solid var(--primary-light);border-radius:10px;font-size:14px;margin-bottom:4px;">
    ${history.length > 0 ? `
      <div style="font-size:13px;color:var(--text-light);margin:8px 0 4px;">历史记录（左滑删除）</div>
      <ul class="record-history-list" id="recordHistoryList">
        ${history.map(([date, val]) => `
          <li data-date="${date}">
            <div class="rh-item-inner" id="rhi-${date}-${key}">
              <span class="rh-date">${date}</span>
              <span class="rh-val">${val[key]}</span>
            </div>
            <button class="rh-delete-btn" onclick="deletePeriodRecord('${date}','${key}')">删除</button>
          </li>
        `).join('')}
      </ul>
    ` : '<div class="rh-empty">暂无历史记录</div>'}
  `;

  // 绑定滑动删除
  setTimeout(() => {
    const list = document.getElementById('recordHistoryList');
    if (!list) return;
    list.querySelectorAll('li').forEach(li => {
      const inner = li.querySelector('.rh-item-inner');
      let sx = 0, sw = false;
      inner.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sw = false; });
      inner.addEventListener('touchmove', e => {
        const dx = sx - e.touches[0].clientX;
        if (dx > 20 && !sw) { inner.classList.add('swiped'); sw = true; }
        if (dx < -20 && sw) { inner.classList.remove('swiped'); sw = false; }
      });
      document.addEventListener('click', ev => { if (!li.contains(ev.target) && inner.classList.contains('swiped')) inner.classList.remove('swiped'); });
    });
  }, 100);

  document.getElementById('modalOverlay').classList.add('show');
}

function savePeriodRecord() {
  const date = document.getElementById('recordDateInput').value;
  const val = document.getElementById('recordValInput').value;
  if (!date) { showToast('请选择日期'); return; }

  const data = getData();
  if (!data.periodRecords[date]) data.periodRecords[date] = {};
  data.periodRecords[date][currentRecordKey] = val;
  setData(data);

  closeModal();
  renderCalendar();
  updatePeriodRecordVals();
  showToast('✓ 已保存');
}

function deletePeriodRecord(date, key) {
  if (!confirm('确定删除这条记录吗？')) return;
  const data = getData();
  if (data.periodRecords[date]) {
    delete data.periodRecords[date][key];
    if (Object.keys(data.periodRecords[date]).length === 0) delete data.periodRecords[date];
  }
  setData(data);
  renderCalendar();
  updatePeriodRecordVals();
  openRecordModal(document.getElementById('modalTitle').textContent.replace(/^[^\s]+\s/, ''), '', currentRecordKey);
  showToast('已删除');
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modalOverlay')) return;
  document.getElementById('modalOverlay').classList.remove('show');
}

// ============= 心情弹窗 =============
let selectedMood = null;

function openMoodModal() {
  selectedMood = null;
  document.getElementById('moodDateInput').value = todayStr();
  document.querySelectorAll('.mood-opt').forEach(m => m.classList.remove('active'));
  document.getElementById('moodOverlay').classList.add('show');
}

function selectMood(mood) {
  selectedMood = mood;
  document.querySelectorAll('.mood-opt').forEach(m => m.classList.remove('active'));
  document.querySelector(`.mood-opt[data-mood="${mood}"]`).classList.add('active');
}

function saveMoodRecord() {
  if (!selectedMood) { showToast('请选择一个心情'); return; }
  const date = document.getElementById('moodDateInput').value;
  if (!date) { showToast('请选择日期'); return; }

  const data = getData();
  if (!data.periodRecords[date]) data.periodRecords[date] = {};
  data.periodRecords[date]['mood'] = selectedMood;
  setData(data);

  document.getElementById('moodOverlay').classList.remove('show');
  renderCalendar();
  updatePeriodRecordVals();
  showToast('✓ 心情已保存');
}

function closeMoodModal(e) {
  if (e && e.target !== document.getElementById('moodOverlay')) return;
  document.getElementById('moodOverlay').classList.remove('show');
}

// ============= 更新记录列表的值显示 =============
function updatePeriodRecordVals() {
  const data = getData();
  const today = todayStr();
  const rec = data.periodRecords[today] || {};

  const keys = ['color','pain','love','symptom','mood','discharge','temp','weight','medicine'];
  const labels = { color:'颜色', pain:'痛经', love:'爱爱', symptom:'症状', mood:'心情', discharge:'白带', temp:'体温', weight:'体重', medicine:'吃药' };

  keys.forEach(k => {
    const el = document.getElementById('val-' + k);
    if (el) {
      let v = rec[k];
      if (k === 'love') v = v === 'true' || v === true ? '有' : (v ? v : '--');
      else if (v === undefined || v === null || v === '') v = '--';
      el.textContent = v;
    }
  });
}

// ============= 启动封面 =============
function showSplash() {
  const splash = document.getElementById('splashScreen');
  const visited = sessionStorage.getItem('workbench-launched');
  if (visited) { splash.style.display = 'none'; initApp(); }
  else {
    setTimeout(() => { splash.classList.add('hide'); setTimeout(() => splash.style.display = 'none', 600); }, 2200);
    sessionStorage.setItem('workbench-launched', '1');
    initApp();
  }
}

// ============= 初始化 =============
function initApp() {
  const data = getData();

  currentBook = data.currentBook || 'all';
  currentType = data.currentType || 'out';
  currentCategory = data.currentCategory || '餐饮';
  currentAmount = '0';

  switchBook(currentBook);
  switchType(currentType);
  renderMoneySummary();
  renderRecentList();

  document.getElementById('dateText').textContent = formatDateCN(new Date());

  const now = new Date();
  document.getElementById('statusTime').textContent = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  periodYear = now.getFullYear();
  periodMonth = now.getMonth();
  document.getElementById('yearLabel').textContent = periodYear;
  document.getElementById('periodMonthTitle').textContent = periodYear+'年'+(periodMonth+1)+'月';

  document.getElementById('amountDisplay').addEventListener('click', () => {
    const val = prompt('请输入金额：', currentAmount === '0' ? '' : currentAmount);
    if (val === null) return;
    const clean = val.replace(/[^0-9.]/g, '');
    if (clean) { currentAmount = clean; document.getElementById('amountDisplay').textContent = clean; }
  });

  updatePeriodHero();
  updatePeriodRecordVals();

  // 添加主屏幕提示
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (!isStandalone && !localStorage.getItem('workbench-homescreen-hint')) {
    setTimeout(() => {
      const ah = document.getElementById('addHomescreen');
      if (ah) { ah.style.display = 'block'; localStorage.setItem('workbench-homescreen-hint','1'); setTimeout(() => ah.style.display = 'none', 6000); }
    }, 1200);
  }
}

setInterval(() => {
  const now = new Date();
  const t = document.getElementById('statusTime');
  if (t) t.textContent = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
}, 30000);

document.addEventListener('DOMContentLoaded', showSplash);
