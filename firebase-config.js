import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, increment, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { generateSitemap } from './sitemap.js';

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

// --- 1. INDEXING MONITOR LOGIC ---
const getIndexStatus = (date, discoveryCount) => {
    const ageHours = (Date.now() - (date.seconds * 1000)) / 3600000;
    return (ageHours > 24 || discoveryCount > 10) ? 'status-indexed' : 'status-pending';
};

// --- 2. ANALYTICS & DISCOVERY ---
window.openAndTrack = async (id, title, content, image) => {
    await updateDoc(doc(db, "news", id), { views: increment(1) });
    gtag('event', 'article_read', { 'title': title });

    const reader = document.getElementById('readerView');
    const body = document.getElementById('readerBody');
    if(!reader || !body) return;
    body.innerHTML = `<h1>${title}</h1>${image ? `<img src="${image}">` : ''}<div style="font-size:20px; line-height:1.8;">${content}</div>`;
    reader.style.display = 'block';
    window.history.pushState({id}, title, `?id=${id}`);
};

// --- 3. RENDER ADMIN FEED WITH MONITOR ---
const adminFeed = document.getElementById('admin-feed');
if (adminFeed) {
    onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
        adminFeed.innerHTML = '';
        snap.forEach(d => {
            const p = d.data();
            const statusClass = getIndexStatus(p.date || {seconds: Date.now()/1000}, p.views || 0);
            const row = document.createElement('div');
            row.className = "admin-post-item";
            row.innerHTML = `
                <span><span class="index-status ${statusClass}"></span> ${p.title}</span>
                <div>
                    <button onclick="deletePost('${d.id}')" style="color:red; background:none; font-size:12px;">Delete</button>
                </div>`;
            adminFeed.appendChild(row);
        });
    });
}

// --- 4. SITEMAP SUBMISSION TRIGGER ---
const indexBtn = document.getElementById('indexBtn');
if (indexBtn) {
    indexBtn.onclick = async () => {
        const sitemap = await generateSitemap();
        console.log("Sitemap ready for submission");
        // Modern "Ping": Redirect to GSC Sitemaps Report
        window.open("https://search.google.com/search-console/sitemaps?resource_id=https://www.idigitalworks.com/", "_blank");
    };
}

// ... [Include standard Auth Logic] ...
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.onclick = () => {
        const e = document.getElementById('loginEmail').value;
        const p = document.getElementById('loginPassword').value;
        signInWithEmailAndPassword(auth, e, p).catch(err => alert(err.message));
    };
}
onAuthStateChanged(auth, (user) => {
    const dash = document.getElementById('admin-dashboard');
    const login = document.getElementById('login-section');
    if (user) {
        if(dash) dash.classList.remove('hidden');
        if(login) login.classList.add('hidden');
    } else {
        if(dash) dash.classList.add('hidden');
        if(login) login.classList.remove('hidden');
    }
});
