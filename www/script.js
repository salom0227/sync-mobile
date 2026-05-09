let socket;

const connectScreen = document.getElementById('connect-screen');
const appScreen = document.getElementById('app-screen');
const ipInput = document.getElementById('ip-input');
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');

// UI Elements
const statusText = document.getElementById('connection-status');
const textInput = document.getElementById('sync-text');
const colorBtns = document.querySelectorAll('.color-btn');
const toggleSwitch = document.getElementById('sync-toggle');
const previewBox = document.getElementById('preview-box');

// Ulanish tugmasi
connectBtn.addEventListener('click', () => {
    let ip = ipInput.value.trim();
    if (!ip) return alert('Iltimos havolani kiriting!');
    
    // Oynalarni almashtirish
    connectScreen.style.display = 'none';
    appScreen.style.display = 'block';
    statusText.textContent = 'Ulanmoqda...';
    
    // Serverga ulanish
    socket = io(ip, {
        transports: ['polling', 'websocket'],
        extraHeaders: {
            "bypass-tunnel-reminder": "true" // Localtunnel qulfini aylanib o'tish
        }
    });

    socket.on('connect', () => {
        statusText.textContent = 'Ulandi';
        statusText.classList.add('connected');
    });

    socket.on('connect_error', (err) => {
        console.error('Xatolik:', err);
        statusText.textContent = 'Xato: ' + err.message;
        statusText.classList.remove('connected');
    });

    socket.on('disconnect', () => {
        statusText.textContent = 'Uzildi';
        statusText.classList.remove('connected');
    });

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
});

disconnectBtn.addEventListener('click', () => {
    if(socket) socket.disconnect();
    appScreen.style.display = 'none';
    connectScreen.style.display = 'block';
});

// Broadcast changes to server
function broadcastState(key, value) {
    if(socket && socket.connected) {
        socket.emit('state-change', { key, value });
    }
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
        
        colorBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        previewBox.style.backgroundColor = color;
        previewBox.style.color = '#fff';

        broadcastState('color', color);
    });
});

toggleSwitch.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    previewBox.style.opacity = isChecked ? '1' : '0.2';
    broadcastState('toggle', isChecked);
});
