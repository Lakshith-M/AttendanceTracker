// Global State and Cache
let state = {
  subjects: [],
  timetable: {
    mon: [], tue: [], wed: [], thu: [], fri: [], sat: []
  },
  attendance: {}, // Key: YYYY-MM-DD, Value: { periodId: { subjectId, status, timestamp } }
  settings: {
    globalTarget: 75,
    theme: 'system',
    saturdaySchedule: 'off'
  },
  currentView: 'dashboard',
  selectedDate: '', // YYYY-MM-DD for attendance explorer
  lastAction: null // For undo feature: { date, periodId, previousStatus }
};

// Preset colors for subjects
const COLOR_PRESETS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#06b6d4', // Cyan
  '#f97316'  // Orange
];

const DAYS_MAP = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initData();
  setupEventListeners();
  applyTheme(state.settings.theme);
  navigateTo(state.currentView);
  
  // Set default selected date in attendance explorer to today
  state.selectedDate = getLocalDateString();
  updateSelectedDateUI();

  // Create Lucide Icons
  lucide.createIcons();
});

// Load / Initialize LocalStorage DB
function initData() {
  const localSubjects = localStorage.getItem('att_subjects');
  const localTimetable = localStorage.getItem('att_timetable');
  const localAttendance = localStorage.getItem('att_attendance');
  const localSettings = localStorage.getItem('att_settings');

  if (localSubjects && localTimetable && localAttendance && localSettings) {
    state.subjects = JSON.parse(localSubjects);
    state.timetable = JSON.parse(localTimetable);
    state.attendance = JSON.parse(localAttendance);
    state.settings = JSON.parse(localSettings);
    if (!state.settings.hasOwnProperty('saturdaySchedule')) {
      state.settings.saturdaySchedule = 'off';
    }
  } else {
    // Inject premium mock data for demonstration
    injectMockData();
  }
  
  // Save in case mock data was injected
  saveToLocalStorage();
}

function injectMockData() {
  state.settings = {
    globalTarget: 75,
    theme: 'dark'
  };

  // 1. Mock Subjects
  state.subjects = [
    {
      id: 'sub_1',
      title: 'Machine Learning',
      shortForm: 'ML',
      code: 'CS-401',
      facultyName: 'Dr. Ramesh Kumar',
      facultyInitial: 'RK',
      credits: 4,
      color: '#6366f1',
      targetPercent: 75
    },
    {
      id: 'sub_2',
      title: 'Linear Algebra',
      shortForm: 'LA',
      code: 'MA-201',
      facultyName: 'Prof. Sarah Mathews',
      facultyInitial: 'SM',
      credits: 3,
      color: '#3b82f6',
      targetPercent: 75
    },
    {
      id: 'sub_3',
      title: 'Object Oriented Programming',
      shortForm: 'OOP',
      code: 'CS-302',
      facultyName: 'Dr. Anita Sharma',
      facultyInitial: 'AS',
      credits: 4,
      color: '#10b981',
      targetPercent: 75
    },
    {
      id: 'sub_4',
      title: 'Operating Systems',
      shortForm: 'OS',
      code: 'CS-402',
      facultyName: 'Prof. Nitin Saxena',
      facultyInitial: 'NS',
      credits: 4,
      color: '#f59e0b',
      targetPercent: 80
    },
    {
      id: 'sub_5',
      title: 'Computer Networks',
      shortForm: 'CN',
      code: 'CS-403',
      facultyName: 'Dr. Vikram Mehra',
      facultyInitial: 'VM',
      credits: 3,
      color: '#f43f5e',
      targetPercent: 75
    }
  ];

  // 2. Mock Timetable
  const periodsTemplate = (dayPrefix, subIds) => [
    { id: dayPrefix + '_p1', periodNumber: 1, subjectId: subIds[0], startTime: '08:00', endTime: '09:00', room: 'LHC-101' },
    { id: dayPrefix + '_p2', periodNumber: 2, subjectId: subIds[1], startTime: '09:00', endTime: '10:00', room: 'LHC-203' },
    { id: dayPrefix + '_p3', periodNumber: 3, subjectId: subIds[2], startTime: '10:00', endTime: '10:40', room: 'LHC-105' },
    { id: dayPrefix + '_b1', periodNumber: 4, subjectId: 'break', startTime: '10:40', endTime: '11:00', room: '' }, // Break 1
    { id: dayPrefix + '_p4', periodNumber: 5, subjectId: subIds[3], startTime: '11:00', endTime: '12:00', room: 'LHC-102' },
    { id: dayPrefix + '_p5', periodNumber: 6, subjectId: subIds[4], startTime: '12:00', endTime: '12:40', room: 'LHC-301' },
    { id: dayPrefix + '_l1', periodNumber: 7, subjectId: 'break', startTime: '12:40', endTime: '13:40', room: '' }, // Lunch
    { id: dayPrefix + '_p6', periodNumber: 8, subjectId: subIds[5], startTime: '13:40', endTime: '14:30', room: 'LHC-101' },
    { id: dayPrefix + '_b2', periodNumber: 9, subjectId: 'break', startTime: '14:30', endTime: '14:40', room: '' }, // Break 2
    { id: dayPrefix + '_p7', periodNumber: 10, subjectId: subIds[6], startTime: '14:40', endTime: '15:30', room: 'LHC-203' },
    { id: dayPrefix + '_p8', periodNumber: 11, subjectId: subIds[7], startTime: '15:30', endTime: '16:20', room: 'LHC-105' }
  ];

  state.timetable = {
    mon: periodsTemplate('mon', ['sub_1', 'sub_2', 'sub_3', 'sub_4', 'sub_5', 'sub_1', 'sub_2', 'sub_3']),
    tue: periodsTemplate('tue', ['sub_4', 'sub_5', 'sub_1', 'sub_2', 'sub_3', 'sub_4', 'sub_5', 'sub_1']),
    wed: periodsTemplate('wed', ['sub_2', 'sub_3', 'sub_4', 'sub_5', 'sub_1', 'sub_2', 'sub_3', 'sub_4']),
    thu: periodsTemplate('thu', ['sub_5', 'sub_1', 'sub_2', 'sub_3', 'sub_4', 'sub_5', 'sub_1', 'sub_2']),
    fri: periodsTemplate('fri', ['sub_3', 'sub_4', 'sub_5', 'sub_1', 'sub_2', 'sub_3', 'sub_4', 'sub_5']),
    sat: periodsTemplate('sat', ['break', 'break', 'break', 'break', 'break', 'break', 'break', 'break'])
  };

  // 3. Mock Attendance (Generate logs for last 10 days)
  const today = new Date();
  for (let i = 12; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = getLocalDateString(d);
    
    // Find what weekday it is
    const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const weekday = daysOfWeek[d.getDay()];
    
    if (weekday === 'sun') continue;
    
    const dayPeriods = state.timetable[weekday] || [];
    if (dayPeriods.length === 0) continue;
    
    state.attendance[dateStr] = {};
    dayPeriods.forEach(period => {
      if (period.subjectId === 'break') return;
      
      // Determine a pseudo-random status
      // 80% Attended, 10% Bunked, 5% OD, 5% Cancelled
      let status = 'attended';
      const rand = Math.random();
      if (rand < 0.12) {
        status = 'bunked';
      } else if (rand < 0.18) {
        status = 'od';
      } else if (rand < 0.22) {
        status = 'cancelled';
      }
      
      // Don't mark today's periods in advance, only mark past periods
      if (i > 0 || (i === 0 && new Date().getHours() > parseInt(period.startTime.split(':')[0]))) {
        state.attendance[dateStr][period.id] = {
          subjectId: period.subjectId,
          status: status,
          timestamp: Date.now() - (i * 24 * 60 * 60 * 1000)
        };
      }
    });
  }
}

function saveToLocalStorage() {
  localStorage.setItem('att_subjects', JSON.stringify(state.subjects));
  localStorage.setItem('att_timetable', JSON.stringify(state.timetable));
  localStorage.setItem('att_attendance', JSON.stringify(state.attendance));
  localStorage.setItem('att_settings', JSON.stringify(state.settings));
}

// NAVIGATION ROUTING
function setupEventListeners() {
  // Sidebar navigation click handlers
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const view = item.getAttribute('data-view');
      navigateTo(view);
    });
  });

  // Mobile bottom bar click handlers
  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const view = item.getAttribute('data-view');
      navigateTo(view);
    });
  });

  // Dashboard Undo trigger
  document.getElementById('btn-undo-last').addEventListener('click', undoLastAttendance);

  // Mark Holiday button
  const markHolidayBtn = document.getElementById('btn-mark-holiday');
  if (markHolidayBtn) {
    markHolidayBtn.addEventListener('click', () => {
      const todayStr = getLocalDateString();
      const todayDay = getLocalDayOfWeekString().toLowerCase().slice(0, 3);
      let activeDay = todayDay;
      if (todayDay === 'sat' && state.settings.saturdaySchedule && state.settings.saturdaySchedule !== 'off') {
        activeDay = state.settings.saturdaySchedule;
      }
      const periods = state.timetable[activeDay] || [];
      const markedToday = state.attendance[todayStr] || {};
      const todayPeriodsCount = periods.filter(p => p.subjectId !== 'break').length;
      const holidayCount = periods.filter(p => p.subjectId !== 'break' && markedToday[p.id] && markedToday[p.id].status === 'holiday').length;
      const isTodayHoliday = todayPeriodsCount > 0 && holidayCount === todayPeriodsCount;

      if (isTodayHoliday) {
        clearTodayHoliday();
      } else {
        markTodayAsHoliday();
      }
    });
  }

  // Subjects Page trigger
  document.getElementById('btn-open-add-subject').addEventListener('click', () => openSubjectModal());
  document.getElementById('btn-close-modal-subject').addEventListener('click', closeSubjectModal);
  document.getElementById('btn-cancel-subject').addEventListener('click', closeSubjectModal);
  document.getElementById('btn-save-subject').addEventListener('click', saveSubject);
  document.getElementById('subject-search-input').addEventListener('input', renderSubjects);

  // Settings trigger
  document.getElementById('input-global-target').addEventListener('change', (e) => {
    state.settings.globalTarget = Math.max(50, Math.min(100, parseInt(e.target.value) || 75));
    document.getElementById('sidebar-target-display').textContent = state.settings.globalTarget + '%';
    saveToLocalStorage();
    showToast('Global target attendance updated!', 'success');
    refreshActiveView();
  });

  // Theme switches
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      state.settings.theme = theme;
      applyTheme(theme);
      saveToLocalStorage();
      updateThemeButtons();
      showToast(`Theme switched to ${theme}!`, 'success');
    });
  });

  // Settings Reset Button
  document.getElementById('btn-factory-reset').addEventListener('click', () => {
    if (confirm('CRITICAL WARNING: Are you absolutely sure you want to delete all subjects, timetable data, and history records? This cannot be undone.')) {
      localStorage.clear();
      showToast('All app data successfully erased!', 'success');
      setTimeout(() => window.location.reload(), 1000);
    }
  });

  // Timetable Tabs trigger
  document.querySelectorAll('#timetable-day-tabs .tab-btn').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('#timetable-day-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      tab.classList.add('active');
      renderTimetableEditor(tab.getAttribute('data-day'));
    });
  });

  document.getElementById('btn-add-period').addEventListener('click', () => {
    const activeTab = document.querySelector('#timetable-day-tabs .tab-btn.active');
    if (activeTab) {
      addEmptyPeriodToDay(activeTab.getAttribute('data-day'));
    }
  });

  document.getElementById('btn-copy-day').addEventListener('click', openCopyDayModal);
  document.getElementById('btn-close-modal-copy').addEventListener('click', closeCopyDayModal);
  document.getElementById('btn-cancel-copy').addEventListener('click', closeCopyDayModal);
  document.getElementById('btn-submit-copy').addEventListener('click', copyDayTimetable);

  document.getElementById('btn-copy-week').addEventListener('click', copyEntireWeekJson);

  // Saturday schedule reassignment trigger
  const satDropdown = document.getElementById('select-saturday-schedule');
  if (satDropdown) {
    satDropdown.value = state.settings.saturdaySchedule || 'off';
    satDropdown.addEventListener('change', (e) => {
      state.settings.saturdaySchedule = e.target.value;
      saveToLocalStorage();
      showToast('Saturday Day Order updated!', 'success');
      refreshActiveView();
    });
  }

  // Timetable Period Editor Toggle button
  const toggleEditorBtn = document.getElementById('btn-toggle-editor');
  const editorCard = document.getElementById('timetable-editor-card');
  if (toggleEditorBtn && editorCard) {
    toggleEditorBtn.addEventListener('click', () => {
      const isHidden = editorCard.style.display === 'none' || editorCard.style.display === '';
      if (isHidden) {
        editorCard.style.display = 'block';
        toggleEditorBtn.innerHTML = '<i data-lucide="eye-off"></i> Hide Editor';
        editorCard.scrollIntoView({ behavior: 'smooth' });
      } else {
        editorCard.style.display = 'none';
        toggleEditorBtn.innerHTML = '<i data-lucide="edit-2"></i> Edit Timetable';
      }
      lucide.createIcons();
    });
  }

  // Settings JSON Backups
  document.getElementById('btn-backup-download').addEventListener('click', downloadBackupFile);
  document.getElementById('btn-backup-upload-trigger').addEventListener('click', () => {
    document.getElementById('input-backup-file').click();
  });
  document.getElementById('input-backup-file').addEventListener('change', uploadBackupFile);
  document.getElementById('btn-backup-restore-text').addEventListener('click', restoreBackupFromTextArea);

  // Settings CSV Exports
  document.getElementById('btn-csv-export').addEventListener('click', exportAttendanceCSV);
  document.getElementById('btn-csv-import-trigger').addEventListener('click', () => {
    document.getElementById('input-csv-file').click();
  });
  document.getElementById('input-csv-file').addEventListener('change', importAttendanceCSV);

  // Calendar Controls
  document.getElementById('calendar-prev-month').addEventListener('click', () => shiftCalendarMonth(-1));
  document.getElementById('calendar-next-month').addEventListener('click', () => shiftCalendarMonth(1));

  // "What-if" Sliders
  document.getElementById('calc-subject').addEventListener('change', calculateWhatIf);
  document.getElementById('slider-bunk').addEventListener('input', (e) => {
    document.getElementById('slider-bunk-val').textContent = e.target.value;
    calculateWhatIf();
  });
  document.getElementById('slider-attend').addEventListener('input', (e) => {
    document.getElementById('slider-attend-val').textContent = e.target.value;
    calculateWhatIf();
  });

  // Mobile Dashboard Segment Tab Switches
  document.querySelectorAll('.mobile-dash-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.mobile-dash-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const targetTab = tab.getAttribute('data-dash-tab');
      const gridEl = document.querySelector('.dashboard-grid');
      if (gridEl) {
        gridEl.setAttribute('data-active-dash-tab', targetTab);
      }
    });
  });

  // Mobile Timetable Day Selector
  document.querySelectorAll('#mobile-timetable-day-tabs .tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#mobile-timetable-day-tabs .tab-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderMobileTimetableList(tab.getAttribute('data-mobile-day'));
    });
  });
}

function navigateTo(view) {
  state.currentView = view;
  
  // Update sidebar highlight
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-view') === view) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update mobile nav highlight
  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    if (item.getAttribute('data-view') === view) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Switch view containers
  document.querySelectorAll('.view-section').forEach(section => {
    if (section.id === `view-${view}`) {
      section.classList.add('active');
    } else {
      section.classList.remove('active');
    }
  });

  // Populate dynamic UI lists
  refreshActiveView();
}

function refreshActiveView() {
  document.getElementById('sidebar-target-display').textContent = state.settings.globalTarget + '%';
  
  // Re-evaluate general warning alerts across all views
  updateGeneralAlerts();

  switch(state.currentView) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'timetable':
      renderTimetableGrid();
      const activeTab = document.querySelector('#timetable-day-tabs .tab-btn.active');
      renderTimetableEditor(activeTab ? activeTab.getAttribute('data-day') : 'mon');
      break;
    case 'attendance':
      renderCalendar();
      updateSelectedDateUI();
      break;
    case 'subjects':
      renderSubjects();
      break;
    case 'statistics':
      renderStatistics();
      break;
    case 'settings':
      renderSettings();
      break;
  }
  
  // Sync Lucide Icons
  lucide.createIcons();
}

// GENERAL ALERT BAR GENERATOR (Warning when drop below 75% or 70%)
function updateGeneralAlerts() {
  const alertContainer = document.getElementById('general-alerts-area');
  alertContainer.innerHTML = '';
  
  let subjectsBelow75 = [];
  let subjectsBelow70 = [];
  let unmarkedToday = false;

  // 1. Check subject percentages with 10-minute warning rule
  state.subjects.forEach(sub => {
    const stats = getSubjectMetrics(sub.id);
    if (stats.conducted > 0) {
      if (shouldShowWarningNow(sub.id)) {
        if (stats.percent < 70) {
          subjectsBelow70.push(sub.shortForm);
        } else if (stats.percent < 75) {
          subjectsBelow75.push(sub.shortForm);
        }
      }
    }
  });

  // 2. Check if today's classes are fully marked
  const todayStr = getLocalDateString();
  const todayDay = getLocalDayOfWeekString().toLowerCase().slice(0, 3); // 'mon', 'tue', etc.
  let activeDay = todayDay;
  if (todayDay === 'sat' && state.settings.saturdaySchedule && state.settings.saturdaySchedule !== 'off') {
    activeDay = state.settings.saturdaySchedule;
  }
  const todayPeriods = state.timetable[activeDay] || [];
  
  const markedRecords = state.attendance[todayStr] || {};
  let totalToMark = 0;
  let markedCount = 0;

  todayPeriods.forEach(period => {
    if (period.subjectId !== 'break') {
      totalToMark++;
      if (markedRecords[period.id]) {
        markedCount++;
      }
    }
  });

  // Generate class-specific warning banners for started & unmarked classes
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  todayPeriods.forEach(p => {
    if (p.subjectId !== 'break') {
      const isMarked = markedRecords[p.id] && markedRecords[p.id].status !== '';
      if (!isMarked) {
        const [startH, startM] = p.startTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        
        if (currentMinutes >= startMinutes) {
          const subId = markedRecords[p.id] ? markedRecords[p.id].subjectId : p.subjectId;
          const sub = state.subjects.find(s => s.id === subId);
          if (sub) {
            alertContainer.appendChild(createAlertBanner(
              'warning',
              'clock',
              `Mark Attendance: ${sub.shortForm}`,
              `Your class for <strong>${sub.title}</strong> started at ${p.startTime}. Please mark your attendance.`
            ));
          }
        }
      }
    }
  });

  if (subjectsBelow70.length > 0) {
    alertContainer.appendChild(createAlertBanner('danger', 'alert-triangle', 'Critical Attendance Alert', `Your attendance in <strong>${subjectsBelow70.join(', ')}</strong> is below <strong>70%</strong>! Attend classes to avoid debarment.`));
  } else if (subjectsBelow75.length > 0) {
    alertContainer.appendChild(createAlertBanner('warning', 'alert-circle', 'Attendance Warning', `Your attendance in <strong>${subjectsBelow75.join(', ')}</strong> is below the <strong>75%</strong> target. Try not to miss any more periods.`));
  }
  
  lucide.createIcons();
}

function createAlertBanner(type, icon, title, text) {
  const banner = document.createElement('div');
  banner.className = `alert-banner ${type}`;
  banner.style.marginBottom = '16px';
  banner.innerHTML = `
    <div class="alert-icon"><i data-lucide="${icon}"></i></div>
    <div class="alert-text">
      <h4>${title}</h4>
      <p>${text}</p>
    </div>
  `;
  return banner;
}

// ----------------------------------------------------
// VIEW CONTROLLERS
// ----------------------------------------------------

// 1. DASHBOARD VIEW
function renderDashboard() {
  // Sync Saturday Day Order dropdown and toggle its visibility only on Saturdays
  const todayDay = getLocalDayOfWeekString().toLowerCase().slice(0, 3);
  const satOrderBox = document.getElementById('dash-saturday-order-box');
  if (satOrderBox) {
    if (todayDay === 'sat') {
      satOrderBox.style.display = 'flex';
    } else {
      satOrderBox.style.display = 'none';
    }
  }

  const satDropdown = document.getElementById('select-saturday-schedule');
  if (satDropdown) {
    satDropdown.value = state.settings.saturdaySchedule || 'off';
  }

  // Show Date
  const d = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  let dateText = d.toLocaleDateString('en-US', options);
  const actualDay = getLocalDayOfWeekString().toLowerCase().slice(0, 3);
  if (actualDay === 'sat' && state.settings.saturdaySchedule && state.settings.saturdaySchedule !== 'off') {
    const targetDayName = DAYS_MAP[state.settings.saturdaySchedule];
    dateText += ` (Running ${targetDayName}'s Timetable)`;
  }
  document.getElementById('dashboard-date').textContent = dateText;

  // Toggle Undo Button
  const undoBtn = document.getElementById('btn-undo-last');
  if (state.lastAction) {
    undoBtn.style.display = 'inline-flex';
  } else {
    undoBtn.style.display = 'none';
  }

  // Load Today's Timetable
  let activeDay = todayDay;
  if (todayDay === 'sat' && state.settings.saturdaySchedule && state.settings.saturdaySchedule !== 'off') {
    activeDay = state.settings.saturdaySchedule;
  }
  const periods = state.timetable[activeDay] || [];
  const container = document.getElementById('today-classes-container');
  container.innerHTML = '';

  const todayStr = getLocalDateString();
  const markedToday = state.attendance[todayStr] || {};

  // Check if today is marked as holiday
  const todayPeriodsCount = periods.filter(p => p.subjectId !== 'break').length;
  const holidayCount = periods.filter(p => p.subjectId !== 'break' && markedToday[p.id] && markedToday[p.id].status === 'holiday').length;
  const isTodayHoliday = todayPeriodsCount > 0 && holidayCount === todayPeriodsCount;

  // Toggle Holiday button state or text
  const holidayBtn = document.getElementById('btn-mark-holiday');
  if (holidayBtn) {
    if (isTodayHoliday) {
      holidayBtn.innerHTML = '<i data-lucide="party-popper"></i> Resume Classes';
      holidayBtn.style.color = 'var(--color-success)';
      holidayBtn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    } else {
      holidayBtn.innerHTML = '<i data-lucide="umbrella"></i> Mark Today as Holiday';
      holidayBtn.style.color = '#a855f7';
      holidayBtn.style.borderColor = 'rgba(168, 85, 247, 0.4)';
    }
  }

  if (isTodayHoliday) {
    container.innerHTML = `
      <div class="timetable-cell empty" style="padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px dashed #a855f7; border-radius: 12px; background: rgba(168, 85, 247, 0.05); width: 100%;">
        <i data-lucide="umbrella" style="width: 36px; height: 36px; color: #a855f7; margin-bottom: 12px;"></i>
        <h3 style="color: #a855f7; font-weight: 600; margin-bottom: 6px; font-size: 1.1rem;">Today is a Holiday!</h3>
        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 16px; text-align: center;">All periods for today have been marked as holiday. Go relax!</p>
        <button class="btn-primary" onclick="clearTodayHoliday()" style="background: #a855f7; border-color: #a855f7; display: inline-flex; align-items: center; gap: 6px;"><i data-lucide="rotate-ccw"></i> Resume Classes</button>
      </div>`;
    lucide.createIcons();
  } else if (periods.length === 0) {
    container.innerHTML = `
      <div class="timetable-cell empty">
        <i data-lucide="calendar" style="margin-bottom: 6px;"></i>
        <span>No classes scheduled for today. Go relax!</span>
      </div>`;
  } else {
    periods.forEach(period => {
      if (period.subjectId === 'break') {
        const breakRow = document.createElement('div');
        breakRow.className = 'period-card';
        breakRow.style.opacity = '0.7';
        breakRow.innerHTML = `
          <div class="period-info">
            <div class="period-badge" style="background: var(--text-muted);"><i data-lucide="coffee"></i></div>
            <div class="period-meta">
              <h3>Coffee Break</h3>
              <p><i data-lucide="clock" style="width:12px; height:12px;"></i> ${period.startTime} - ${period.endTime}</p>
            </div>
          </div>
        `;
        container.appendChild(breakRow);
        return;
      }

      const marked = markedToday[period.id];
      const isMarked = marked && marked.status !== '';
      const status = isMarked ? marked.status : '';

      const subId = marked ? marked.subjectId : period.subjectId;
      const subject = state.subjects.find(s => s.id === subId);
      if (!subject) return;

      const card = document.createElement('div');
      card.className = 'period-card';
      card.style.borderLeft = `5px solid ${subject.color}`;
      
      let actionsHTML = '';
      if (!isMarked) {
        actionsHTML = `
          <div class="period-actions">
            <button class="btn-status-circle" data-status="attended" onclick="markDashboardAttendance('${period.id}', 'attended')" title="Attended"><i data-lucide="check"></i></button>
            <button class="btn-status-circle" data-status="bunked" onclick="markDashboardAttendance('${period.id}', 'bunked')" title="Bunked"><i data-lucide="x"></i></button>
            <button class="btn-status-circle" data-status="od" onclick="markDashboardAttendance('${period.id}', 'od')" title="On Duty (OD)"><i data-lucide="star"></i></button>
            <button class="btn-status-circle" data-status="cancelled" onclick="markDashboardAttendance('${period.id}', 'cancelled')" title="Cancelled"><i data-lucide="slash"></i></button>
          </div>
        `;
      } else {
        let statusText = '';
        if (status === 'attended') { statusText = 'Attended'; }
        if (status === 'bunked') { statusText = 'Bunked'; }
        if (status === 'od') { statusText = 'On Duty'; }
        if (status === 'cancelled') { statusText = 'Cancelled'; }

        actionsHTML = `
          <div class="period-actions">
            <span class="status-badge ${status}">${statusText}</span>
            <button class="btn-edit-status-icon" onclick="editDashboardAttendance('${period.id}')" title="Edit"><i data-lucide="edit-2"></i></button>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="period-info">
          <div class="period-badge" style="background: ${subject.color};">Period <span>${period.periodNumber}</span></div>
          <div class="period-meta">
            <h3 id="card-title-container-${period.id}" data-sub-id="${subject.id}" style="display:flex; align-items:center;">
              <span>${subject.title} (${subject.shortForm})</span>
              <button class="btn-swap-class" onclick="toggleSwapDropdown('${period.id}')" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.75rem; display:inline-flex; align-items:center; gap:4px; margin-left:8px;" title="Swap subject for today's class">
                <i data-lucide="refresh-cw" style="width:11px; height:11px;"></i> Swap
              </button>
            </h3>
            <p>
              <i data-lucide="clock" style="width:12px; height:12px;"></i> ${period.startTime} - ${period.endTime}
              ${period.room ? ` | <i data-lucide="map-pin" style="width:12px; height:12px;"></i> Room: ${period.room}` : ''}
              | <i data-lucide="user" style="width:12px; height:12px;"></i> ${subject.facultyInitial}
            </p>
          </div>
        </div>
        ${actionsHTML}
      `;
      container.appendChild(card);
    });
  }

  // Load Quick Statistics
  const overallStats = getOverallMetrics();
  document.getElementById('stat-overall-pct').textContent = overallStats.percent + '%';
  document.getElementById('stat-overall-pct').className = 'stat-card-val ' + getPercentColorClass(overallStats.percent);
  
  document.getElementById('stat-attended').textContent = overallStats.attended;
  document.getElementById('stat-missed').textContent = overallStats.missed;
  document.getElementById('stat-od').textContent = overallStats.od;
  document.getElementById('stat-cancelled').textContent = overallStats.cancelled;
  document.getElementById('stat-conducted').textContent = overallStats.conducted;

  // Load Subject Progress Summary List
  const summaryContainer = document.getElementById('dashboard-summary-list');
  summaryContainer.innerHTML = '';

  if (state.subjects.length === 0) {
    summaryContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No courses created yet. Head to Courses Page.</p>';
  } else {
    state.subjects.forEach(sub => {
      const stats = getSubjectMetrics(sub.id);
      
      const item = document.createElement('div');
      item.className = 'progress-item';
      
      const pctColorClass = getPercentColorClass(stats.percent);
      const bgPctColorClass = 'bg-' + pctColorClass;

      item.innerHTML = `
        <div class="progress-item-header">
          <div class="progress-title-grp">
            <span class="progress-color-dot" style="background-color: ${sub.color};"></span>
            <span>${sub.title}</span>
          </div>
          <span class="progress-pct-val ${pctColorClass}">${stats.percent}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${bgPctColorClass}" style="width: ${stats.percent}%;"></div>
        </div>
      `;
      summaryContainer.appendChild(item);
    });
  }

  // Setup What-If Subject selector
  const calcSelect = document.getElementById('calc-subject');
  if (calcSelect) {
    const prevVal = calcSelect.value;
    calcSelect.innerHTML = '';
    
    state.subjects.forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub.id;
      opt.textContent = `${sub.title} (${sub.shortForm})`;
      calcSelect.appendChild(opt);
    });

    if (state.subjects.length > 0) {
      if (prevVal && state.subjects.find(s => s.id === prevVal)) {
        calcSelect.value = prevVal;
      } else {
        calcSelect.value = state.subjects[0].id;
      }
      calculateWhatIf();
    } else {
      document.getElementById('calc-result-pct').textContent = '0.00%';
      document.getElementById('calc-result-pct').className = 'calc-res-value';
    }
  }
}

function toggleSwapDropdown(periodId) {
  const titleContainer = document.getElementById(`card-title-container-${periodId}`);
  if (!titleContainer) return;

  const currentSubId = titleContainer.getAttribute('data-sub-id');

  let selectHTML = `
    <select class="form-select" onchange="overridePeriodSubject('${periodId}', this.value)" style="padding: 4px 8px; font-size: 0.8rem; border-radius: 6px; width: auto; max-width: 180px; margin-right: 8px; background: var(--bg-app); border: 1px solid var(--border-color); color: var(--text-primary); outline: none;">
  `;
  state.subjects.forEach(s => {
    const selected = s.id === currentSubId ? 'selected' : '';
    selectHTML += `<option value="${s.id}" ${selected}>${s.shortForm} - ${s.title}</option>`;
  });
  selectHTML += `</select>
    <button class="btn-secondary" onclick="refreshActiveView()" style="padding: 2px 8px; font-size: 0.75rem; border-radius: 6px; height: 26px; display: inline-flex; align-items: center; justify-content: center; font-weight: 500;">Cancel</button>
  `;

  titleContainer.innerHTML = selectHTML;
  lucide.createIcons();
}

function overridePeriodSubject(periodId, newSubjectId) {
  const todayStr = getLocalDateString();
  if (!state.attendance[todayStr]) {
    state.attendance[todayStr] = {};
  }

  if (state.attendance[todayStr][periodId]) {
    state.attendance[todayStr][periodId].subjectId = newSubjectId;
  } else {
    state.attendance[todayStr][periodId] = {
      subjectId: newSubjectId,
      status: '',
      timestamp: Date.now()
    };
  }

  saveToLocalStorage();
  showToast('Class subject swapped for today!', 'success');
  refreshActiveView();
}

// Mark attendance instantly from dashboard
function markDashboardAttendance(periodId, status) {
  const todayStr = getLocalDateString();
  const todayDay = getLocalDayOfWeekString().toLowerCase().slice(0, 3);
  let activeDay = todayDay;
  if (todayDay === 'sat' && state.settings.saturdaySchedule && state.settings.saturdaySchedule !== 'off') {
    activeDay = state.settings.saturdaySchedule;
  }
  const periods = state.timetable[activeDay] || [];
  const period = periods.find(p => p.id === periodId);

  if (!period) return;

  if (!state.attendance[todayStr]) {
    state.attendance[todayStr] = {};
  }

  // Store previous action for UNDO
  const prevMark = state.attendance[todayStr][periodId];
  state.lastAction = {
    date: todayStr,
    periodId: periodId,
    previousStatus: prevMark ? prevMark.status : null
  };

  // Set new status (keep the overridden subjectId if it exists)
  const resolvedSubId = prevMark ? prevMark.subjectId : period.subjectId;
  state.attendance[todayStr][periodId] = {
    subjectId: resolvedSubId,
    status: status,
    timestamp: Date.now()
  };

  saveToLocalStorage();
  showToast('Attendance logged automatically!', 'success');
  refreshActiveView();
}

function editDashboardAttendance(periodId) {
  const todayStr = getLocalDateString();
  if (state.attendance[todayStr] && state.attendance[todayStr][periodId]) {
    
    // Store previous action for UNDO before modifying
    state.lastAction = {
      date: todayStr,
      periodId: periodId,
      previousStatus: state.attendance[todayStr][periodId].status
    };

    delete state.attendance[todayStr][periodId];
    saveToLocalStorage();
    showToast('Edit mode enabled for class.', 'success');
    refreshActiveView();
  }
}

function undoLastAttendance() {
  if (!state.lastAction) return;

  const { date, periodId, previousStatus } = state.lastAction;
  
  if (previousStatus === null) {
    // It was unmarked before, so delete
    if (state.attendance[date]) {
      delete state.attendance[date][periodId];
      if (Object.keys(state.attendance[date]).length === 0) {
        delete state.attendance[date];
      }
    }
  } else {
    // Restore previous status
    if (!state.attendance[date]) state.attendance[date] = {};
    let dayOfWeek = getDayOfWeekFromDateString(date);
    if (dayOfWeek === 'sat' && state.settings.saturdaySchedule && state.settings.saturdaySchedule !== 'off') {
      dayOfWeek = state.settings.saturdaySchedule;
    }
    const periods = state.timetable[dayOfWeek] || [];
    const period = periods.find(p => p.id === periodId);
    
    state.attendance[date][periodId] = {
      subjectId: period ? period.subjectId : state.attendance[date][periodId].subjectId,
      status: previousStatus,
      timestamp: Date.now()
    };
  }

  state.lastAction = null;
  saveToLocalStorage();
  showToast('Last attendance status reverted!', 'success');
  refreshActiveView();
}

// "What If?" Calculator Logic
function calculateWhatIf() {
  const subId = document.getElementById('calc-subject').value;
  if (!subId) return;

  const bunkSlider = parseInt(document.getElementById('slider-bunk').value) || 0;
  const attendSlider = parseInt(document.getElementById('slider-attend').value) || 0;

  const metrics = getSubjectMetrics(subId);
  const sub = state.subjects.find(s => s.id === subId);
  const target = sub ? sub.targetPercent : 75;

  let present = metrics.attended + metrics.od;
  let conducted = metrics.conducted;

  // Simulate attending next consecutive classes
  present += attendSlider;
  conducted += attendSlider;

  // Simulate bunking classes
  // Attending unchanged, conducted increases
  conducted += bunkSlider;

  let simPct = 100;
  if (conducted > 0) {
    simPct = (present / conducted) * 100;
    simPct = Math.round(simPct * 100) / 100;
  }

  const resultContainer = document.getElementById('calc-result-pct');
  resultContainer.textContent = simPct.toFixed(2) + '%';
  resultContainer.className = 'calc-res-value ' + getPercentColorClass(simPct, target);
}

// 2. TIMETABLE VIEW
function renderTimetableGrid() {
  const thead = document.getElementById('timetable-grid-header');
  const tbody = document.getElementById('timetable-grid-body');
  if (!thead || !tbody) return;

  thead.innerHTML = '';
  tbody.innerHTML = '';

  // Get Monday's schedule to determine standard columns
  const standardPeriods = state.timetable.mon || [];
  if (standardPeriods.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="timetable-cell empty" style="text-align: center; padding: 40px;">No periods configured.</td></tr>`;
    return;
  }

  // 1. Build Header Row
  const headerTr = document.createElement('tr');
  const cornerTh = document.createElement('th');
  cornerTh.innerHTML = 'DAY \\ TIME';
  headerTr.appendChild(cornerTh);

  standardPeriods.forEach(period => {
    const periodTh = document.createElement('th');
    let label = '';
    if (period.subjectId === 'break' && period.startTime === '12:40') {
      label = 'LUNCH';
    } else if (period.subjectId === 'break') {
      label = 'BREAK';
    } else {
      label = `Period ${period.periodNumber}`;
    }
    periodTh.innerHTML = `<div class="timetable-cell-time">${period.startTime} - ${period.endTime}</div><div style="font-weight:700;">${label}</div>`;
    headerTr.appendChild(periodTh);
  });
  thead.appendChild(headerTr);

  // 2. Build Day Rows (Mon-Sat)
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  days.forEach(day => {
    const tr = document.createElement('tr');
    
    // Day row header (first column)
    const dayHeaderTd = document.createElement('td');
    dayHeaderTd.className = 'day-row-header';
    
    let dayLabel = DAYS_MAP[day];
    let scheduleDay = day;
    if (day === 'sat' && state.settings.saturdaySchedule && state.settings.saturdaySchedule !== 'off') {
      scheduleDay = state.settings.saturdaySchedule;
      dayLabel += `<br><span style="font-size: 0.65rem; font-weight: 500; color: var(--text-muted);">(${state.settings.saturdaySchedule.toUpperCase()})</span>`;
    }
    dayHeaderTd.innerHTML = dayLabel;
    tr.appendChild(dayHeaderTd);

    const dayPeriods = state.timetable[scheduleDay] || [];
    
    dayPeriods.forEach((period, pIndex) => {
      // Rowspanned cells: Break 1 (index 3), Lunch (index 6), Break 2 (index 8)
      const isRowspanCell = (pIndex === 3 || pIndex === 6 || pIndex === 8);

      if (isRowspanCell) {
        if (day === 'mon') {
          const rowspanTd = document.createElement('td');
          rowspanTd.rowSpan = 6;
          rowspanTd.className = 'timetable-cell-lunch-break';
          
          let text = 'BREAK';
          if (pIndex === 6) text = 'LUNCH';
          
          rowspanTd.innerHTML = text.split('').join('<br>');
          tr.appendChild(rowspanTd);
        }
      } else {
        const td = document.createElement('td');
        if (period.subjectId === 'break') {
          td.innerHTML = `<div class="timetable-cell empty">Free</div>`;
        } else {
          const sub = state.subjects.find(s => s.id === period.subjectId);
          if (!sub) {
            td.innerHTML = `<div class="timetable-cell empty">Free</div>`;
          } else {
            td.innerHTML = `
              <div class="timetable-cell" style="background: ${sub.color}; color: #fff;">
                <div class="timetable-cell-subject">${sub.shortForm}</div>
                <div class="timetable-cell-meta">
                  <span class="timetable-cell-faculty">${sub.facultyInitial}</span>
                  ${period.room ? `<span>Room ${period.room}</span>` : ''}
                </div>
              </div>
            `;
          }
        }
        tr.appendChild(td);
      }
    });
    tbody.appendChild(tr);
  });

  // Render Mobile Visual Timetable list
  const activeMobileTab = document.querySelector('#mobile-timetable-day-tabs .tab-btn.active');
  const mobileDay = activeMobileTab ? activeMobileTab.getAttribute('data-mobile-day') : 'mon';
  renderMobileTimetableList(mobileDay);
}

function renderTimetableEditor(day) {
  const container = document.getElementById('period-editor-container');
  container.innerHTML = '';

  const dayPeriods = state.timetable[day] || [];

  if (dayPeriods.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">No periods configured for this day. Click 'Add Period' to create one.</p>`;
    return;
  }

  dayPeriods.forEach((period, idx) => {
    const row = document.createElement('div');
    row.className = 'period-editor-row';
    row.setAttribute('data-id', period.id);

    // Subjects selection options
    let subOptions = `<option value="break" ${period.subjectId === 'break' ? 'selected' : ''}>[ Break ]</option>`;
    state.subjects.forEach(sub => {
      subOptions += `<option value="${sub.id}" ${period.subjectId === sub.id ? 'selected' : ''}>${sub.title} (${sub.shortForm})</option>`;
    });

    row.innerHTML = `
      <div class="period-drag-handle" title="Period Number">
        <strong>P${period.periodNumber}</strong>
      </div>
      <div class="period-editor-inputs">
        <div class="input-group">
          <select class="form-select ed-subject" onchange="updatePeriodField('${day}', '${period.id}', 'subjectId', this.value)">
            ${subOptions}
          </select>
        </div>
        <div class="input-group">
          <input type="time" class="form-input ed-start" value="${period.startTime}" onchange="updatePeriodField('${day}', '${period.id}', 'startTime', this.value)">
        </div>
        <div class="input-group">
          <input type="time" class="form-input ed-end" value="${period.endTime}" onchange="updatePeriodField('${day}', '${period.id}', 'endTime', this.value)">
        </div>
        <div class="input-group">
          <input type="text" class="form-input ed-room" value="${period.room || ''}" placeholder="Room (opt)" oninput="updatePeriodField('${day}', '${period.id}', 'room', this.value)">
        </div>
      </div>
      <button class="btn-icon" style="color: var(--color-danger); border-color: rgba(239, 68, 68, 0.2);" onclick="deletePeriod('${day}', '${period.id}')">
        <i data-lucide="trash-2"></i>
      </button>
    `;
    container.appendChild(row);
  });
  
  lucide.createIcons();
}

function addEmptyPeriodToDay(day) {
  const dayPeriods = state.timetable[day] || [];
  const nextNum = dayPeriods.length + 1;
  
  // Try to default the start time based on the last period
  let startTime = '09:00';
  let endTime = '09:55';
  if (dayPeriods.length > 0) {
    const lastP = dayPeriods[dayPeriods.length - 1];
    // Add 5 min buffer to last period's end time
    const [h, m] = lastP.endTime.split(':').map(Number);
    let nextStartMin = m + 5;
    let nextStartHour = h;
    if (nextStartMin >= 60) {
      nextStartMin -= 60;
      nextStartHour += 1;
    }
    
    let nextEndMin = nextStartMin + 55;
    let nextEndHour = nextStartHour;
    if (nextEndMin >= 60) {
      nextEndMin -= 60;
      nextEndHour += 1;
    }

    startTime = `${String(nextStartHour).padStart(2, '0')}:${String(nextStartMin).padStart(2, '0')}`;
    endTime = `${String(nextEndHour).padStart(2, '0')}:${String(nextEndMin).padStart(2, '0')}`;
  }

  const newPeriod = {
    id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    periodNumber: nextNum,
    subjectId: state.subjects.length > 0 ? state.subjects[0].id : 'break',
    startTime: startTime,
    endTime: endTime,
    room: ''
  };

  state.timetable[day].push(newPeriod);
  saveToLocalStorage();
  renderTimetableEditor(day);
  renderTimetableGrid();
  showToast('New period added.', 'success');
}

function updatePeriodField(day, periodId, field, value) {
  const period = state.timetable[day].find(p => p.id === periodId);
  if (period) {
    period[field] = value;
    saveToLocalStorage();
    renderTimetableGrid();
  }
}

function deletePeriod(day, periodId) {
  const dayPeriods = state.timetable[day] || [];
  const index = dayPeriods.findIndex(p => p.id === periodId);
  
  if (index !== -1) {
    state.timetable[day].splice(index, 1);
    
    // Re-adjust remaining period numbering
    state.timetable[day].forEach((p, i) => {
      p.periodNumber = i + 1;
    });

    saveToLocalStorage();
    renderTimetableEditor(day);
    renderTimetableGrid();
    showToast('Period deleted.', 'success');
  }
}

// Timetable Copy tools
function openCopyDayModal() {
  const activeTab = document.querySelector('#timetable-day-tabs .tab-btn.active');
  if (!activeTab) return;
  const sourceDay = activeTab.getAttribute('data-day');

  document.getElementById('form-copy-source-day').value = sourceDay;
  document.getElementById('copy-source-day-label').textContent = DAYS_MAP[sourceDay];
  
  // Set default selection to something else
  const targetSelect = document.getElementById('form-copy-target-day');
  for (let i = 0; i < targetSelect.options.length; i++) {
    if (targetSelect.options[i].value !== sourceDay) {
      targetSelect.selectedIndex = i;
      break;
    }
  }

  document.getElementById('modal-copy-timetable').classList.add('active');
}

function closeCopyDayModal() {
  document.getElementById('modal-copy-timetable').classList.remove('active');
}

function copyDayTimetable() {
  const sourceDay = document.getElementById('form-copy-source-day').value;
  const targetDay = document.getElementById('form-copy-target-day').value;

  if (sourceDay === targetDay) {
    showToast('Cannot copy timetable to the same day!', 'error');
    return;
  }

  // Deep clone
  const cloned = JSON.parse(JSON.stringify(state.timetable[sourceDay]));
  // Generate unique IDs for target day periods
  cloned.forEach((p, idx) => {
    p.id = `${targetDay}_p_${Date.now()}_${idx}`;
  });

  state.timetable[targetDay] = cloned;
  saveToLocalStorage();
  closeCopyDayModal();
  renderTimetableGrid();
  
  // If target day is currently selected day in editor, reload editor
  const activeTab = document.querySelector('#timetable-day-tabs .tab-btn.active').getAttribute('data-day');
  if (activeTab === targetDay) {
    renderTimetableEditor(targetDay);
  }
  
  showToast(`Successfully copied timetable to ${DAYS_MAP[targetDay]}!`, 'success');
}

function copyEntireWeekJson() {
  // Let the user copy the JSON configuration or we export copy command
  const weekJson = JSON.stringify(state.timetable, null, 2);
  navigator.clipboard.writeText(weekJson).then(() => {
    showToast('Weekly timetable configuration copied to clipboard!', 'success');
  }).catch(err => {
    showToast('Failed to copy. Check developer console.', 'error');
  });
}


// 3. SUBJECTS VIEW
function renderSubjects() {
  const container = document.getElementById('subjects-container');
  container.innerHTML = '';

  const query = document.getElementById('subject-search-input').value.toLowerCase().trim();

  const filtered = state.subjects.filter(sub => {
    return sub.title.toLowerCase().includes(query) || 
           sub.shortForm.toLowerCase().includes(query) || 
           sub.facultyInitial.toLowerCase().includes(query) ||
           (sub.code && sub.code.toLowerCase().includes(query)) ||
           (sub.facultyName && sub.facultyName.toLowerCase().includes(query));
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="card" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">No courses found. Add a new one above.</div>`;
    return;
  }

  filtered.forEach(sub => {
    const stats = getSubjectMetrics(sub.id);
    const pctColorClass = getPercentColorClass(stats.percent, sub.targetPercent);

    const card = document.createElement('div');
    card.className = 'card subject-card';
    card.style.setProperty('--sub-color', sub.color);

    // Build forecasted advice string
    let adviceText = '';
    if (stats.conducted === 0) {
      adviceText = 'No classes logged yet.';
    } else {
      if (stats.percent >= sub.targetPercent) {
        adviceText = `You can safely miss <strong>${stats.xMiss}</strong> classes.`;
      } else {
        adviceText = `Must attend <strong>${stats.yAttend}</strong> classes consecutively.`;
      }
    }

    card.innerHTML = `
      <div class="subject-card-header">
        <div class="subject-card-title">
          <h3>${sub.title} (${sub.shortForm})</h3>
          <p>${sub.code ? `${sub.code} | ` : ''}Faculty: ${sub.facultyInitial} ${sub.facultyName ? `(${sub.facultyName})` : ''}</p>
        </div>
      </div>
      
      <div class="subject-stats-row">
        <div class="subject-stat-item">
          <span class="subject-stat-val">${stats.attended} / ${stats.conducted}</span>
          <span class="subject-stat-lbl">Attended (incl. OD)</span>
        </div>
        <div class="subject-stat-item">
          <span class="subject-stat-val">${stats.missed}</span>
          <span class="subject-stat-lbl">Missed (Bunked)</span>
        </div>
      </div>

      <div style="margin-top:16px; font-size:0.85rem; color: var(--text-secondary);">
        ${adviceText}
      </div>

      <div class="subject-card-footer">
        <div class="subject-card-pct ${pctColorClass}">${stats.percent}%</div>
        <div class="subject-actions">
          <button class="btn-icon" onclick="openSubjectModal('${sub.id}')" title="Edit course"><i data-lucide="edit-2"></i></button>
          <button class="btn-icon" style="color:var(--color-danger); border-color: rgba(239,68,68,0.2);" onclick="deleteSubject('${sub.id}')" title="Delete course"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  lucide.createIcons();
}

function openSubjectModal(subjectId = null) {
  const modal = document.getElementById('modal-subject');
  const title = document.getElementById('modal-subject-title');
  
  // Clear forms
  document.getElementById('form-subject-id').value = '';
  document.getElementById('form-subject-title').value = '';
  document.getElementById('form-subject-short').value = '';
  document.getElementById('form-subject-faculty-initial').value = '';
  document.getElementById('form-subject-code').value = '';
  document.getElementById('form-subject-faculty-name').value = '';
  document.getElementById('form-subject-credits').value = '';
  document.getElementById('form-subject-target').value = state.settings.globalTarget;

  // Render color options
  const colorPicker = document.getElementById('subject-color-picker');
  colorPicker.innerHTML = '';
  COLOR_PRESETS.forEach((color, idx) => {
    const node = document.createElement('div');
    node.className = 'color-option' + (idx === 0 ? ' selected' : '');
    node.style.backgroundColor = color;
    node.setAttribute('data-color', color);
    node.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(n => n.classList.remove('selected'));
      node.classList.add('selected');
    });
    colorPicker.appendChild(node);
  });

  if (subjectId) {
    title.textContent = 'Edit Course';
    const sub = state.subjects.find(s => s.id === subjectId);
    if (sub) {
      document.getElementById('form-subject-id').value = sub.id;
      document.getElementById('form-subject-title').value = sub.title;
      document.getElementById('form-subject-short').value = sub.shortForm;
      document.getElementById('form-subject-faculty-initial').value = sub.facultyInitial;
      document.getElementById('form-subject-code').value = sub.code || '';
      document.getElementById('form-subject-faculty-name').value = sub.facultyName || '';
      document.getElementById('form-subject-credits').value = sub.credits || '';
      document.getElementById('form-subject-target').value = sub.targetPercent || state.settings.globalTarget;
      
      // Select appropriate color node
      document.querySelectorAll('.color-option').forEach(n => {
        if (n.getAttribute('data-color') === sub.color) {
          n.classList.add('selected');
        } else {
          n.classList.remove('selected');
        }
      });
    }
  } else {
    title.textContent = 'Add Course';
  }

  modal.classList.add('active');
  lucide.createIcons();
}

function closeSubjectModal() {
  document.getElementById('modal-subject').classList.remove('active');
}

function saveSubject() {
  const id = document.getElementById('form-subject-id').value;
  const title = document.getElementById('form-subject-title').value.trim();
  const shortForm = document.getElementById('form-subject-short').value.trim();
  const facultyInitial = document.getElementById('form-subject-faculty-initial').value.trim();
  const code = document.getElementById('form-subject-code').value.trim();
  const facultyName = document.getElementById('form-subject-faculty-name').value.trim();
  const credits = parseInt(document.getElementById('form-subject-credits').value) || '';
  const targetPercent = parseInt(document.getElementById('form-subject-target').value) || state.settings.globalTarget;
  
  const selectedColorNode = document.querySelector('.color-option.selected');
  const color = selectedColorNode ? selectedColorNode.getAttribute('data-color') : COLOR_PRESETS[0];

  if (!title || !shortForm || !facultyInitial) {
    showToast('Please fill in all required fields marked with *', 'error');
    return;
  }

  if (id) {
    // Edit existing
    const idx = state.subjects.findIndex(s => s.id === id);
    if (idx !== -1) {
      state.subjects[idx] = {
        ...state.subjects[idx],
        title, shortForm, facultyInitial, code, facultyName, credits, color, targetPercent
      };
      showToast('Course details modified successfully!', 'success');
    }
  } else {
    // Add new
    const newSub = {
      id: 'sub_' + Date.now(),
      title, shortForm, facultyInitial, code, facultyName, credits, color, targetPercent
    };
    state.subjects.push(newSub);
    showToast('New course registered!', 'success');
  }

  saveToLocalStorage();
  closeSubjectModal();
  refreshActiveView();
}

function deleteSubject(subjectId) {
  const sub = state.subjects.find(s => s.id === subjectId);
  if (!sub) return;

  if (confirm(`Are you sure you want to delete ${sub.title}? All attendance logs linked to this subject will be removed.`)) {
    
    // Remove subject
    state.subjects = state.subjects.filter(s => s.id !== subjectId);

    // Delete matching records in attendance
    Object.keys(state.attendance).forEach(date => {
      const dayLogs = state.attendance[date];
      Object.keys(dayLogs).forEach(pId => {
        if (dayLogs[pId].subjectId === subjectId) {
          delete dayLogs[pId];
        }
      });
      if (Object.keys(dayLogs).length === 0) {
        delete state.attendance[date];
      }
    });

    // Remove from timetable configuration
    Object.keys(state.timetable).forEach(day => {
      state.timetable[day] = state.timetable[day].map(p => {
        if (p.subjectId === subjectId) {
          p.subjectId = 'break'; // reset to break/free period
        }
        return p;
      });
    });

    saveToLocalStorage();
    showToast('Course and its records deleted.', 'success');
    refreshActiveView();
  }
}


// 4. ATTENDANCE HISTORY VIEW
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth(); // 0-indexed

function renderCalendar() {
  const daysGrid = document.getElementById('calendar-days-grid');
  // Clear other than weekdays
  daysGrid.innerHTML = '';

  const monthDisplay = document.getElementById('calendar-month-year-display');
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  monthDisplay.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;

  // First day of target month
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  // Total days in target month
  const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  // Draw offset empty cells
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty';
    daysGrid.appendChild(emptyCell);
  }

  // Draw day cells
  for (let day = 1; day <= totalDays; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    
    const formattedDate = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (formattedDate === state.selectedDate) {
      dayCell.classList.add('selected');
    }

    dayCell.addEventListener('click', () => {
      state.selectedDate = formattedDate;
      document.querySelectorAll('.calendar-day').forEach(c => c.classList.remove('selected'));
      dayCell.classList.add('selected');
      updateSelectedDateUI();
    });

    // Draw dots representing attendance logged for this date
    const dateLogs = state.attendance[formattedDate] || {};
    let dotsHTML = '';
    
    Object.values(dateLogs).forEach(log => {
      const sub = state.subjects.find(s => s.id === log.subjectId);
      if (!sub) return;
      
      let dotColor = '#94a3b8'; // grey
      if (log.status === 'attended') dotColor = 'var(--color-success)';
      if (log.status === 'bunked') dotColor = 'var(--color-danger)';
      if (log.status === 'od') dotColor = 'var(--color-warning)';
      if (log.status === 'cancelled') dotColor = 'var(--text-muted)';
      if (log.status === 'holiday') dotColor = '#a855f7'; // Purple for Holiday
      
      dotsHTML += `<span class="calendar-dot" style="background-color: ${dotColor};"></span>`;
    });

    dayCell.innerHTML = `
      <span class="calendar-day-num">${day}</span>
      <div class="calendar-day-indicators">${dotsHTML}</div>
    `;

    daysGrid.appendChild(dayCell);
  }
}

function shiftCalendarMonth(offset) {
  calendarMonth += offset;
  if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear -= 1;
  } else if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear += 1;
  }
  renderCalendar();
}

function updateSelectedDateUI() {
  if (!state.selectedDate) return;

  const [y, m, d] = state.selectedDate.split('-').map(Number);
  const parsedDate = new Date(y, m - 1, d);

  // Set visual title
  const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  document.getElementById('selected-date-title').textContent = `Classes on ${parsedDate.toLocaleDateString('en-US', dateOptions)}`;

  // Find day schedule
  const weekdayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  let weekday = weekdayNames[parsedDate.getDay()];
  if (weekday === 'sat' && state.settings.saturdaySchedule && state.settings.saturdaySchedule !== 'off') {
    weekday = state.settings.saturdaySchedule;
  }

  const container = document.getElementById('selected-date-classes-list');
  container.innerHTML = '';

  const dayPeriods = state.timetable[weekday] || [];
  const dateLogs = state.attendance[state.selectedDate] || {};

  if (weekday === 'sun') {
    container.innerHTML = `<div class="timetable-cell empty"><i data-lucide="coffee"></i> <span>Sunday - College is closed.</span></div>`;
    lucide.createIcons();
    return;
  }

  if (dayPeriods.length === 0) {
    container.innerHTML = `<div class="timetable-cell empty"><i data-lucide="calendar"></i> <span>No periods scheduled for this weekday.</span></div>`;
    lucide.createIcons();
    return;
  }

  dayPeriods.forEach(period => {
    if (period.subjectId === 'break') {
      container.innerHTML += `
        <div class="period-card" style="opacity: 0.7;">
          <div class="period-info">
            <div class="period-badge" style="background: var(--text-muted);"><i data-lucide="coffee"></i></div>
            <div class="period-meta">
              <h3>Break</h3>
              <p><i data-lucide="clock" style="width:12px; height:12px;"></i> ${period.startTime} - ${period.endTime}</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const subject = state.subjects.find(s => s.id === period.subjectId);
    if (!subject) return;

    const log = dateLogs[period.id];
    const isMarked = !!log;
    const currentStatus = isMarked ? log.status : '';

    const row = document.createElement('div');
    row.className = 'period-card';
    row.style.borderLeft = `5px solid ${subject.color}`;

    // Action button render (dropdown or click logs)
    let actionSelectHTML = `
      <div class="period-actions" style="flex-wrap: wrap;">
        <select class="form-select" style="width: 150px; font-weight:600;" onchange="markCalendarAttendance('${state.selectedDate}', '${period.id}', this.value)">
          <option value="" ${!isMarked ? 'selected' : ''}>-- Unmarked --</option>
          <option value="attended" ${currentStatus === 'attended' ? 'selected' : ''}>✔ Attended</option>
          <option value="bunked" ${currentStatus === 'bunked' ? 'selected' : ''}>❌ Bunked</option>
          <option value="od" ${currentStatus === 'od' ? 'selected' : ''}>🟠 OD</option>
          <option value="cancelled" ${currentStatus === 'cancelled' ? 'selected' : ''}>⚪ Cancelled</option>
          <option value="holiday" ${currentStatus === 'holiday' ? 'selected' : ''}>🟣 Holiday</option>
        </select>
      </div>
    `;

    row.innerHTML = `
      <div class="period-info">
        <div class="period-badge" style="background: ${subject.color};">Period <span>${period.periodNumber}</span></div>
        <div class="period-meta">
          <h3>${subject.title} (${subject.shortForm})</h3>
          <p>
            <i data-lucide="clock" style="width:12px; height:12px;"></i> ${period.startTime} - ${period.endTime}
            ${period.room ? ` | Room: ${period.room}` : ''}
          </p>
        </div>
      </div>
      ${actionSelectHTML}
    `;

    container.appendChild(row);
  });

  lucide.createIcons();
}

function markCalendarAttendance(dateStr, periodId, status) {
  if (status === '') {
    if (state.attendance[dateStr]) {
      delete state.attendance[dateStr][periodId];
      if (Object.keys(state.attendance[dateStr]).length === 0) {
        delete state.attendance[dateStr];
      }
    }
  } else {
    if (!state.attendance[dateStr]) {
      state.attendance[dateStr] = {};
    }
    let dayOfWeek = getDayOfWeekFromDateString(dateStr);
    if (dayOfWeek === 'sat' && state.settings.saturdaySchedule && state.settings.saturdaySchedule !== 'off') {
      dayOfWeek = state.settings.saturdaySchedule;
    }
    const periods = state.timetable[dayOfWeek] || [];
    const period = periods.find(p => p.id === periodId);

    state.attendance[dateStr][periodId] = {
      subjectId: period ? period.subjectId : state.attendance[dateStr][periodId].subjectId,
      status: status,
      timestamp: Date.now()
    };
  }

  saveToLocalStorage();
  showToast('Attendance log updated.', 'success');
  
  // Re-render components
  renderCalendar();
  updateSelectedDateUI();
}


// 5. STATISTICS VIEW
function renderStatistics() {
  const tbody = document.getElementById('stats-table-body');
  tbody.innerHTML = '';

  const chartsContainer = document.getElementById('stats-gauges-container');
  chartsContainer.innerHTML = '';

  if (state.subjects.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">Create subjects to calculate analytics.</td></tr>`;
    return;
  }

  state.subjects.forEach(sub => {
    const stats = getSubjectMetrics(sub.id);
    const pctColorClass = getPercentColorClass(stats.percent, sub.targetPercent);

    // Row Table
    const tr = document.createElement('tr');
    
    let forecastHTML = '';
    if (stats.conducted === 0) {
      forecastHTML = '<span style="color:var(--text-muted)">No data logged.</span>';
    } else {
      if (stats.percent >= sub.targetPercent) {
        forecastHTML = `<span class="pct-green" style="font-weight:600;"><i data-lucide="check-circle" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Miss safely: ${stats.xMiss}</span>`;
      } else {
        forecastHTML = `<span class="pct-red" style="font-weight:600;"><i data-lucide="alert-circle" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Attend: ${stats.yAttend} consecutive</span>`;
      }
    }

    tr.innerHTML = `
      <td><strong>${sub.title} (${sub.shortForm})</strong></td>
      <td>${stats.conducted}</td>
      <td>${stats.attended}</td>
      <td>${stats.missed}</td>
      <td>${stats.od}</td>
      <td>${stats.cancelled}</td>
      <td><span class="${pctColorClass}" style="font-weight: 700;">${stats.percent}%</span></td>
      <td><strong>${sub.targetPercent}%</strong></td>
      <td>${forecastHTML}</td>
    `;
    tbody.appendChild(tr);

    // SVG Circular Chart Gauge
    const chartCard = document.createElement('div');
    chartCard.className = 'card chart-card';
    
    // Stroke dash offset calculation
    // Circle circumference = 2 * PI * r = 2 * 3.14159 * 15.915494 = 100
    // So percentage mapping matches directly to stroke-dashoffset!
    const dashOffset = 100 - stats.percent;

    chartCard.innerHTML = `
      <svg viewBox="0 0 36 36" class="circular-chart">
        <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        <path class="circle" stroke="${sub.color}" stroke-dasharray="${stats.percent}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        <text x="18" y="20.35" class="percentage">${stats.percent}%</text>
      </svg>
      <div class="chart-subject-title">${sub.title}</div>
      <div class="chart-subject-meta">Target: ${sub.targetPercent}% | Con: ${stats.conducted}</div>
    `;
    chartsContainer.appendChild(chartCard);
  });

  lucide.createIcons();
}


// 6. SETTINGS VIEW
function renderSettings() {
  document.getElementById('input-global-target').value = state.settings.globalTarget;
  updateThemeButtons();

  const satDropdown = document.getElementById('select-saturday-schedule');
  if (satDropdown) {
    satDropdown.value = state.settings.saturdaySchedule || 'off';
  }
  
  // Render Config Backup Text
  const configObj = {
    subjects: state.subjects,
    timetable: state.timetable,
    attendance: state.attendance,
    settings: state.settings
  };
  document.getElementById('settings-backup-area').value = JSON.stringify(configObj, null, 2);
}

function updateThemeButtons() {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    if (btn.getAttribute('data-theme') === state.settings.theme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.setAttribute('data-theme', systemTheme);
  } else {
    root.setAttribute('data-theme', theme);
  }
}

// Watch system theme change if 'system' selected
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (state.settings.theme === 'system') {
    applyTheme('system');
  }
});


// DATA RESTORE & BACKUPS
function downloadBackupFile() {
  const configObj = {
    subjects: state.subjects,
    timetable: state.timetable,
    attendance: state.attendance,
    settings: state.settings
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configObj, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `attendance_backup_${getLocalDateString()}.json`);
  dlAnchorElem.click();
}

function uploadBackupFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const parsed = JSON.parse(event.target.result);
      if (parsed.subjects && parsed.timetable && parsed.attendance && parsed.settings) {
        state.subjects = parsed.subjects;
        state.timetable = parsed.timetable;
        state.attendance = parsed.attendance;
        state.settings = parsed.settings;
        
        saveToLocalStorage();
        applyTheme(state.settings.theme);
        showToast('JSON backup file applied successfully!', 'success');
        refreshActiveView();
      } else {
        showToast('Invalid backup file structure.', 'error');
      }
    } catch(err) {
      showToast('Error parsing JSON backup file.', 'error');
    }
  };
  reader.readAsText(file);
}

function restoreBackupFromTextArea() {
  const txtVal = document.getElementById('settings-backup-area').value.trim();
  try {
    const parsed = JSON.parse(txtVal);
    if (parsed.subjects && parsed.timetable && parsed.attendance && parsed.settings) {
      state.subjects = parsed.subjects;
      state.timetable = parsed.timetable;
      state.attendance = parsed.attendance;
      state.settings = parsed.settings;

      saveToLocalStorage();
      applyTheme(state.settings.theme);
      showToast('Text configuration updated successfully!', 'success');
      refreshActiveView();
    } else {
      showToast('Invalid JSON layout keys in configuration text.', 'error');
    }
  } catch(err) {
    showToast('Parsing error. Ensure text is valid formatted JSON.', 'error');
  }
}

// EXPORT ATTENDANCE TO CSV
function exportAttendanceCSV() {
  let csvContent = "data:text/csv;charset=utf-8,Date,Period,Course Code,Course Short Form,Course Title,Status\n";

  // Sort dates keys
  const sortedDates = Object.keys(state.attendance).sort();
  
  if (sortedDates.length === 0) {
    showToast('No logs available to export.', 'error');
    return;
  }

  sortedDates.forEach(date => {
    const dateLogs = state.attendance[date];
    // Find weekday of date to resolve Period Number label
    const dayOfWeek = getDayOfWeekFromDateString(date);
    const periods = state.timetable[dayOfWeek] || [];

    Object.keys(dateLogs).forEach(pId => {
      const log = dateLogs[pId];
      const sub = state.subjects.find(s => s.id === log.subjectId);
      const period = periods.find(p => p.id === pId);
      
      const periodLabel = period ? `Period ${period.periodNumber}` : 'Custom';
      const subCode = sub ? sub.code || '' : '';
      const subShort = sub ? sub.shortForm : '';
      const subTitle = sub ? sub.title.replace(/,/g, ' ') : 'Unknown';

      csvContent += `${date},${periodLabel},${subCode},${subShort},"${subTitle}",${log.status}\n`;
    });
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `attendance_records_${getLocalDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// IMPORT ATTENDANCE CSV
function importAttendanceCSV(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const lines = event.target.result.split('\n');
    let importedCount = 0;
    
    // Format expected: Date,Period,Course Code,Course Short Form,Course Title,Status
    // e.g. 2026-07-08,Period 1,CS-401,ML,Machine Learning,attended
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length < 6) continue;

      const dateStr = parts[0].trim();
      const periodLabel = parts[1].trim();
      const subShort = parts[3].trim();
      const status = parts[5].trim();

      // Find matching subject
      const sub = state.subjects.find(s => s.shortForm.toLowerCase() === subShort.toLowerCase());
      if (!sub) continue;

      // Match period index
      const dayOfWeek = getDayOfWeekFromDateString(dateStr);
      const periods = state.timetable[dayOfWeek] || [];
      
      // Attempt to find period mapping
      let matchedPeriod = periods.find(p => {
        const numStr = periodLabel.replace(/\D/g, ''); // Extract digits
        return p.periodNumber === parseInt(numStr);
      });

      // If no matching timetable period, we skip or generate a unique ID
      let periodId = matchedPeriod ? matchedPeriod.id : `custom_p_${Date.now()}_${i}`;

      if (!state.attendance[dateStr]) {
        state.attendance[dateStr] = {};
      }

      state.attendance[dateStr][periodId] = {
        subjectId: sub.id,
        status: status,
        timestamp: Date.now()
      };
      importedCount++;
    }

    if (importedCount > 0) {
      saveToLocalStorage();
      showToast(`Successfully imported ${importedCount} records from CSV!`, 'success');
      refreshActiveView();
    } else {
      showToast('No matching records found in CSV file. Validate subject short-forms.', 'error');
    }
  };
  reader.readAsText(file);
}


// ----------------------------------------------------
// MATH & ANALYTICS UTILS
// ----------------------------------------------------

// Metrics calculator for a single subject
function getSubjectMetrics(subId) {
  let attended = 0;
  let conducted = 0;
  let od = 0;
  let cancelled = 0;

  const sub = state.subjects.find(s => s.id === subId);
  const target = sub ? sub.targetPercent : 75;

  Object.values(state.attendance).forEach(dateLogs => {
    Object.values(dateLogs).forEach(log => {
      if (log.subjectId === subId) {
        if (log.status === 'attended') {
          attended++;
          conducted++;
        } else if (log.status === 'bunked') {
          conducted++;
        } else if (log.status === 'od') {
          od++;
          conducted++;
        } else if (log.status === 'cancelled') {
          cancelled++;
        }
      }
    });
  });

  const present = attended + od;
  let percent = 100;
  if (conducted > 0) {
    percent = (present / conducted) * 100;
    percent = Math.round(percent * 100) / 100;
  }

  // Calculate safely miss X classes
  let xMiss = 0;
  if (percent >= target && conducted > 0) {
    // present / (conducted + X) >= target/100
    // X <= present / (target/100) - conducted
    const targetDecimal = target / 100;
    xMiss = Math.floor(present / targetDecimal - conducted);
    if (xMiss < 0) xMiss = 0;
  }

  // Calculate must attend Y classes consecutively
  let yAttend = 0;
  if (percent < target && conducted > 0) {
    // (present + Y) / (conducted + Y) >= target/100
    // present + Y >= (conducted + Y)*target/100
    // Y(1 - target/100) >= conducted*target/100 - present
    // Y >= (conducted*target/100 - present) / (1 - target/100)
    const targetDecimal = target / 100;
    yAttend = Math.ceil((conducted * targetDecimal - present) / (1 - targetDecimal));
    if (yAttend < 0) yAttend = 0;
  }

  return {
    attended,
    conducted,
    od,
    cancelled,
    missed: conducted - present,
    percent,
    xMiss,
    yAttend
  };
}

// Check if critical/warning attendance alerts should trigger for a subject based on 10-min schedule rule
function shouldShowWarningNow(subjectId) {
  const stats = getSubjectMetrics(subjectId);
  const sub = state.subjects.find(s => s.id === subjectId);
  const target = sub ? sub.targetPercent : 75;
  
  if (stats.percent >= target || stats.conducted === 0) {
    return false;
  }

  const todayDateStr = getLocalDateString();
  const actualDay = getLocalDayOfWeekString().toLowerCase().slice(0, 3);
  let activeDay = actualDay;
  if (actualDay === 'sat' && state.settings.saturdaySchedule && state.settings.saturdaySchedule !== 'off') {
    activeDay = state.settings.saturdaySchedule;
  }

  const todayPeriods = state.timetable[activeDay] || [];
  const markedToday = state.attendance[todayDateStr] || {};

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return todayPeriods.some(period => {
    if (period.subjectId !== subjectId) return false;
    
    // If already marked, no warning needed for this class period
    if (markedToday[period.id]) return false;

    const [startH, startM] = period.startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    
    const [endH, endM] = period.endTime.split(':').map(Number);
    const endMinutes = endH * 60 + endM;

    // Show warning starting 10 minutes before class, until it ends (with a 60 min buffer)
    return currentMinutes >= (startMinutes - 10) && currentMinutes <= (endMinutes + 60);
  });
}

// Metrics calculator across all subjects combined
function getOverallMetrics() {
  let totalConducted = 0;
  let totalPresent = 0;
  let totalAttended = 0;
  let totalMissed = 0;
  let totalOD = 0;
  let totalCancelled = 0;

  state.subjects.forEach(sub => {
    const stats = getSubjectMetrics(sub.id);
    totalConducted += stats.conducted;
    totalPresent += (stats.attended + stats.od);
    totalAttended += stats.attended;
    totalMissed += stats.missed;
    totalOD += stats.od;
    totalCancelled += stats.cancelled;
  });

  let percent = 100;
  if (totalConducted > 0) {
    percent = (totalPresent / totalConducted) * 100;
    percent = Math.round(percent * 100) / 100;
  }

  return {
    conducted: totalConducted,
    present: totalPresent,
    attended: totalAttended,
    missed: totalMissed,
    od: totalOD,
    cancelled: totalCancelled,
    percent
  };
}

// Return color matching thresholds
function getPercentColorClass(pct, target = 75) {
  if (pct >= 80) return 'pct-green';
  if (pct >= target) return 'pct-orange';
  return 'pct-red';
}


// ----------------------------------------------------
// TIME & DATE HELPERS
// ----------------------------------------------------

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLocalDayOfWeekString(date = new Date()) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

function getDayOfWeekFromDateString(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[parsed.getDay()];
}


// ----------------------------------------------------
// UI TOAST ALERTS
// ----------------------------------------------------

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'check-circle';
  if (type === 'error') icon = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${icon}" style="width: 18px; height: 18px;"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  lucide.createIcons();

  // Animation removal
  setTimeout(() => {
    toast.style.animation = 'fadeOut var(--transition-fast) forwards';
    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 2200);
}

// Render visual schedule list for mobile view
function renderMobileTimetableList(day) {
  const container = document.getElementById('mobile-timetable-list-container');
  if (!container) return;
  
  container.innerHTML = '';
  const dayPeriods = state.timetable[day] || [];
  
  if (dayPeriods.length === 0) {
    container.innerHTML = `
      <div class="timetable-cell empty" style="padding: 30px; width: 100%; border: 1px dashed var(--border-color); display: flex; align-items: center; justify-content: center; flex-direction: column;">
        <i data-lucide="calendar" style="margin-bottom: 6px; width: 24px; height: 24px; color: var(--text-muted);"></i>
        <span style="color: var(--text-muted); font-size: 0.85rem;">No classes scheduled for this day.</span>
      </div>`;
    lucide.createIcons();
    return;
  }
  
  dayPeriods.forEach(period => {
    if (period.subjectId === 'break') {
      const breakRow = document.createElement('div');
      breakRow.className = 'period-card';
      breakRow.style.opacity = '0.7';
      breakRow.innerHTML = `
        <div class="period-info">
          <div class="period-badge" style="background: var(--text-muted);"><i data-lucide="coffee"></i></div>
          <div class="period-meta">
            <h3>Coffee Break</h3>
            <p><i data-lucide="clock" style="width:12px; height:12px;"></i> ${period.startTime} - ${period.endTime}</p>
          </div>
        </div>
      `;
      container.appendChild(breakRow);
      return;
    }
    
    const subject = state.subjects.find(s => s.id === period.subjectId);
    if (!subject) return;
    
    const card = document.createElement('div');
    card.className = 'period-card';
    card.style.borderLeft = `5px solid ${subject.color}`;
    card.innerHTML = `
      <div class="period-info">
        <div class="period-badge" style="background: ${subject.color};">Period <span>${period.periodNumber}</span></div>
        <div class="period-meta">
          <h3>${subject.title} (${subject.shortForm})</h3>
          <p>
            <i data-lucide="clock" style="width:12px; height:12px;"></i> ${period.startTime} - ${period.endTime}
            ${period.room ? ` | <i data-lucide="map-pin" style="width:12px; height:12px;"></i> ${period.room}` : ''}
            | <i data-lucide="user" style="width:12px; height:12px;"></i> ${subject.facultyInitial}
          </p>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
  
  lucide.createIcons();
}

function markTodayAsHoliday() {
  const todayStr = getLocalDateString();
  const todayDay = getLocalDayOfWeekString().toLowerCase().slice(0, 3);
  let activeDay = todayDay;
  if (todayDay === 'sat' && state.settings.saturdaySchedule && state.settings.saturdaySchedule !== 'off') {
    activeDay = state.settings.saturdaySchedule;
  }
  const periods = state.timetable[activeDay] || [];
  const nonBreakPeriods = periods.filter(p => p.subjectId !== 'break');

  if (nonBreakPeriods.length === 0) {
    showToast('No classes scheduled for today to mark as holiday.', 'error');
    return;
  }

  if (!state.attendance[todayStr]) {
    state.attendance[todayStr] = {};
  }

  // Backup for undo
  state.lastAction = {
    date: todayStr,
    isHolidayAction: true,
    previousMarks: JSON.parse(JSON.stringify(state.attendance[todayStr]))
  };

  nonBreakPeriods.forEach(period => {
    state.attendance[todayStr][period.id] = {
      subjectId: period.subjectId,
      status: 'holiday',
      timestamp: Date.now()
    };
  });

  saveToLocalStorage();
  showToast('Today marked as Holiday!', 'success');
  refreshActiveView();
}

function clearTodayHoliday() {
  const todayStr = getLocalDateString();
  if (state.attendance[todayStr]) {
    const todayDay = getLocalDayOfWeekString().toLowerCase().slice(0, 3);
    let activeDay = todayDay;
    if (todayDay === 'sat' && state.settings.saturdaySchedule && state.settings.saturdaySchedule !== 'off') {
      activeDay = state.settings.saturdaySchedule;
    }
    const periods = state.timetable[activeDay] || [];
    periods.forEach(p => {
      if (p.subjectId !== 'break' && state.attendance[todayStr][p.id] && state.attendance[todayStr][p.id].status === 'holiday') {
        delete state.attendance[todayStr][p.id];
      }
    });
    if (Object.keys(state.attendance[todayStr]).length === 0) {
      delete state.attendance[todayStr];
    }
  }
  saveToLocalStorage();
  showToast('Holiday status cleared!', 'success');
  refreshActiveView();
}
