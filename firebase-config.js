import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, increment, getDocs, where, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { generateSitemap } from './sitemap.js';

const firebaseConfig = { /* Your Config Here */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- 1. SHIELDED LOGIN ---
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
        if (dash) dash.classList.remove('hidden');
        if (login) login.classList.add('hidden');
        loadAnalytics('30d');
        loadAdminLists();
    }
});

// --- 2. FIXED ANALYTICS & DISCOVERY ---
async function loadAnalytics(range) {
    const now = new Date();
    let startTime = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    if (range === '60m') startTime = new Date(now.getTime() - 3600000);
    if (range === '7d') startTime = new Date(now.getTime() - (7 * 24 * 3600000));

    const dq = query(collection(db, "discovery"), where("timestamp", ">=", Timestamp.fromDate(startTime)));
    const dSnap = await getDocs(dq);
    if(document.getElementById('stat-discovery')) document.getElementById('stat-discovery').innerText = dSnap.size;

    const list = document.getElementById('discovery-list');
    if(list) {
        list.innerHTML = '';
        dSnap.forEach(d => {
            const data = d.data();
            list.innerHTML += `<div style="padding:5px; border-bottom:1px solid #eee;"><b>${data.source}</b> | Ref: ${data.referrer?.substring(0,30)}...</div>`;
        });
    }

    onSnapshot(collection(db, "news"), snap => {
        let clicks = 0;
        snap.forEach(d => clicks += (d.data().title_clicks || 0));
        if (document.getElementById('stat-title-views')) document.getElementById('stat-title-views').innerText = clicks;
        if (document.getElementById('stat-posts')) document.getElementById('stat-posts').innerText = snap.size;
    });
}

// --- 3. NEWSROOM LOGIC (10 BANNERS + GRID) ---
const bannerTrack = document.getElementById('banner-track');
const newsFeed = document.getElementById('news-feed');
if (bannerTrack && newsFeed) {
    onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
        bannerTrack.innerHTML = ''; newsFeed.innerHTML = '';
        let count = 0;
        snap.forEach(d => {
            const p = d.data();
            if (count < 10) {
                bannerTrack.innerHTML += `
                    <div class="slide" onclick="openArticle('${d.id}', \`${p.title}\`, \`${p.content}\`, '${p.image}', '${p.redirectUrl}')">
                        <img src="${p.image}"><div class="slide-info"><h2>${p.title}</h2></div>
                    </div>`;
            } else {
                newsFeed.innerHTML += `
                    <div class="article-block">
                        <span class="article-meta">${p.title_clicks || 0} READS</span>
                        <h3 onclick="openArticle('${d.id}', \`${p.title}\`, \`${p.content}\`, '${p.image}', '${p.redirectUrl}')">${p.title}</h3>
                        ${p.image ? `<img src="${p.image}">` : ''}
                        <p>${p.content}</p>
                    </div>`;
            }
            count++;
        });
    });
}

// --- 4. AI TOOLS DIRECTORY ---
const toolsGrid = document.getElementById('tools-grid');
if (toolsGrid) {
    onSnapshot(query(collection(db, "ai_tools"), orderBy("date", "desc")), snap => {
        toolsGrid.innerHTML = '';
        snap.forEach(doc => {
            const t = doc.data();
            toolsGrid.innerHTML += `
                <div class="tool-card" onclick="window.open('${t.link}', '_blank')">
                    <img src="${t.image}"><h3>${t.name}</h3>
                    <p>${t.description}</p>
                    <div class="tool-footer"><span>${t.pricing}</span><span class="tag">${t.category}</span></div>
                </div>`;
        });
    });
}

// --- 5. PUBLISHING LOGIC ---
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
// ... [Continue Publishing News Logic] ...
