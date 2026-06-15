const API_BASE = 'http://localhost:8000';
const urlParams = new URLSearchParams(window.location.search);
const formId = urlParams.get('id');

let startTime = Date.now();
let clickCount = 0;
let scrollCount = 0;

document.addEventListener('click', () => clickCount++);
document.addEventListener('scroll', () => scrollCount++);

async function loadForm() {
    if (!formId) {
        document.getElementById('r-title').innerText = 'Error';
        document.getElementById('r-desc').innerText = 'No form ID provided.';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/public/forms/${formId}`);
        if (!res.ok) throw new Error('Form not found');
        
        const form = await res.json();
        document.getElementById('r-title').innerText = form.title;
        document.getElementById('r-desc').innerText = form.description || '';
        
        const container = document.getElementById('fields-container');
        if (form.fields && form.fields.length > 0) {
            form.fields.forEach(f => {
                const div = document.createElement('div');
                div.className = 'field-group';
                
                let inputHtml = '';
                if (f.field_type === 'textarea') {
                    inputHtml = `<textarea name="${f.label}" class="input-basic" rows="4" ${f.required ? 'required' : ''}></textarea>`;
                } else if (f.field_type === 'checkbox') {
                    inputHtml = `<input type="checkbox" name="${f.label}" style="transform: scale(1.5); margin-left: 0.5rem;" ${f.required ? 'required' : ''}>`;
                } else {
                    inputHtml = `<input type="${f.field_type}" name="${f.label}" class="input-basic" ${f.required ? 'required' : ''}>`;
                }
                
                div.innerHTML = `<label>${f.label} ${f.required ? '<span style="color:red;">*</span>' : ''}</label>${inputHtml}`;
                container.appendChild(div);
            });
            document.getElementById('btn-submit').style.display = 'block';
        } else {
            container.innerHTML = '<p class="text-muted">This form has no fields yet.</p>';
        }
    } catch (e) {
        document.getElementById('r-title').innerText = 'Error';
        document.getElementById('r-desc').innerText = 'Form could not be loaded or does not exist.';
    }
}

document.getElementById('public-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit');
    btn.innerText = 'Submitting...';
    btn.disabled = true;

    const formData = new FormData(e.target);
    const answers = Object.fromEntries(formData.entries());
    
    const completionTimeSec = Math.round((Date.now() - startTime) / 1000);
    const fieldCount = document.querySelectorAll('.field-group').length;

    const responsePayload = {
        answers: answers,
        completion_time_sec: completionTimeSec,
        click_count: clickCount,
        scroll_count: scrollCount,
        field_count: fieldCount,
        required_count: 0, 
        complexity_score: 5 
    };

    try {
        const res = await fetch(`${API_BASE}/public/forms/${formId}/responses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ response_data: JSON.stringify(responsePayload) })
        });

        if (res.ok) {
            document.getElementById('form-container').style.display = 'none';
            document.getElementById('success-message').style.display = 'block';
        } else {
            throw new Error('Failed to submit');
        }
    } catch (err) {
        alert('Error submitting form. Please try again.');
        btn.innerText = 'Submit Responses';
        btn.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', loadForm);
