const API_BASE = 'https://form-s6q4.onrender.com';
const dropZone = document.getElementById('drop-zone');
const emptyState = document.getElementById('empty-state');

// Initialize Sortable for dragging
new Sortable(document.getElementById('field-list'), {
    group: {
        name: 'shared',
        pull: 'clone',
        put: false
    },
    animation: 150,
    sort: false
});

new Sortable(dropZone, {
    group: 'shared',
    animation: 150,
    onAdd: function (evt) {
        if(emptyState) emptyState.style.display = 'none';
        
        const itemEl = evt.item; 
        const type = itemEl.getAttribute('data-type');
        
        // Transform the dragged pill into a form element
        itemEl.className = 'form-element';
        itemEl.innerHTML = `
            <div style="flex-grow: 1;">
                <input type="text" class="input-basic" placeholder="Question Label" value="${type === 'text' ? 'New Question' : 'New ' + type + ' field'}" style="font-weight: bold; border: none; border-bottom: 1px solid var(--card-border); border-radius: 0; margin-bottom: 0.5rem;">
                ${type === 'textarea' ? '<textarea class="input-basic" disabled placeholder="Text area"></textarea>' : '<input type="'+(type==='text'?'text':type)+'" class="input-basic" disabled placeholder="'+type+' input">'}
            </div>
            <button class="btn btn-secondary" onclick="this.parentElement.remove()" style="margin-left: 1rem; color: var(--danger); border:none;">X</button>
        `;
    }
});

// AI Generation logic
document.getElementById('btn-generate').addEventListener('click', async () => {
    const topic = document.getElementById('ai-topic').value;
    if(!topic) return alert('Please enter a topic');
    
    const btn = document.getElementById('btn-generate');
    btn.innerText = 'Generating...';
    btn.disabled = true;

    try {
        const res = await fetch('http://localhost:8000/ai/generate-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: topic })
        });
        const data = await res.json();
        
        if(data.questions && data.questions.length > 0) {
            if(emptyState) emptyState.style.display = 'none';
            data.questions.forEach(q => {
                const div = document.createElement('div');
                div.className = 'form-element';
                div.innerHTML = `
                    <div style="flex-grow: 1;">
                        <input type="text" class="input-basic" value="${q.label}" style="font-weight: bold; border: none; border-bottom: 1px solid var(--card-border); border-radius: 0; margin-bottom: 0.5rem;">
                        <input type="${q.field_type === 'textarea' ? 'text' : q.field_type}" class="input-basic" disabled placeholder="${q.field_type} input">
                    </div>
                    <button class="btn btn-secondary" onclick="this.parentElement.remove()" style="margin-left: 1rem; color: var(--danger); border:none;">X</button>
                `;
                dropZone.appendChild(div);
            });
        }
    } catch (e) {
        alert('Error generating questions. Make sure the backend is running and API key is set.');
    } finally {
        btn.innerText = 'Generate';
        btn.disabled = false;
    }
});

// Save Form Logic
document.getElementById('save-form').addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login first to save a form');
        window.location.href = 'login.html';
        return;
    }

    const title = document.getElementById('form-title').value;
    const desc = document.getElementById('form-desc').value;
    
    if(!title) return alert('Please provide a form title');

    try {
        const res = await fetch('http://localhost:8000/forms', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title: title, description: desc, status: 'published' })
        });
        
        if(!res.ok) throw new Error('Failed to create form');
        
        const form = await res.json();
        
        // Save fields individually
        const elements = document.getElementById('drop-zone').querySelectorAll('.form-element');
        let order = 0;
        for (const el of elements) {
            const labelInput = el.querySelector('input[type="text"]').value;
            const disabledInput = el.querySelector('input:disabled, textarea:disabled');
            let type = 'text';
            if (disabledInput) {
                if (disabledInput.tagName === 'TEXTAREA') type = 'textarea';
                else type = disabledInput.getAttribute('placeholder').split(' ')[0].toLowerCase();
            }
            
            await fetch(`http://localhost:8000/forms/${form.id}/fields`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    field_type: type,
                    label: labelInput,
                    required: false,
                    order: order++
                })
            });
        }
        
        alert('Form successfully created and published!');
        window.location.href = 'index.html';
        
    } catch(e) {
        console.error(e);
        alert('Error saving form');
    }
});
