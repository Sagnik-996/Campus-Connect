// API base URL configuration
const API_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize general page setups
  initTheme();
  setupMobileNav();
  checkSessionAndSetupNav();
});

// ==========================================
// 1. Theme Configuration
// ==========================================
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme');
      const targetTheme = activeTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', targetTheme);
      localStorage.setItem('theme', targetTheme);
      updateThemeIcon(targetTheme);
    });
  }
}

function updateThemeIcon(theme) {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;
  const icon = themeToggleBtn.querySelector('i');
  if (theme === 'dark') {
    icon.className = 'fa-solid fa-sun';
  } else {
    icon.className = 'fa-solid fa-moon';
  }
}

// ==========================================
// 2. Mobile Responsive Nav Bar Toggle
// ==========================================
function setupMobileNav() {
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('active');
      menuToggle.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && e.target !== menuToggle) {
        navLinks.classList.remove('active');
        menuToggle.classList.remove('active');
      }
    });
  }
}

// ==========================================
// 3. Toast Notifications helper
// ==========================================
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconClass = 'fa-circle-check';
  if (type === 'error') iconClass = 'fa-circle-exclamation';
  if (type === 'warning') iconClass = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Trigger slide-in animation
  setTimeout(() => {
    toast.classList.add('active');
  }, 10);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => {
      if (container.contains(toast)) container.removeChild(toast);
    });
  }, 4000);
}

// ==========================================
// 4. Session Validation & Page Guards
// ==========================================
let currentUser = null;

async function checkSessionAndSetupNav() {
  const path = window.location.pathname;
  const filename = path.substring(path.lastIndexOf('/') + 1);

  try {
    const res = await fetch(`${API_URL}/auth/status`);
    const data = await res.json();

    if (data.loggedIn) {
      currentUser = data.session;
      document.querySelectorAll('.user-link').forEach(el => el.style.display = 'block');
      
      if (data.role === 'admin') {
        document.querySelectorAll('.admin-link').forEach(el => el.style.display = 'block');
        const usernameEl = document.getElementById('nav-username');
        if (usernameEl) {
          usernameEl.innerText = `Admin: ${data.session.username}`;
          usernameEl.style.color = 'var(--danger)';
        }
      } else {
        const usernameEl = document.getElementById('nav-username');
        if (usernameEl) usernameEl.innerText = data.session.name;
      }

      const authBtns = document.getElementById('auth-buttons');
      if (authBtns) authBtns.style.display = 'none';

      const userMenu = document.getElementById('user-profile-menu');
      if (userMenu) userMenu.style.display = 'flex';

      // Setup Logout button handler
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
      }

      // Guard checks for Logged-in users hitting login pages
      if (filename === 'login.html' || filename === 'register.html' || filename === 'admin-login.html') {
        if (data.role === 'admin') {
          window.location.replace('admin-dashboard.html');
        } else {
          window.location.replace('events.html');
        }
      }
    } else {
      // Guest User state
      // Guards for pages requiring login
      const studentPages = ['events.html', 'event-details.html', 'my-bookings.html', 'profile.html'];
      const adminPages = ['admin-dashboard.html', 'add-event.html', 'manage-events.html', 'manage-venues.html', 'manage-departments.html', 'manage-users.html', 'bookings.html'];

      if (studentPages.includes(filename)) {
        window.location.replace('login.html');
        return;
      }
      if (adminPages.includes(filename)) {
        window.location.replace('admin-login.html');
        return;
      }
    }

    // Role-Based URL checks for normal users trying admin URLs
    if (data.loggedIn && data.role === 'user') {
      const adminPages = ['admin-dashboard.html', 'add-event.html', 'manage-events.html', 'manage-venues.html', 'manage-departments.html', 'manage-users.html', 'bookings.html'];
      if (adminPages.includes(filename)) {
        document.body.innerHTML = `
          <div style="height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; background-color:var(--bg-primary); font-family:var(--font-family-title);">
            <i class="fa-solid fa-lock" style="font-size:4rem; color:var(--danger); margin-bottom:20px;"></i>
            <h1 style="font-size:2rem; margin-bottom:10px;">Access Denied</h1>
            <p style="color:var(--text-secondary); margin-bottom:20px;">You do not have administrative privileges to view this portal.</p>
            <a href="events.html" class="btn btn-primary">Go to Student Portal</a>
          </div>
        `;
        return;
      }
    }

    // Route-specific triggers once session is resolved
    triggerPageModule(filename);

  } catch (err) {
    console.error('Session check failed:', err);
  }
}

async function handleLogout(e) {
  e.preventDefault();
  try {
    const res = await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showToast('Signed out successfully.', 'success');
      setTimeout(() => {
        window.location.replace('index.html');
      }, 500);
    } else {
      showToast(data.error || 'Failed to logout.', 'error');
    }
  } catch (err) {
    console.error('Logout error:', err);
  }
}

// ==========================================
// 5. Page Modules Dispatcher
// ==========================================
function triggerPageModule(filename) {
  switch (filename) {
    case 'register.html':
      initRegisterForm();
      break;
    case 'login.html':
      initLoginForm();
      break;
    case 'admin-login.html':
      initAdminLoginForm();
      break;
    case 'events.html':
      initEventsPage();
      break;
    case 'event-details.html':
      initEventDetailsPage();
      break;
    case 'my-bookings.html':
      initMyBookingsPage();
      break;
    case 'profile.html':
      initProfilePage();
      break;
    case 'admin-dashboard.html':
      initAdminDashboardPage();
      break;
    case 'add-event.html':
      initEventEditorPage();
      break;
    case 'manage-events.html':
      initManageEventsPage();
      break;
    case 'manage-venues.html':
      initManageVenuesPage();
      break;
    case 'manage-departments.html':
      initManageDepartmentsPage();
      break;
    case 'manage-users.html':
      initManageUsersPage();
      break;
    case 'bookings.html':
      initAdminBookingsPage();
      break;
  }
}

// ==========================================
// 6. User Login/Register Module Scripts
// ==========================================
function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!name || !email || !password) {
      showToast('Please fill in all registration fields.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Registration completed!', 'success');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1200);
      } else {
        showToast(data.error || 'Registration failed.', 'error');
      }
    } catch (err) {
      showToast('Network error during registration.', 'error');
    }
  });
}

function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showToast('Please fill in login credentials.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Access granted! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'events.html';
        }, 800);
      } else {
        showToast(data.error || 'Invalid credentials.', 'error');
      }
    } catch (err) {
      showToast('Network login error.', 'error');
    }
  });
}

function initAdminLoginForm() {
  const form = document.getElementById('admin-login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value;

    if (!username || !password) {
      showToast('Please provide admin password.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Admin access granted! Initializing console...', 'success');
        setTimeout(() => {
          window.location.href = 'admin-dashboard.html';
        }, 800);
      } else {
        showToast(data.error || 'Invalid admin credentials.', 'error');
      }
    } catch (err) {
      showToast('Admin connection failure.', 'error');
    }
  });
}

// ==========================================
// 7. Student Browse Events List Module
// ==========================================
async function initEventsPage() {
  const searchInput = document.getElementById('event-search');
  const deptFilter = document.getElementById('event-dept-filter');
  const venueFilter = document.getElementById('event-venue-filter');

  // Load select options
  await loadFilterOptions(deptFilter, venueFilter);

  // Render lists initially
  loadEvents();

  // Search & Filter event triggers
  if (searchInput) searchInput.addEventListener('input', debounce(loadEvents, 300));
  if (deptFilter) deptFilter.addEventListener('change', loadEvents);
  if (venueFilter) venueFilter.addEventListener('change', loadEvents);
}

async function loadFilterOptions(deptSelect, venueSelect) {
  try {
    const [deptsRes, venuesRes] = await Promise.all([
      fetch(`${API_URL}/departments`),
      fetch(`${API_URL}/venues`)
    ]);

    if (deptsRes.ok) {
      const depts = await deptsRes.json();
      depts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.dept_id;
        opt.innerText = d.dept_name;
        if (deptSelect) deptSelect.appendChild(opt);
      });
    }

    if (venuesRes.ok) {
      const venues = await venuesRes.json();
      venues.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.venue_id;
        opt.innerText = `${v.venue_name} (Max: ${v.capacity})`;
        if (venueSelect) venueSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Filters payload loading error:', err);
  }
}

async function loadEvents() {
  const container = document.getElementById('events-list-container');
  if (!container) return;

  const search = document.getElementById('event-search')?.value.trim() || '';
  const dept_id = document.getElementById('event-dept-filter')?.value || '';
  const venue_id = document.getElementById('event-venue-filter')?.value || '';

  let query = `?search=${encodeURIComponent(search)}`;
  if (dept_id) query += `&dept_id=${dept_id}`;
  if (venue_id) query += `&venue_id=${venue_id}`;

  try {
    const res = await fetch(`${API_URL}/events${query}`);
    if (!res.ok) throw new Error();
    const events = await res.json();

    if (events.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 50px;">
          <i class="fa-solid fa-calendar-xmark" style="font-size:3rem; color:var(--text-muted); margin-bottom:15px;"></i>
          <h3>No events match your criteria</h3>
          <p style="color:var(--text-secondary);">Try clearing filters or search parameters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    events.forEach(ev => {
      const bookedPct = Math.round(((ev.total_seats - ev.available_seats) / ev.total_seats) * 100);
      let barClass = 'full';
      if (bookedPct >= 90) barClass = 'low'; // very few seats left
      else if (bookedPct >= 60) barClass = 'medium';

      const dateObj = new Date(ev.event_date);
      const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

      // Clean event time (10:00:00 -> 10:00)
      const cleanTime = ev.event_time.substring(0, 5);

      const card = document.createElement('a');
      card.href = `event-details.html?id=${ev.event_id}`;
      card.className = 'glass event-card';
      card.innerHTML = `
        <div class="event-card-header">
          <span class="event-card-dept">${ev.dept_name}</span>
        </div>
        <div class="event-card-body">
          <h3 class="event-title">${ev.event_name}</h3>
          <ul class="event-meta-list">
            <li class="event-meta-item"><i class="fa-regular fa-calendar"></i> ${formattedDate}</li>
            <li class="event-meta-item"><i class="fa-regular fa-clock"></i> ${cleanTime}</li>
            <li class="event-meta-item"><i class="fa-solid fa-location-dot"></i> ${ev.venue_name}</li>
          </ul>
          <div class="seat-status-container">
            <div class="seat-text">
              <span>${ev.available_seats} / ${ev.total_seats} seats left</span>
              <span>${100 - bookedPct}%</span>
            </div>
            <div class="seat-bar-outer">
              <div class="seat-bar-inner ${barClass}" style="width: ${100 - bookedPct}%;"></div>
            </div>
          </div>
          <span class="btn btn-secondary" style="width:100%; font-size:0.85rem; padding:8px 0;">View Details</span>
        </div>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: var(--danger);">
        <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; margin-bottom:15px;"></i>
        <h3>Failed to load campus events</h3>
        <p>There was a connection issue. Please refresh.</p>
      </div>
    `;
  }
}

// ==========================================
// 8. Event Details & Seat Booking Module
// ==========================================
async function initEventDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  if (!eventId) {
    window.location.replace('events.html');
    return;
  }

  const bookingWidget = document.getElementById('booking-widget');
  const bookingAuthPrompt = document.getElementById('booking-auth-prompt');
  const bookingForm = document.getElementById('booking-form');

  // Check login states to render booking boxes
  try {
    const res = await fetch(`${API_URL}/auth/status`);
    const status = await res.json();
    if (status.loggedIn && status.role === 'user') {
      if (bookingWidget) bookingWidget.style.display = 'block';
      if (bookingAuthPrompt) bookingAuthPrompt.style.display = 'none';
    } else {
      if (bookingWidget) bookingWidget.style.display = 'none';
      if (bookingAuthPrompt) bookingAuthPrompt.style.display = 'block';
    }
  } catch (e) {}

  // Populate data
  try {
    const evRes = await fetch(`${API_URL}/events/${eventId}`);
    if (!evRes.ok) {
      showToast('Event details not found.', 'error');
      setTimeout(() => { window.location.href = 'events.html'; }, 1000);
      return;
    }
    const ev = await evRes.json();

    document.title = `${ev.event_name} | CampusConnect`;
    document.getElementById('detail-dept').innerText = ev.dept_name;
    document.getElementById('detail-title').innerText = ev.event_name;
    document.getElementById('detail-venue').innerText = ev.venue_name;
    document.getElementById('detail-location').innerText = ev.location;

    const dateObj = new Date(ev.event_date);
    document.getElementById('detail-date').innerText = dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('detail-time').innerText = ev.event_time.substring(0, 5);

    document.getElementById('detail-available').innerText = `${ev.available_seats} seats available`;
    document.getElementById('detail-total').innerText = `of ${ev.total_seats} total`;

    const remainingPct = Math.round((ev.available_seats / ev.total_seats) * 100);
    const detailBar = document.getElementById('detail-bar');
    if (detailBar) {
      detailBar.style.width = `${remainingPct}%`;
      if (remainingPct <= 10) detailBar.classList.add('low');
      else if (remainingPct <= 40) detailBar.classList.add('medium');
      else detailBar.classList.add('full');
    }

    // Set max limit of booking seats input to available seats, capped at 10
    const seatsInput = document.getElementById('booking-seats');
    if (seatsInput) {
      seatsInput.max = Math.min(10, ev.available_seats);
      if (ev.available_seats <= 0) {
        if (bookingWidget) {
          bookingWidget.innerHTML = `
            <div style="text-align:center; padding:10px;">
              <i class="fa-solid fa-circle-xmark" style="font-size:2rem; color:var(--danger); margin-bottom:10px;"></i>
              <h4 style="color:var(--danger);">House Full</h4>
              <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:5px;">This event is fully booked. No seats remaining.</p>
            </div>
          `;
        }
      }
    }

  } catch (err) {
    showToast('Failed to retrieve event metadata.', 'error');
  }

  // Handle booking form submit
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const seatsInput = document.getElementById('booking-seats');
      const seatsBooked = parseInt(seatsInput.value);

      if (isNaN(seatsBooked) || seatsBooked <= 0) {
        showToast('Please specify a positive number of seats.', 'error');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id: eventId, seats_booked: seatsBooked })
        });
        const data = await res.json();

        if (res.ok) {
          showToast(data.message || 'Seat reserved successfully!', 'success');
          setTimeout(() => {
            window.location.href = 'my-bookings.html';
          }, 1000);
        } else {
          showToast(data.error || 'Booking failed.', 'error');
        }
      } catch (err) {
        showToast('Failed to connect to booking system API.', 'error');
      }
    });
  }
}

// ==========================================
// 9. Student Own Bookings Manager
// ==========================================
async function initMyBookingsPage() {
  const tableWrapper = document.getElementById('bookings-table-wrapper');
  const loading = document.getElementById('bookings-loading');
  const empty = document.getElementById('bookings-empty');
  const tbody = document.getElementById('bookings-list-tbody');

  if (!tbody) return;

  try {
    const res = await fetch(`${API_URL}/bookings/my`);
    if (!res.ok) throw new Error();
    const bookings = await res.json();

    loading.style.display = 'none';

    if (bookings.length === 0) {
      tableWrapper.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    tableWrapper.style.display = 'block';
    tbody.innerHTML = '';

    bookings.forEach(b => {
      const bDate = new Date(b.booking_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      const evDate = new Date(b.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      const evTime = b.event_time.substring(0, 5);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>#B${b.booking_id}</strong></td>
        <td><a href="event-details.html?id=${b.event_id}" style="font-weight:600; color:var(--accent);">${b.event_name}</a></td>
        <td><span class="badge badge-accent">${b.dept_name}</span></td>
        <td>${b.venue_name}</td>
        <td>${evDate}</td>
        <td>${evTime}</td>
        <td><strong>${b.seats_booked}</strong></td>
        <td>${bDate}</td>
        <td>
          <button class="btn btn-danger cancel-booking-btn" data-id="${b.booking_id}" style="padding: 6px 12px; font-size:0.75rem; border-radius:6px;">
            Cancel <i class="fa-solid fa-xmark"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach cancellation handlers
    document.querySelectorAll('.cancel-booking-btn').forEach(btn => {
      btn.addEventListener('click', handleCancelBooking);
    });

  } catch (err) {
    loading.style.display = 'none';
    showToast('Failed to load tickets ledger.', 'error');
  }
}

async function handleCancelBooking(e) {
  const btn = e.target.closest('.cancel-booking-btn');
  if (!btn) return;
  const bookingId = btn.getAttribute('data-id');

  if (!confirm('Are you sure you want to cancel this booking? This will restore seats to the event.')) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/bookings/${bookingId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      showToast('Booking cancelled successfully.', 'success');
      // Refresh page list
      initMyBookingsPage();
    } else {
      showToast(data.error || 'Failed to cancel reservation.', 'error');
    }
  } catch (err) {
    showToast('Network error during cancellation.', 'error');
  }
}

// ==========================================
// 10. Student Settings Profile Module
// ==========================================
async function initProfilePage() {
  const form = document.getElementById('profile-update-form');
  if (!form) return;

  const inputName = document.getElementById('profile-name');
  const inputEmail = document.getElementById('profile-email');
  const inputPassword = document.getElementById('profile-new-password');

  // Load user data and stats
  try {
    const [profileRes, bookingsRes] = await Promise.all([
      fetch(`${API_URL}/users/profile`),
      fetch(`${API_URL}/bookings/my`)
    ]);

    if (profileRes.ok) {
      const u = await profileRes.json();
      inputName.value = u.name;
      inputEmail.value = u.email;
      document.getElementById('profile-card-name').innerText = u.name;
      document.getElementById('profile-card-email').innerText = u.email;
    }

    if (bookingsRes.ok) {
      const bookings = await bookingsRes.json();
      document.getElementById('profile-stat-bookings').innerText = bookings.length;
      const totalSeats = bookings.reduce((sum, b) => sum + b.seats_booked, 0);
      document.getElementById('profile-stat-seats').innerText = totalSeats;
    }
  } catch (err) {
    showToast('Failed to load profile settings.', 'error');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = inputName.value.trim();
    const email = inputEmail.value.trim();
    const new_password = inputPassword.value;

    if (!name || !email) {
      showToast('Name and email are required.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, new_password })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Profile updated successfully!', 'success');
        document.getElementById('profile-card-name').innerText = name;
        document.getElementById('profile-card-email').innerText = email;
        document.getElementById('nav-username').innerText = name;
        inputPassword.value = '';
      } else {
        showToast(data.error || 'Failed to update settings.', 'error');
      }
    } catch (err) {
      showToast('Network error updating profile.', 'error');
    }
  });
}

// ==========================================
// 11. Admin Panel: Dashboard Module
// ==========================================
async function initAdminDashboardPage() {
  try {
    const res = await fetch(`${API_URL}/events/stats`);
    if (!res.ok) throw new Error();
    const stats = await res.json();

    // Set numbers
    document.getElementById('stat-events').innerText = stats.totalEvents;
    document.getElementById('stat-bookings').innerText = stats.totalBookings;
    document.getElementById('stat-seats').innerText = stats.totalSeatsBooked;
    document.getElementById('stat-users').innerText = stats.totalUsers;

    // Popular events
    const popularTbody = document.getElementById('stats-popular-tbody');
    if (popularTbody) {
      popularTbody.innerHTML = '';
      if (stats.popularEvents.length === 0) {
        popularTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No data available</td></tr>';
      } else {
        stats.popularEvents.forEach(e => {
          popularTbody.innerHTML += `
            <tr>
              <td><strong>${e.event_name}</strong></td>
              <td>${e.booking_count} bookings</td>
              <td><span class="badge badge-accent">${e.seats_booked} seats</span></td>
            </tr>
          `;
        });
      }
    }

    // Departments stats
    const deptTbody = document.getElementById('stats-dept-tbody');
    if (deptTbody) {
      deptTbody.innerHTML = '';
      if (stats.deptStats.length === 0) {
        deptTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No data available</td></tr>';
      } else {
        stats.deptStats.forEach(d => {
          deptTbody.innerHTML += `
            <tr>
              <td><strong>${d.dept_name}</strong></td>
              <td>${d.booking_count} bookings</td>
              <td><span class="badge badge-success">${d.seats_booked} seats</span></td>
            </tr>
          `;
        });
      }
    }

  } catch (err) {
    showToast('Failed to load system metrics dashboard.', 'error');
  }
}

// ==========================================
// 12. Admin Panel: Event Editor Module (Add/Edit)
// ==========================================
async function initEventEditorPage() {
  const form = document.getElementById('event-editor-form');
  const deptSelect = document.getElementById('edit-event-dept');
  const venueSelect = document.getElementById('edit-event-venue');
  const capacityHint = document.getElementById('venue-capacity-hint');

  if (!form) return;

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');

  // Load depts and venues options
  await loadFilterOptions(deptSelect, venueSelect);

  // Monitor venue capacity to advise the admin
  let venuesCapacityMap = {};
  if (venueSelect) {
    // We fetch venues to build key-value map of capacities
    try {
      const res = await fetch(`${API_URL}/venues`);
      if (res.ok) {
        const venues = await res.json();
        venues.forEach(v => { venuesCapacityMap[v.venue_id] = v.capacity; });
      }
    } catch (e) {}

    venueSelect.addEventListener('change', () => {
      const selected = venueSelect.value;
      if (selected && venuesCapacityMap[selected]) {
        capacityHint.innerHTML = `Note: Selected venue has a maximum capacity of <strong>${venuesCapacityMap[selected]} seats</strong>. You cannot set event seats higher.`;
        capacityHint.style.color = 'var(--text-secondary)';
      } else {
        capacityHint.innerText = 'Note: Event capacity cannot exceed the chosen venue\'s maximum capacity.';
        capacityHint.style.color = 'var(--text-muted)';
      }
    });
  }

  // If in Edit mode
  if (editId) {
    document.getElementById('event-form-title').innerText = 'Edit Event Details';
    document.getElementById('event-form-submit-btn').innerHTML = 'Save Event Changes <i class="fa-solid fa-save"></i>';
    document.title = 'Edit Event | CampusConnect';

    try {
      const res = await fetch(`${API_URL}/events/${editId}`);
      if (!res.ok) throw new Error();
      const ev = await res.json();

      document.getElementById('edit-event-name').value = ev.event_name;
      
      // Clean HTML date (2026-06-10T00:00:00.000Z -> 2026-06-10)
      const dateVal = ev.event_date.split('T')[0];
      document.getElementById('edit-event-date').value = dateVal;
      document.getElementById('edit-event-time').value = ev.event_time;
      document.getElementById('edit-event-dept').value = ev.dept_id;
      document.getElementById('edit-event-venue').value = ev.venue_id;
      document.getElementById('edit-event-seats').value = ev.total_seats;

      if (venueSelect && venuesCapacityMap[ev.venue_id]) {
        capacityHint.innerHTML = `Note: Selected venue has a maximum capacity of <strong>${venuesCapacityMap[ev.venue_id]} seats</strong>. You cannot set event seats higher.`;
      }
    } catch (err) {
      showToast('Failed to load event data for editing.', 'error');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const event_name = document.getElementById('edit-event-name').value.trim();
    const event_date = document.getElementById('edit-event-date').value;
    const event_time = document.getElementById('edit-event-time').value;
    const dept_id = parseInt(document.getElementById('edit-event-dept').value);
    const venue_id = parseInt(document.getElementById('edit-event-venue').value);
    const total_seats = parseInt(document.getElementById('edit-event-seats').value);

    if (!event_name || !event_date || !event_time || !dept_id || !venue_id || isNaN(total_seats)) {
      showToast('Please fill in all event details.', 'error');
      return;
    }

    const method = editId ? 'PUT' : 'POST';
    const endpoint = editId ? `${API_URL}/events/${editId}` : `${API_URL}/events`;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_name, event_date, event_time, dept_id, venue_id, total_seats })
      });
      const data = await res.json();

      if (res.ok) {
        showToast(editId ? 'Event updated successfully!' : 'Event created successfully!', 'success');
        setTimeout(() => {
          window.location.href = 'manage-events.html';
        }, 1000);
      } else {
        showToast(data.error || 'Failed to save event.', 'error');
      }
    } catch (err) {
      showToast('Network error saving event.', 'error');
    }
  });
}

// ==========================================
// 13. Admin Panel: Event List Manager Module
// ==========================================
async function initManageEventsPage() {
  const tableWrapper = document.getElementById('events-table-wrapper');
  const loading = document.getElementById('events-loading');
  const empty = document.getElementById('events-empty');
  const tbody = document.getElementById('events-manager-tbody');

  if (!tbody) return;

  try {
    const res = await fetch(`${API_URL}/events`);
    if (!res.ok) throw new Error();
    const events = await res.json();

    loading.style.display = 'none';

    if (events.length === 0) {
      tableWrapper.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    tableWrapper.style.display = 'block';
    tbody.innerHTML = '';

    events.forEach(e => {
      const cleanDate = new Date(e.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      const cleanTime = e.event_time.substring(0, 5);

      tbody.innerHTML += `
        <tr>
          <td><strong>#E${e.event_id}</strong></td>
          <td><strong>${e.event_name}</strong></td>
          <td><span class="badge badge-accent">${e.dept_name}</span></td>
          <td>${e.venue_name}</td>
          <td>${cleanDate}</td>
          <td>${cleanTime}</td>
          <td>${e.total_seats}</td>
          <td><strong style="color:var(--success);">${e.available_seats}</strong></td>
          <td>
            <div style="display:flex; gap:8px;">
              <a href="add-event.html?id=${e.event_id}" class="btn-icon" title="Edit Event"><i class="fa-solid fa-pen"></i></a>
              <button class="btn-icon btn-icon-danger delete-event-btn" data-id="${e.event_id}" title="Delete Event"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    });

    document.querySelectorAll('.delete-event-btn').forEach(btn => {
      btn.addEventListener('click', handleDeleteEvent);
    });

  } catch (err) {
    loading.style.display = 'none';
    showToast('Failed to retrieve events registry.', 'error');
  }
}

async function handleDeleteEvent(e) {
  const btn = e.target.closest('.delete-event-btn');
  if (!btn) return;
  const eventId = btn.getAttribute('data-id');

  if (!confirm('Are you sure you want to delete this event? This will delete all associated student bookings!')) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/events/${eventId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      showToast('Event and bookings removed.', 'success');
      initManageEventsPage();
    } else {
      showToast(data.error || 'Failed to delete event.', 'error');
    }
  } catch (err) {
    showToast('Error connecting to Server API.', 'error');
  }
}

// ==========================================
// 14. Admin Panel: Venue CRUD Module
// ==========================================
async function initManageVenuesPage() {
  const form = document.getElementById('venue-manager-form');
  const tbody = document.getElementById('venues-table-tbody');

  if (!tbody || !form) return;

  // Load venues table
  await loadVenuesList(tbody);

  // Submit Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('venue-id-hidden').value;
    const venue_name = document.getElementById('venue-name').value.trim();
    const location = document.getElementById('venue-location').value.trim();
    const capacity = parseInt(document.getElementById('venue-capacity').value);

    if (!venue_name || !location || isNaN(capacity)) {
      showToast('Please specify all venue values.', 'error');
      return;
    }

    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `${API_URL}/venues/${id}` : `${API_URL}/venues`;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venue_name, location, capacity })
      });
      const data = await res.json();

      if (res.ok) {
        showToast(id ? 'Venue details saved.' : 'Venue added successfully.', 'success');
        resetVenueForm();
        loadVenuesList(tbody);
      } else {
        showToast(data.error || 'Failed to save venue.', 'error');
      }
    } catch (err) {
      showToast('Network error during venue operations.', 'error');
    }
  });

  document.getElementById('venue-cancel-btn').addEventListener('click', resetVenueForm);
}

async function loadVenuesList(tbody) {
  try {
    const res = await fetch(`${API_URL}/venues`);
    const venues = await res.json();
    tbody.innerHTML = '';

    if (venues.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No venues recorded.</td></tr>';
      return;
    }

    venues.forEach(v => {
      tbody.innerHTML += `
        <tr>
          <td><strong>#V${v.venue_id}</strong></td>
          <td><strong>${v.venue_name}</strong></td>
          <td>${v.location}</td>
          <td><span class="badge badge-accent">${v.capacity} seats</span></td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="btn-icon edit-venue-btn" data-id="${v.venue_id}" data-name="${v.venue_name}" data-loc="${v.location}" data-cap="${v.capacity}"><i class="fa-solid fa-pen"></i></button>
              <button class="btn-icon btn-icon-danger delete-venue-btn" data-id="${v.venue_id}"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    });

    // Attach event listeners
    document.querySelectorAll('.edit-venue-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const b = e.target.closest('.edit-venue-btn');
        document.getElementById('venue-id-hidden').value = b.getAttribute('data-id');
        document.getElementById('venue-name').value = b.getAttribute('data-name');
        document.getElementById('venue-location').value = b.getAttribute('data-loc');
        document.getElementById('venue-capacity').value = b.getAttribute('data-cap');

        document.getElementById('venue-form-title').innerText = 'Edit Venue Details';
        document.getElementById('venue-submit-btn').innerHTML = 'Update Venue <i class="fa-solid fa-save"></i>';
        document.getElementById('venue-cancel-btn').style.display = 'block';
      });
    });

    document.querySelectorAll('.delete-venue-btn').forEach(btn => {
      btn.addEventListener('click', handleDeleteVenue);
    });

  } catch (e) {
    showToast('Failed to load venues.', 'error');
  }
}

function resetVenueForm() {
  document.getElementById('venue-manager-form').reset();
  document.getElementById('venue-id-hidden').value = '';
  document.getElementById('venue-form-title').innerText = 'Add New Venue';
  document.getElementById('venue-submit-btn').innerHTML = 'Save Venue <i class="fa-solid fa-save"></i>';
  document.getElementById('venue-cancel-btn').style.display = 'none';
}

async function handleDeleteVenue(e) {
  const btn = e.target.closest('.delete-venue-btn');
  const id = btn.getAttribute('data-id');

  if (!confirm('Are you sure you want to delete this venue? This will delete all associated events!')) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/venues/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      showToast('Venue removed from database.', 'success');
      loadVenuesList(document.getElementById('venues-table-tbody'));
      resetVenueForm();
    } else {
      showToast(data.error || 'Failed to delete venue.', 'error');
    }
  } catch (err) {
    showToast('Network request failure.', 'error');
  }
}

// ==========================================
// 15. Admin Panel: Department CRUD Module
// ==========================================
async function initManageDepartmentsPage() {
  const form = document.getElementById('dept-manager-form');
  const tbody = document.getElementById('departments-table-tbody');

  if (!tbody || !form) return;

  await loadDeptsList(tbody);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('dept-id-hidden').value;
    const dept_name = document.getElementById('dept-name').value.trim();

    if (!dept_name) {
      showToast('Please enter a department name.', 'error');
      return;
    }

    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `${API_URL}/departments/${id}` : `${API_URL}/departments`;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dept_name })
      });
      const data = await res.json();

      if (res.ok) {
        showToast(id ? 'Department updated.' : 'Department created.', 'success');
        resetDeptForm();
        loadDeptsList(tbody);
      } else {
        showToast(data.error || 'Failed to save department.', 'error');
      }
    } catch (err) {
      showToast('API save error.', 'error');
    }
  });

  document.getElementById('dept-cancel-btn').addEventListener('click', resetDeptForm);
}

async function loadDeptsList(tbody) {
  try {
    const res = await fetch(`${API_URL}/departments`);
    const depts = await res.json();
    tbody.innerHTML = '';

    if (depts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No departments found.</td></tr>';
      return;
    }

    depts.forEach(d => {
      tbody.innerHTML += `
        <tr>
          <td><strong>#D${d.dept_id}</strong></td>
          <td><strong>${d.dept_name}</strong></td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="btn-icon edit-dept-btn" data-id="${d.dept_id}" data-name="${d.dept_name}"><i class="fa-solid fa-pen"></i></button>
              <button class="btn-icon btn-icon-danger delete-dept-btn" data-id="${d.dept_id}"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    });

    document.querySelectorAll('.edit-dept-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const b = e.target.closest('.edit-dept-btn');
        document.getElementById('dept-id-hidden').value = b.getAttribute('data-id');
        document.getElementById('dept-name').value = b.getAttribute('data-name');

        document.getElementById('dept-form-title').innerText = 'Edit Department';
        document.getElementById('dept-submit-btn').innerHTML = 'Update Department <i class="fa-solid fa-save"></i>';
        document.getElementById('dept-cancel-btn').style.display = 'block';
      });
    });

    document.querySelectorAll('.delete-dept-btn').forEach(btn => {
      btn.addEventListener('click', handleDeleteDept);
    });

  } catch (e) {
    showToast('Failed to fetch departments.', 'error');
  }
}

function resetDeptForm() {
  document.getElementById('dept-manager-form').reset();
  document.getElementById('dept-id-hidden').value = '';
  document.getElementById('dept-form-title').innerText = 'Add New Department';
  document.getElementById('dept-submit-btn').innerHTML = 'Save Department <i class="fa-solid fa-save"></i>';
  document.getElementById('dept-cancel-btn').style.display = 'none';
}

async function handleDeleteDept(e) {
  const btn = e.target.closest('.delete-dept-btn');
  const id = btn.getAttribute('data-id');

  if (!confirm('Are you sure you want to delete this department? This will delete all its organizing events!')) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/departments/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      showToast('Department deleted.', 'success');
      loadDeptsList(document.getElementById('departments-table-tbody'));
      resetDeptForm();
    } else {
      showToast(data.error || 'Failed to delete department.', 'error');
    }
  } catch (err) {
    showToast('API delete error.', 'error');
  }
}

// ==========================================
// 16. Admin Panel: Registered Users List Module
// ==========================================
async function initManageUsersPage() {
  const tableWrapper = document.getElementById('users-table-wrapper');
  const loading = document.getElementById('users-loading');
  const empty = document.getElementById('users-empty');
  const tbody = document.getElementById('users-table-tbody');

  if (!tbody) return;

  try {
    const res = await fetch(`${API_URL}/users`);
    if (!res.ok) throw new Error();
    const users = await res.json();

    loading.style.display = 'none';

    if (users.length === 0) {
      tableWrapper.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    tableWrapper.style.display = 'block';
    tbody.innerHTML = '';

    users.forEach(u => {
      tbody.innerHTML += `
        <tr>
          <td><strong>#USR${u.user_id}</strong></td>
          <td><strong>${u.name}</strong></td>
          <td>${u.email}</td>
        </tr>
      `;
    });

  } catch (err) {
    loading.style.display = 'none';
    showToast('Failed to retrieve student roster.', 'error');
  }
}

// ==========================================
// 17. Admin Panel: All Bookings Auditor Module
// ==========================================
async function initAdminBookingsPage() {
  const tableWrapper = document.getElementById('admin-bookings-table-wrapper');
  const loading = document.getElementById('admin-bookings-loading');
  const empty = document.getElementById('admin-bookings-empty');
  const tbody = document.getElementById('admin-bookings-tbody');

  if (!tbody) return;

  try {
    const res = await fetch(`${API_URL}/bookings`);
    if (!res.ok) throw new Error();
    const bookings = await res.json();

    loading.style.display = 'none';

    if (bookings.length === 0) {
      tableWrapper.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    tableWrapper.style.display = 'block';
    tbody.innerHTML = '';

    bookings.forEach(b => {
      const bDate = new Date(b.booking_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      const evDate = new Date(b.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      const evTime = b.event_time.substring(0, 5);

      tbody.innerHTML += `
        <tr>
          <td><strong>#B${b.booking_id}</strong></td>
          <td><strong>${b.user_name}</strong></td>
          <td><span style="font-size:0.75rem; color:var(--text-secondary);">${b.user_email}</span></td>
          <td><strong>${b.event_name}</strong></td>
          <td><span class="badge badge-accent">${b.dept_name}</span></td>
          <td>${b.venue_name}</td>
          <td>${evDate}</td>
          <td>${evTime}</td>
          <td><strong style="color:var(--accent);">${b.seats_booked}</strong></td>
          <td>${bDate}</td>
          <td>
            <button class="btn btn-danger admin-cancel-btn" data-id="${b.booking_id}" style="padding: 5px 10px; font-size:0.7rem; border-radius:4px;">
              Cancel <i class="fa-solid fa-xmark"></i>
            </button>
          </td>
        </tr>
      `;
    });

    document.querySelectorAll('.admin-cancel-btn').forEach(btn => {
      btn.addEventListener('click', handleAdminCancelBooking);
    });

  } catch (err) {
    loading.style.display = 'none';
    showToast('Failed to audit tickets ledger.', 'error');
  }
}

async function handleAdminCancelBooking(e) {
  const btn = e.target.closest('.admin-cancel-btn');
  const bookingId = btn.getAttribute('data-id');

  if (!confirm('Are you sure you want to cancel this student booking? Seats will be restored to the event.')) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/bookings/${bookingId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      showToast('Reservation successfully revoked.', 'success');
      initAdminBookingsPage();
    } else {
      showToast(data.error || 'Failed to revoke reservation.', 'error');
    }
  } catch (err) {
    showToast('Error calling API endpoint.', 'error');
  }
}

// ==========================================
// Utilities: Debounce helper for inputs
// ==========================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
