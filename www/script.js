let socket;
let peerConnection;
let localStream;
let roomId;
let isViewer = false;

const rtcConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ]
};

const connectScreen = document.getElementById('connect-screen');
const roomScreen = document.getElementById('room-screen');
const videoScreen = document.getElementById('video-screen');
const ipInput = document.getElementById('ip-input');
const roomIdInput = document.getElementById('room-id');
const remoteVideo = document.getElementById('remote-video');

document.getElementById('connect-btn').addEventListener('click', () => {
    let ip = ipInput.value.trim();
    if (!ip) return alert("Linkni kiriting");
    
    socket = io(ip, {
        transports: ['polling', 'websocket'],
        extraHeaders: { "bypass-tunnel-reminder": "true" }
    });

    socket.on('connect', () => {
        connectScreen.style.display = 'none';
        roomScreen.style.display = 'block';
    });

    socket.on('connect_error', (err) => alert("Xatolik: " + err.message));

    // WebRTC Signaling
    socket.on('user-joined', async () => {
        if (!isViewer) {
            console.log("Kuzatuvchi kirdi, video offer yuborilmoqda...");
            createOffer();
        }
    });

    socket.on('offer', async (data) => {
        if (isViewer) {
            console.log("Video offer qabul qilindi, answer qaytarilmoqda...");
            await handleOffer(data.offer);
        }
    });

    socket.on('answer', async (data) => {
        if (!isViewer && peerConnection) {
            console.log("Answer qabul qilindi, ulanish o'rnatildi.");
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
    });

    socket.on('ice-candidate', async (data) => {
        if (peerConnection) {
            try {
                await peerConnection.addIceCandidate(data.candidate);
            } catch (e) { console.error('ICE xatosi', e); }
        }
    });
});

// START SHARING SCREEN (Sender)
document.getElementById('share-btn').addEventListener('click', async () => {
    roomId = roomIdInput.value.trim();
    if (!roomId) return alert("Xona raqamini kiriting");
    isViewer = false;

    try {
        // Ekran yozishga ruxsat so'rash
        localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        
        socket.emit('join-room', roomId);
        
        roomScreen.style.display = 'none';
        videoScreen.style.display = 'flex';
        remoteVideo.srcObject = localStream; // O'ziga o'zini ko'rsatish

        localStream.getVideoTracks()[0].onended = () => stopSharing();
    } catch (err) {
        alert("Ekranni ulashish bekor qilindi yoki brauzer ruxsat bermadi.");
    }
});

// START VIEWING SCREEN (Receiver)
document.getElementById('view-btn').addEventListener('click', () => {
    roomId = roomIdInput.value.trim();
    if (!roomId) return alert("Xona raqamini kiriting");
    isViewer = true;

    socket.emit('join-room', roomId);
    
    roomScreen.style.display = 'none';
    videoScreen.style.display = 'flex';
});

document.getElementById('stop-btn').addEventListener('click', stopSharing);

function stopSharing() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    videoScreen.style.display = 'none';
    roomScreen.style.display = 'block';
    remoteVideo.srcObject = null;
}

function setupPeerConnection() {
    peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Yuboruvchi bo'lsa, o'z ekranini signalga qo'shadi
    if (!isViewer && localStream) {
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    }

    // Qabul qiluvchi bo'lsa, kelgan videoni ekranga chiqaradi
    peerConnection.ontrack = (event) => {
        if (isViewer) {
            remoteVideo.srcObject = event.streams[0];
        }
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', { roomId: roomId, candidate: event.candidate });
        }
    };
}

async function createOffer() {
    setupPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', { roomId: roomId, offer: offer });
}

async function handleOffer(offer) {
    setupPeerConnection();
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', { roomId: roomId, answer: answer });
}
