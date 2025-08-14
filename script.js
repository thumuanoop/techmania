// Application State
const AppState = {
    currentEventType: 'combo',
    currentTeamSize: 2,
    currentPrice: 479,
    isAdminLoggedIn: false,
    registrations: []
};

// Pricing Configuration
const PRICING = {
    hackathon: { 1: 159, 2: 299, 3: 399, 4: 499 },
    coding: { 1: 139, 2: 139, 3: 139, 4: 139 },
    combo: { 1: 249, 2: 479, 3: 649, 4: 879 }
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    loadRegistrations();
    updatePrice();
    updateTeamMembersForm();
});

// Utility Functions
function showToast(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-description">${message}</div>
    `;
    
    const container = document.getElementById('toastContainer');
    container.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => container.removeChild(toast), 300);
    }, 5000);
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN');
}

// Registration Functions
function showRegistrationModal() {
    document.getElementById('registrationModal').classList.remove('hidden');
    updatePrice();
    updateTeamMembersForm();
}

function closeRegistrationModal(event) {
    if (!event || event.target === event.currentTarget) {
        document.getElementById('registrationModal').classList.add('hidden');
        document.getElementById('registrationForm').reset();
        // Reset to defaults
        AppState.currentEventType = 'combo';
        AppState.currentTeamSize = 2;
        selectEventType('combo');
        selectTeamSize(2);
    }
}

function selectEventType(eventType) {
    AppState.currentEventType = eventType;
    
    // Update UI
    const options = document.querySelectorAll('.pricing-option');
    options.forEach(opt => opt.classList.remove('selected'));
    
    const radioInput = document.querySelector(`input[value="${eventType}"]`);
    if (radioInput) {
        radioInput.checked = true;
        radioInput.closest('.pricing-option').classList.add('selected');
    }
    
    updatePrice();
}

function selectTeamSize(size) {
    AppState.currentTeamSize = size;
    
    // Update UI
    const buttons = document.querySelectorAll('.team-size-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    buttons[size - 1].classList.add('selected');
    
    updatePrice();
    updateTeamMembersForm();
}

function updatePrice() {
    AppState.currentPrice = PRICING[AppState.currentEventType][AppState.currentTeamSize];
    const priceElement = document.getElementById('currentPrice');
    if (priceElement) {
        priceElement.textContent = `₹${AppState.currentPrice}`;
    }
}

function updateTeamMembersForm() {
    const container = document.getElementById('teamMembersContainer');
    container.innerHTML = '';
    
    for (let i = 1; i <= AppState.currentTeamSize; i++) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        formGroup.innerHTML = `
            <label class="form-label" for="member${i}">${i === 1 ? 'Team Lead (Member 1)' : `Member ${i}`} *</label>
            <input type="text" id="member${i}" name="member${i}" class="form-control" 
                   placeholder="Full name of ${i === 1 ? 'team lead' : `member ${i}`}" required>
        `;
        
        container.appendChild(formGroup);
    }
}

function handleRegistrationSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Collect team members
    const teamMembers = [];
    for (let i = 1; i <= AppState.currentTeamSize; i++) {
        const memberName = formData.get(`member${i}`);
        if (memberName && memberName.trim()) {
            teamMembers.push(memberName.trim());
        }
    }
    
    // Validate form
    if (teamMembers.length !== AppState.currentTeamSize) {
        showToast('Validation Error', `Please provide names for all ${AppState.currentTeamSize} team members.`, 'error');
        return;
    }
    
    const mobile = formData.get('mobileNumber');
    if (!/^\d{10}$/.test(mobile)) {
        showToast('Validation Error', 'Mobile number must be exactly 10 digits.', 'error');
        return;
    }
    
    const transactionId = formData.get('transactionId');
    if (!transactionId || transactionId.trim().length < 5) {
        showToast('Validation Error', 'Please enter a valid transaction ID.', 'error');
        return;
    }
    
    // Create registration object
    const registration = {
        id: Date.now().toString(),
        teamName: formData.get('teamName').trim(),
        eventType: AppState.currentEventType,
        teamSize: AppState.currentTeamSize,
        teamLead: teamMembers[0],
        teamMembers: teamMembers,
        mobile: mobile,
        transactionId: transactionId.trim(),
        registrationFee: AppState.currentPrice,
        createdAt: new Date().toISOString()
    };
    
    // Show loading
    const submitBtn = document.getElementById('submitRegistration');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Save registration
        AppState.registrations.push(registration);
        saveRegistrations();
        
        showToast('Registration Successful!', 'Your registration has been confirmed. You will receive a confirmation email shortly.');
        closeRegistrationModal();
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        // Update admin stats if admin is logged in
        if (AppState.isAdminLoggedIn && !document.getElementById('adminDashboard').classList.contains('hidden')) {
            updateAdminStats();
            updateRegistrationsTable();
        }
    }, 2000);
}

// Admin Functions
function showAdminLogin() {
    document.getElementById('adminLoginModal').classList.remove('hidden');
}

function closeAdminLoginModal(event) {
    if (!event || event.target === event.currentTarget) {
        document.getElementById('adminLoginModal').classList.add('hidden');
        document.getElementById('adminLoginForm').reset();
    }
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('adminPassword');
    const toggleIcon = document.getElementById('passwordToggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.setAttribute('data-lucide', 'eye-off');
    } else {
        passwordInput.type = 'password';
        toggleIcon.setAttribute('data-lucide', 'eye');
    }
    
    lucide.createIcons();
}

function handleAdminLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const username = formData.get('username');
    const password = formData.get('password');
    
    const loginBtn = document.getElementById('adminLoginButton');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled = true;
    
    setTimeout(() => {
        if (username === 'admin' && password === 'admin123') {
            AppState.isAdminLoggedIn = true;
            showToast('Login Successful', 'Welcome to the admin dashboard!');
            closeAdminLoginModal();
            showAdminDashboard();
        } else {
            showToast('Login Failed', 'Invalid username or password.', 'error');
        }
        
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }, 1500);
}

function showAdminDashboard() {
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
    updateAdminStats();
    updateRegistrationsTable();
}

function adminLogout() {
    const logoutBtn = document.querySelector('#adminDashboard .btn-danger');
    logoutBtn.textContent = 'Logging out...';
    logoutBtn.disabled = true;
    
    setTimeout(() => {
        AppState.isAdminLoggedIn = false;
        document.getElementById('mainContent').classList.remove('hidden');
        document.getElementById('adminDashboard').classList.add('hidden');
        showToast('Logged Out', 'You have been successfully logged out.');
        logoutBtn.textContent = 'Logout';
        logoutBtn.disabled = false;
    }, 1000);
}

function updateAdminStats() {
    const total = AppState.registrations.length;
    const hackathon = AppState.registrations.filter(r => r.eventType === 'hackathon').length;
    const coding = AppState.registrations.filter(r => r.eventType === 'coding').length;
    const combo = AppState.registrations.filter(r => r.eventType === 'combo').length;
    
    document.getElementById('totalRegistrations').textContent = total;
    document.getElementById('hackathonCount').textContent = hackathon;
    document.getElementById('codingCount').textContent = coding;
    document.getElementById('comboCount').textContent = combo;
}

function getEventBadge(eventType) {
    const badges = {
        hackathon: '<span class="badge badge-blue">Hackathon</span>',
        coding: '<span class="badge badge-green">Coding</span>',
        combo: '<span class="badge badge-purple">Combo</span>'
    };
    return badges[eventType] || `<span class="badge">${eventType}</span>`;
}

function updateRegistrationsTable() {
    const tbody = document.getElementById('registrationsTableBody');
    const filter = document.getElementById('eventTypeFilter').value;
    
    let filteredRegistrations = AppState.registrations;
    if (filter) {
        filteredRegistrations = AppState.registrations.filter(r => r.eventType === filter);
    }
    
    if (filteredRegistrations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-8 text-gray-500">
                    No registrations found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredRegistrations
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(reg => `
            <tr>
                <td class="font-medium">${reg.teamName}</td>
                <td>${getEventBadge(reg.eventType)}</td>
                <td>${reg.teamSize}</td>
                <td>${reg.teamLead}</td>
                <td>${reg.mobile}</td>
                <td><code class="text-xs bg-gray-100 px-2 py-1 rounded">${reg.transactionId}</code></td>
                <td class="font-semibold">₹${reg.registrationFee}</td>
                <td class="text-sm text-gray-600">${formatDate(reg.createdAt)}</td>
            </tr>
        `).join('');
}

function filterRegistrations() {
    updateRegistrationsTable();
}

function exportToCSV() {
    if (AppState.registrations.length === 0) {
        showToast('Export Error', 'No registrations to export.', 'error');
        return;
    }
    
    const headers = [
        'Team Name', 'Event Type', 'Team Size', 'Team Lead', 'Team Members', 
        'Mobile', 'Transaction ID', 'Registration Fee', 'Registration Date'
    ];
    
    const csvContent = [
        headers.join(','),
        ...AppState.registrations.map(reg => [
            `"${reg.teamName}"`,
            `"${reg.eventType}"`,
            reg.teamSize,
            `"${reg.teamLead}"`,
            `"${reg.teamMembers.join('; ')}"`,
            reg.mobile,
            `"${reg.transactionId}"`,
            reg.registrationFee,
            `"${formatDate(reg.createdAt)}"`
        ].join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `techmania2025-registrations-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Export Successful', 'Registration data has been downloaded as CSV file.');
}

// Local Storage Functions
function saveRegistrations() {
    try {
        localStorage.setItem('techmania2025_registrations', JSON.stringify(AppState.registrations));
    } catch (error) {
        console.error('Failed to save registrations:', error);
    }
}

function loadRegistrations() {
    try {
        const saved = localStorage.getItem('techmania2025_registrations');
        if (saved) {
            AppState.registrations = JSON.parse(saved);
        }
    } catch (error) {
        console.error('Failed to load registrations:', error);
        AppState.registrations = [];
    }
}