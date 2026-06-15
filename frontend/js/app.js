const API_BASE = 'http://localhost:8000';

async function fetchForms() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/forms`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }
        
        const forms = await res.json();
        const container = document.getElementById('forms-container');
        if (!container) return;

        container.innerHTML = '';
        
        document.getElementById('total-forms').innerText = forms.length;

        // Mock stats for now since vanilla UI lacks complete analytics parsing
        document.getElementById('total-responses').innerText = '0';
        document.getElementById('avg-completion').innerText = '0%';

        if (forms.length === 0) {
            container.innerHTML = '<p class="text-muted">No forms created yet. Create one to get started!</p>';
            return;
        }

        forms.forEach(form => {
            const div = document.createElement('div');
            div.className = 'glass-card';
            div.innerHTML = `
                <h3>${form.title}</h3>
                <p class="text-muted">${form.description || 'No description'}</p>
                <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--primary); margin-bottom: 1rem;">
                    Form ID: ${form.id.substring(0,8)}...
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <a href="analytics.html?id=${form.id}" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Analytics</a>
                    <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('http://localhost:5173/form.html?id=${form.id}'); alert('Share link copied!');" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Copy Link</button>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (e) {
        console.error(e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchForms();
    
    const headerDiv = document.querySelector('.header div:last-child');
    if(headerDiv && !window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-secondary';
        logoutBtn.innerText = 'Logout';
        logoutBtn.style.marginRight = '1rem';
        logoutBtn.onclick = () => {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        };
        headerDiv.prepend(logoutBtn);
    }
});
