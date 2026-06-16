const API_BASE = 'https://form-s6q4.onrender.com';
const urlParams = new URLSearchParams(window.location.search);
const formId = urlParams.get('id');

async function loadAnalytics() {
    const token = localStorage.getItem('token');
    if (!token) return window.location.href = 'login.html';

    try {
        const res = await fetch(`${API_BASE}/forms/${formId}/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load analytics');
        const data = await res.json();
        
        document.getElementById('form-title').innerText = `Form ID: ${formId}`;
        document.getElementById('stat-responses').innerText = data.total_responses;
        
        let avgConf = 0;
        let completeCount = 0;
        let dropCount = 0;

        if (data.predictions && data.predictions.length > 0) {
            const totalConf = data.predictions.reduce((sum, p) => sum + p.confidence, 0);
            avgConf = (totalConf / data.predictions.length).toFixed(1);
            
            data.predictions.forEach(p => {
                if(p.prediction === 'Complete') completeCount++;
                else dropCount++;
            });
        }
        
        document.getElementById('stat-confidence').innerText = avgConf + '%';

        // Render Chart
        const ctx = document.getElementById('predictionChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Likely to Complete', 'Likely to Drop-Off'],
                datasets: [{
                    data: [completeCount, dropCount],
                    backgroundColor: ['#10B981', '#EF4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });

        // Load raw responses text (since we didn't build a full table API for brevity)
        // Here we just represent the UI
        const list = document.getElementById('responses-list');
        if (data.total_responses > 0) {
            list.innerHTML = `<p class="text-muted">You have ${data.total_responses} responses. Full list fetching is stubbed for UI demonstration.</p>`;
        } else {
            list.innerHTML = '<p class="text-muted">No responses yet. Share your form to gather data!</p>';
        }

    } catch(e) {
        console.error(e);
        alert('Could not load analytics.');
    }
}

document.getElementById('btn-export').addEventListener('click', () => {
    const element = document.getElementById('analytics-content');
    const opt = {
        margin:       0.5,
        filename:     `analytics_${formId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
});

document.addEventListener('DOMContentLoaded', loadAnalytics);
