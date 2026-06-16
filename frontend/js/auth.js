const API_BASE = 'https://form-s6q4.onrender.com';

const loginBtn = document.getElementById('btn-login');
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        if (!email || !password) return alert('Please fill in all fields');

        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password, name: "Login" }) 
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.access_token);
                window.location.href = 'index.html';
            } else {
                alert(data.detail || 'Login failed');
            }
        } catch (e) {
            console.error(e);
            alert('Server error');
        }
    });
}

const registerBtn = document.getElementById('btn-register');
if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        if (!name || !email || !password) return alert('Please fill in all fields');

        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            if (res.ok) {
                alert('Registration successful! Please login.');
                window.location.href = 'login.html';
            } else {
                const data = await res.json();
                alert(data.detail || 'Registration failed');
            }
        } catch (e) {
            console.error(e);
            alert('Server error');
        }
    });
}
