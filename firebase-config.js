import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, query, orderBy, onSnapshot, increment, getDocs, where, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = { /* Your Config */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- DASHBOARD ANALYTICS FIX ---
async function loadAnalytics(range) {
    const now = new Date();
    let startTime = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    if (range === '60m') startTime = new Date(now.getTime() - (60 * 60 * 1000));
    if (range === '7d') startTime = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    const dq = query(collection(db, "discovery"), where("timestamp", ">=", Timestamp.fromDate(startTime)));
    const dSnap = await getDocs(dq);
    if(document.getElementById('stat-discovery')) document.getElementById('stat-discovery').innerText = dSnap.size;

    const list = document.getElementById('discovery-list');
    if(list) {
        list.innerHTML = '';
        dSnap.forEach(d => {
            const data = d.data();
            list.innerHTML += `<div style="padding:8px; border-bottom:1px solid #eee;"><b>${data.source}</b> | Ref: ${data.referrer?.substring(0,30)}...</div>`;
        });
    }
}

const timeFilter = document.getElementById('timeFilter');
if (timeFilter) timeFilter.onchange = (e) => loadAnalytics(e.target.value);

// --- AI NEWS: BANNERS (TOP 10) AND GRID ---
const bannerSection = document.getElementById('banner-section');
const newsFeed = document.getElementById('news-feed');
if (bannerSection && newsFeed) {
    onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
        bannerSection.innerHTML = '';
        newsFeed.innerHTML = '';
        let count = 0;
        snap.forEach(d => {
            const p = d.data();
            if (count < 10) {
                bannerSection.innerHTML += `
                    <div class="banner-card" onclick="openArticle('${d.id}', \`${p.title}\`, \`${p.content}\`, '${p.image}')">
                        <img src="${p.image}">
                        <div class="banner-info"><h2>${p.title}</h2></div>
                    </div>`;
            } else {
                newsFeed.innerHTML += `
                    <div class="article-block">
                        <span class="article-meta">${p.title_clicks || 0} READS</span>
                        <h3 onclick="openArticle('${d.id}', \`${p.title}\`, \`${p.content}\`, '${p.image}')">${p.title}</h3>
                        ${p.image ? `<img src="${p.image}">` : ''}
                        <div class="article-content">${p.content}</div>
                    </div>`;
            }
            count++;
        });
    });
}

// --- AI TOOLS GRID ---
const toolsGrid = document.getElementById('tools-grid');
if (toolsGrid) {
    onSnapshot(query(collection(db, "ai_tools"), orderBy("date", "desc")), (snap) => {
        toolsGrid.innerHTML = '';
        snap.forEach(d => {
            const t = d.data();
            toolsGrid.innerHTML += `
                <div class="tool-card" onclick="window.open('${t.link}', '_blank')">
                    <img src="${t.image}">
                    <h3>${t.name}</h3>
                    <p>${t.description}</p>
                    <div class="tool-meta"><span class="pricing">${t.pricing}</span><span class="tag">${t.category}</span></div>
                </div>`;
        });
    });
}

// --- PUBLISHING LOGIC ---
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
        alert("AI Tool Published!"); location.reload();
    };
}
// ... [Continue news publishing & Auth Logic] ...
