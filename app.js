// ============= 数据存储 =============
const STORE_KEY = 'workbench-v2';

function getData() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || defaultData();
  } catch {
    return defaultData();
  }
}

function setData(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function defaultData() {
  return {
    currentType: 'out',
    currentCategory: '餐饮',
    records: [],
    periodStart: null,
    periodLength: 5,
    cycleLength: 28,
    weight: 60.8,
    medicine: []
  };
}

// ============= 分类数据 =============
const CATEGORIES = {
  out: [
    { name: '餐饮', emoji: '🍚', color: '#ff7ea8' },
    { name: '交通', emoji: '🚗', color: '#ff7ea8' },
    { name: '购物', emoji: '🛍️', color: '#ff7ea8' },
    { name: '居家', emoji: '🏠', color: '#ff7ea8' },
    { name: '娱乐', emoji: '🎮', color: '#ff7ea8' },
    { name: '医疗', emoji: '💊', color: '#ff7ea8' },
    { name: '教育', emoji: '📚', color: '#ff7ea8' },
    { name: '通讯', emoji: '📱', color: '#ff7ea8' },
    { name: '人情', emoji: '🎁', color: '#ff7ea8' },
    { name: '水电', emoji: '💡', color: '#ff7ea8' },
    { name: '服饰', emoji: '👕', color: '#ff7ea8' },
    { name: '零食', emoji: '🍪', color: '#ff7ea8' },
    { name: '宠物', emoji: '🐶', color: '#ff7ea8' },
    { name: '其他', emoji: '📌', color: '#ff7ea8' },
    { name: '编辑', emoji: '✏️', color: '#ff7ea8' }
  ],
  in: [
    { name: '工资', emoji: '💵', color: '#ff9f43' },
    { name: '奖金', emoji: '🧧', color: '#ff9f43' },
    { name: '理财', emoji: '📈', color: '#ff9f43' },
    { name: '兼职', emoji: '💻', color: '#ff9f43' },
    { name: '红包', emoji: '🎉', color: '#ff9f43' },
    { name: '其他', emoji: '📌', color: '#ff9f43' }
  ]
};

// ============= 通用工具 =============
let toastTimer = null;
function showToast(text) {
  const toast = document.getElementById('toast');
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatDateCN(d) {
  const date = new Date(d);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatDateShort(d) {
  const date = new Date(d);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function diffDays(d1, d2) {
  const a = new Date(d1);
  const b = new Date(d2);
  return Math.round((b - a) / (86400000));
}

function addDays(d, n) {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date.toISOString().slice(0, 10);
}

// ============= Tab 切换 =============
function switchTab(tab) {
  document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + tab).classList.add('active');

  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  document.querySelector(`.tab-item[data-tab="${tab}"]`).classList.add('active');

  if (tab === 'period') {
    renderPeriodCalendar();
    updatePeriodHero();
  }
}

// ============= 存钱页 =============
let currentType = 'out';
let currentCategory = '餐饮';
let currentAmount = '0';

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
    <div class="cat-item ${c.name === currentCategory ? 'active' : ''}" onclick="selectCategory('${c.name}')">
      <div class="cat-emoji" style="background:${c.name === currentCategory ? (currentType === 'out' ? '#ff7ea8' : '#ff9f43') : '#fff5f8'}">${c.emoji}</div>
      <div class="cat-name">${c.name}</div>
    </div>
  `).join('');
}

function selectCategory(name) {
  currentCategory = name;
  renderCategories();
}

function clearAmount() {
  currentAmount = '0';
  document.getElementById('amountDisplay').textContent = '0';
}

function appendDigit(digit) {
  if (currentAmount === '0') {
    currentAmount = digit;
  } else {
    currentAmount += digit;
  }
  document.getElementById('amountDisplay').textContent = currentAmount;
}

function saveRecord() {
  const amount = parseFloat(currentAmount);
  if (isNaN(amount) || amount <= 0) {
    showToast('请输入金额');
    return;
  }
  const data = getData();
  const note = document.getElementById('noteInput').value;

  data.records.unshift({
    type: currentType,
    amount: amount,
    category: currentCategory,
    emoji: CATEGORIES[currentType].find(c => c.name === currentCategory).emoji,
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
  showToast(currentType === 'out' ? '✓ 已记一笔支出' : '✓ 已记一笔收入');
}

function renderMoneySummary() {
  const data = getData();
  let totalIn = 0, totalOut = 0;
  data.records.forEach(r => {
    if (r.type === 'in') totalIn += r.amount;
    else totalOut += r.amount;
  });

  document.getElementById('totalIn').textContent = totalIn.toFixed(2);
  document.getElementById('totalOut').textContent = totalOut.toFixed(2);
  document.getElementById('balance').textContent = (totalIn - totalOut).toFixed(2);
  document.getElementById('count').textContent = data.records.length;
}

function renderRecentList() {
  const data = getData();
  const empty = document.getElementById('recentEmpty');
  const list = document.getElementById('recentList');

  if (!data.records.length) {
    empty.style.display = 'block';
    list.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  list.style.display = 'block';

  list.innerHTML = data.records.slice(0, 20).map(r => `
    <li>
      <div class="rl-left">
        <div class="rl-icon">${r.emoji}</div>
        <div class="rl-info">
          <span class="rl-cat">${r.category}</span>
          <span class="rl-note">${r.note || r.date + ' ' + r.time}</span>
        </div>
      </div>
      <div class="rl-right">
        <div class="rl-amount ${r.type}">${r.type === 'in' ? '+' : '-'}¥${r.amount.toFixed(2)}</div>
        <div class="rl-time">${r.time}</div>
      </div>
    </li>
  `).join('');
}

// ============= 经期页 =============
function updatePeriodHero() {
  const data = getData();
  const today = todayStr();

  if (!data.periodStart) {
    document.getElementById('phTitle').textContent = '未记录经期';
    document.getElementById('phEndDate').textContent = '点击记录';
    document.getElementById('phChance').textContent = '--';
    return;
  }

  const dayNum = diffDays(data.periodStart, today) + 1;
  const endDate = addDays(data.periodStart, data.periodLength - 1);
  document.getElementById('phTitle').textContent = `经期第 ${dayNum > 0 ? dayNum : 1} 天`;
  document.getElementById('phEndDate').textContent = formatDateShort(endDate);

  // 简单几率：经期附近低，排卵期高
  const daysSinceStart = diffDays(data.periodStart, today);
  let chance = 3.2;
  if (daysSinceStart >= 10 && daysSinceStart <= 16) {
    chance = 28.5;
    if (daysSinceStart === 14) chance = 32.0;
  }
  document.getElementById('phChance').textContent = chance + '%';
}

function renderPeriodCalendar() {
  const data = getData();
  const grid = document.getElementById('calGrid');
  const today = todayStr();

  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  // 计算预测经期和排卵期
  let periodStart = data.periodStart;
  let predictStart = null;
  if (periodStart) {
    // 把预测调整到当前月最近的一次
    const todayObj = new Date(today);
    predictStart = new Date(periodStart);
    while (predictStart <= todayObj) {
      predictStart.setDate(predictStart.getDate() + data.cycleLength);
    }
    predictStart = predictStart.toISOString().slice(0, 10);
  }

  let html = '';

  // 空白
  for (let i = 0; i < startWeekday; i++) {
    html += '<div class="cal-day"></div>';
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let cls = '';
    let mark = '';

    if (periodStart && dateStr >= periodStart && dateStr <= addDays(periodStart, data.periodLength - 1)) {
      cls = 'period';
      if (dateStr === periodStart) mark = '<span class="cal-mark">▶</span>';
      else mark = '';
    }

    // 预测经期
    if (predictStart) {
      if (dateStr >= predictStart && dateStr <= addDays(predictStart, data.periodLength - 1)) {
        cls = 'predict';
      }
    }

    // 排卵期：预测开始往前推14天，持续6天
    if (predictStart) {
      const ovuStart = addDays(predictStart, -14);
      const ovuEnd = addDays(ovuStart, 5);
      if (dateStr >= ovuStart && dateStr <= ovuEnd) {
        if (cls !== 'period') cls = 'oval';
      }
      // 排卵日
      if (dateStr === addDays(predictStart, -14)) {
        if (cls !== 'period') cls = 'oval-day';
      }
    }

    const isToday = dateStr === today;

    html += `
      <div class="cal-day ${cls} ${isToday ? 'today' : ''}" onclick="onCalDayClick('${dateStr}')">
        <span class="cal-date">${d}</span>
        ${isToday ? '<span class="cal-today">今天</span>' : ''}
        ${mark}
      </div>
    `;
  }

  grid.innerHTML = html;
}

function onCalDayClick(dateStr) {
  const data = getData();
  const today = todayStr();

  // 如果点的是今天或更早，可以标记经期开始
  if (dateStr <= today) {
    if (data.periodStart === dateStr) {
      // 取消标记
      data.periodStart = null;
      showToast('已取消标记');
    } else {
      data.periodStart = dateStr;
      showToast('🌷 已标记经期开始');
    }
    setData(data);
    renderPeriodCalendar();
    updatePeriodHero();
  }
}

// ============= 启动封面 =============
function showSplash() {
  const splash = document.getElementById('splashScreen');
  const alreadyVisited = sessionStorage.getItem('workbench-launched');

  if (alreadyVisited) {
    splash.style.display = 'none';
    initApp();
  } else {
    setTimeout(() => {
      splash.classList.add('hide');
      setTimeout(() => {
        splash.style.display = 'none';
      }, 600);
    }, 2200);
    sessionStorage.setItem('workbench-launched', '1');
    initApp();
  }
}

// ============= 初始化 =============
function initApp() {
  const data = getData();

  // 默认存钱页
  currentType = data.currentType || 'out';
  currentCategory = data.currentCategory || '餐饮';
  currentAmount = '0';

  document.getElementById('dateText').textContent = formatDateCN(new Date());
  switchType(currentType);
  renderMoneySummary();
  renderRecentList();

  // 状态栏时间
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('statusTime').textContent = hh + ':' + mm;

  // 金额输入使用自定义数字键盘提示
  document.getElementById('amountDisplay').addEventListener('click', () => {
    const val = prompt('请输入金额：', currentAmount === '0' ? '' : currentAmount);
    if (val === null) return;
    const clean = val.replace(/[^0-9.]/g, '');
    if (clean) {
      currentAmount = clean;
      document.getElementById('amountDisplay').textContent = clean;
    }
  });

  updatePeriodHero();

  // 添加主屏幕提示（只在非 PWA 模式显示一次）
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (!isStandalone && !localStorage.getItem('workbench-homescreen-hint')) {
    setTimeout(() => {
      const ah = document.getElementById('addHomescreen');
      if (ah) {
        ah.style.display = 'block';
        localStorage.setItem('workbench-homescreen-hint', '1');
        setTimeout(() => ah.style.display = 'none', 6000);
      }
    }, 1200);
  }
}

setInterval(() => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const t = document.getElementById('statusTime');
  if (t) t.textContent = hh + ':' + mm;
}, 30000);

document.addEventListener('DOMContentLoaded', showSplash);
