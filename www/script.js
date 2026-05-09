const socket = io();

// UI Elements
const statusText = document.getElementById('connection-status');
const textInput = document.getElementById('sync-text');
const colorBtns = document.querySelectorAll('.color-btn');
const toggleSwitch = document.getElementById('sync-toggle');
const previewBox = document.getElementById('preview-box');

// Connection Status
socket.on('connect', () => {
    statusText.textContent = 'Ulandi';
    statusText.classList.add('connected');
});

socket.on('disconnect', () => {
    statusText.textContent = 'Uzildi';
    statusText.classList.remove('connected');
});

// Broadcast changes to server
function broadcastState(key, value) {
    socket.emit('state-change', { key, value });
}

// Event Listeners for local changes
textInput.addEventListener('input', (e) => {
    const text = e.target.value;
    previewBox.textContent = text || 'Dinamik Oyna';
    broadcastState('text', text);
});

colorBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const color = e.target.getAttribute('data-color');
        
        // Update UI
        colorBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        previewBox.style.backgroundColor = color;
        previewBox.style.color = '#fff';

        // Broadcast
        broadcastState('color', color);
    });
});

toggleSwitch.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    
    // Update UI
    previewBox.style.opacity = isChecked ? '1' : '0.2';
    
    // Broadcast
    broadcastState('toggle', isChecked);
});


// Listen for state changes from other clients
socket.on('state-update', (data) => {
    const { key, value } = data;

    if (key === 'text') {
        textInput.value = value;
        previewBox.textContent = value || 'Dinamik Oyna';
    } 
    else if (key === 'color') {
        colorBtns.forEach(b => {
            if (b.getAttribute('data-color') === value) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        previewBox.style.backgroundColor = value;
        previewBox.style.color = '#fff';
    }
    else if (key === 'toggle') {
        toggleSwitch.checked = value;
        previewBox.style.opacity = value ? '1' : '0.2';
    }
});
