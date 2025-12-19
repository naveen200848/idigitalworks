import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, increment, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// [Use your actual Firebase Config]
const firebaseConfig = {
  apiKey: "AIzaSyC8YmWqq7cnR5HG62Jb5amEZy9Kw0I38X4",
  authDomain: "iDigitalWorks-News.firebaseapp.com",
  projectId: "idigitalworks-news",
  storageBucket: "iDigitalWorks-News.appspot.com",
  messagingSenderId: "182576210440",
  appId: "1:182576210440:web:ada14cf66380ffa77f67bd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- 1. TRACKING & READER ---
window.trackAndOpen = async (id, title, content, image, link) => {
    // Increment view only on intentional click
    try {
        await updateDoc(doc(db, "news", id), { views: increment(1) });
    } catch (e) { console.error("Tracking Error:", e); }

    const reader = document.getElementById('readerView');
    const body = document.getElementById('readerBody');
    if(!reader || !body) return;

    const uniqueUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;
    const shareText = encodeURIComponent(`AI News: ${title}`);

    body.innerHTML = `
        <h1>${title}</h1>
        <div class="share-bar">
            <button onclick="copyAndTrack('${id}', '${uniqueUrl}')" class="share-btn cp">🔗 Copy Link</button>
            <a href="https://wa.me/?text=${shareText}%20${encodeURIComponent(uniqueUrl)}" target="_blank" onclick="trackAction('${id}', 'share')" class="share-btn wa">WhatsApp</a>
            <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(uniqueUrl)}" target="_blank" class="share-btn tw">Twitter (X)</a>
        </div>
        ${image ? `<img src="${image}">` : ''}
        <div class="reader-text">${content}</div>
        ${link ? `<a href="${link}" target="_blank" style="color:#0071e3; font-weight:bold;">Source Link →</a>` : ''}
    `;
    
    reader.style.display = 'block';
    document.body.style.overflow = 'hidden';
    window.history.pushState({id}, title, `?id=${id}`);
};

window.copyAndTrack = (id, url) => {
    navigator.clipboard.writeText(url);
    updateDoc(doc(db, "news", id), { shares: increment(1) });
    alert("Unique link copied!");
};

// --- 2. RENDER THE BENTO GRID ---
const publicFeed = document.getElementById('news-feed');
if (publicFeed) {
    onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
        publicFeed.innerHTML = '';
        snap.forEach(d => {
            const p = d.data();
            const id = d.id;
            const cleanC = p.content.replace(/`/g, "'").replace(/"/g, '&quot;');
            
            // Bento Grid Card
            publicFeed.innerHTML += `
                <div class="news-card" onclick="trackAndOpen('${id}', \`${p.title}\`, \`${cleanC}\`, '${p.image}', '${p.link}')">
                    ${p.image ? `<img src="${p.image}">` : ''}
                    <h3>${p.title}</h3>
                    <p>${p.content}</p>
                    <div style="margin-top:auto; font-size:11px; font-weight:bold; color:#86868b; text-transform:uppercase;">
                        ${p.views || 0} READS
                    </div>
                </div>`;
        });
    });
}

// Close Reader logic
const closeReaderBtn = document.getElementById('closeReader');
if (closeReaderBtn) {
    closeReaderBtn.onclick = () => {
        document.getElementById('readerView').style.display = 'none';
        document.body.style.overflow = 'auto';
        window.history.pushState({}, '', window.location.pathname);
    };
}

// ... [Keep the Login and Admin dashboard logic from the "Safe" version] ...
