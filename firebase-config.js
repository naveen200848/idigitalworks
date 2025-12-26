import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, increment, getDocs, where, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Import sitemap logic safely
let generateSitemap;
try {
    const sitemapModule = await import('./sitemap.js');
    generateSitemap = sitemapModule.generateSitemap;
} catch (e) { console.error("sitemap.js error", e); }

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

// --- 1. LOGIN (Shielded) ---
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.onclick = () => {
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPassword').value;
        if (!email || !pass) return alert("Fill credentials.");
        loginBtn.innerText = "Checking...";
        signInWithEmailAndPassword(auth, email, pass).catch(err => {
            alert(err.message);
            loginBtn.innerText = "Login to Dashboard";
        });
    };
}

onAuthStateChanged(auth, (user) => {
    const dash = document.getElementById('admin-dashboard');
    const login = document.getElementById('login-section');
    if (user) {
        if (dash) dash.classList.remove('hidden');
        if (login) login.classList.add('hidden');
        loadAnalytics('30d');
    } else {
        if (dash) dash.classList.add('hidden');
        if (login) login.classList.remove('hidden');
    }
});

// --- 2. ANALYTICS (FIXED WITH TIMESTAMP) ---
async function loadAnalytics(range) {
    const now = new Date();
    let start = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    if (range === '60m') start = new Date(now.getTime() - 3600000);
    if (range === '7d') start = new Date(now.getTime() - (7 * 24 * 3600000));

    // Discovery tracking must use Timestamp.fromDate()
    const dq = query(collection(db, "discovery"), where("timestamp", ">=", Timestamp.fromDate(start)));
    const dSnap = await getDocs(dq);
    if (document.getElementById('stat-discovery')) document.getElementById('stat-discovery').innerText = dSnap.size;

    const list = document.getElementById('discovery-list');
    if (list) {
        list.innerHTML = '';
        dSnap.forEach(d => {
            const data = d.data();
            list.innerHTML += `<div style="padding:8px; border-bottom:1px solid #eee;"><b>${data.source}</b> | Ref: ${data.referrer?.substring(0, 30)}...</div>`;
        });
    }

    onSnapshot(collection(db, "news"), snap => {
        let clicks = 0;
        snap.forEach(d => clicks += (d.data().title_clicks || 0));
        if (document.getElementById('stat-title-views')) document.getElementById('stat-title-views').innerText = clicks;
        if (document.getElementById('stat-posts')) document.getElementById('stat-posts').innerText = snap.size;
    });
}

const timeFilter = document.getElementById('timeFilter');
if (timeFilter) timeFilter.onchange = (e) => loadAnalytics(e.target.value);

// --- 3. PUBLISHING ---
const publishBtn = document.getElementById('publishBtn');
if (publishBtn) {
    publishBtn.onclick = async () => {
        publishBtn.innerText = "Publishing...";
        try {
            await addDoc(collection(db, "news"), {
                title: document.getElementById('postTitle').value,
                content: document.getElementById('postContent').value,
                image: document.getElementById('postImage').value,
                link: document.getElementById('postLink').value,
                redirectUrl: document.getElementById('redirectUrl').value,
                title_clicks: 0, date: serverTimestamp()
            });
            if (generateSitemap) await generateSitemap();
            alert("Success!"); location.reload();
        } catch (e) { alert(e.message); publishBtn.innerText = "Post to Newsroom"; }
    };
}

const publishToolBtn = document.getElementById('publishToolBtn');
if (publishToolBtn) {
    publishToolBtn.onclick = async () => {
        await addDoc(collection(db, "ai_tools"), {
            name: document.getElementById('toolName').value,
            category: document.getElementById('toolCategory').value,
            pricing: document.getElementById('toolPricing').value,
            image: document.getElementById('toolImage').value,
            link: document.getElementById('toolLink').value,
            description: document.getElementById('toolDesc').value,
            date: serverTimestamp()
        });
        alert("AI Tool Added!"); location.reload();
    };
}
// ... [Logout & Discovery tracking same as previous versions] ...
