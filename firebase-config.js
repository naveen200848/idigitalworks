import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, increment, getDocs, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
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

// --- AUTH ---
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.onclick = () => {
        const e = document.getElementById('loginEmail').value;
        const p = document.getElementById('loginPassword').value;
        if (!e || !p) return alert("Fill credentials.");
        loginBtn.innerText = "Authenticating...";
        signInWithEmailAndPassword(auth, e, p).catch(err => {
            alert(err.message);
            loginBtn.innerText = "Login to Dashboard";
        });
    };
}

onAuthStateChanged(auth, (user) => {
    const dash = document.getElementById('admin-dashboard');
    const login = document.getElementById('login-section');
    if (user) {
        if(dash) dash.classList.remove('hidden');
        if(login) login.classList.add('hidden');
        loadAnalytics('30d');
        loadAdminList();
    } else {
        if(dash) dash.classList.add('hidden');
        if(login) login.classList.remove('hidden');
    }
});

// --- ANALYTICS ---
async function loadAnalytics(range) {
    const now = Date.now();
    let start = now - (30 * 24 * 3600000);
    if (range === '60m') start = now - 3600000;

    // Discovery Stats
    const dq = query(collection(db, "discovery"), where("timestamp", ">=", new Date(start)));
    const dSnap = await getDocs(dq);
    if(document.getElementById('stat-discovery')) document.getElementById('stat-discovery').innerText = dSnap.size;
    
    const list = document.getElementById('discovery-list');
    if(list) {
        list.innerHTML = '';
        dSnap.forEach(d => {
            const data = d.data();
            list.innerHTML += `<div style="padding:5px; border-bottom:1px solid #eee;"><b>${data.source}</b> | Ref: ${data.referrer?.substring(0,30)}</div>`;
        });
    }

    // Article Clicks (Handles old 'views' or new 'title_clicks')
    onSnapshot(collection(db, "news"), (snap) => {
        let total = 0;
        snap.forEach(d => {
            const data = d.data();
            total += (data.title_clicks || data.views || 0);
        });
        if(document.getElementById('stat-title-views')) document.getElementById('stat-title-views').innerText = total;
        if(document.getElementById('stat-posts')) document.getElementById('stat-posts').innerText = snap.size;
    });
}

// --- PUBLIC FEED & TRACKING ---
const feed = document.getElementById('news-feed');
if (feed) {
    // Discovery Logging
    if(!sessionStorage.getItem('trkd')) {
        const params = new URLSearchParams(window.location.search);
        addDoc(collection(db, "discovery"), {
            source: params.get('utm_source') || 'Direct',
            referrer: document.referrer || 'None',
            timestamp: serverTimestamp()
        });
        sessionStorage.setItem('trkd', '1');
    }

    onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
        feed.innerHTML = '';
        snap.forEach(d => {
            const p = d.data();
            const id = d.id;
            feed.innerHTML += `
                <article class="article-block">
                    <span class="article-meta">AI NEWS • ${p.title_clicks || p.views || 0} READS</span>
                    <h2 onclick="openArticle('${id}', \`${p.title.replace(/'/g, "\\'")}\`, \`${p.content.replace(/'/g, "\\'").replace(/\n/g, '<br>')}\`, '${p.image}')">${p.title}</h2>
                    ${p.image ? `<img src="${p.image}">` : ''}
                    <div class="article-content">${p.content}</div>
                </article>`;
        });
    });
}

window.openArticle = async (id, title, content, image) => {
    await updateDoc(doc(db, "news", id), { title_clicks: increment(1) });
    gtag('event', 'article_read', { 'title': title });
    const reader = document.getElementById('readerView');
    const body = document.getElementById('readerBody');
    if(reader && body) {
        body.innerHTML = `<h1>${title}</h1>${image ? `<img src="${image}" style="width:100%">` : ''}<div style="font-size:20px; line-height:1.8;">${content}</div>`;
        reader.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
};

// --- ADMIN MANAGEMENT ---
function loadAdminList() {
    const adminFeed = document.getElementById('admin-feed');
    if (!adminFeed) return;
    onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
        adminFeed.innerHTML = '';
        snap.forEach(d => {
            const p = d.data();
            const ageH = (Date.now() - (p.date?.seconds * 1000)) / 3600000;
            const status = (ageH > 24 || (p.title_clicks || p.views) > 10) ? 'status-indexed' : 'status-pending';
            adminFeed.innerHTML += `
                <div class="admin-post-item">
                    <span><span class="index-status ${status}"></span> ${p.title}</span>
                    <button onclick="deletePost('${d.id}')" style="color:red; background:none;">Delete</button>
                </div>`;
        });
    });
}

window.deletePost = async (id) => { if(confirm("Delete?")) await deleteDoc(doc(db, "news", id)); };

// PUBLISH
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
                title_clicks: 0, date: serverTimestamp()
            });
            await generateSitemap();
            alert("Success!"); location.reload();
        } catch(e) { alert(e.message); publishBtn.innerText = "Publish & Update Sitemap"; }
    };
}

const indexBtn = document.getElementById('indexBtn');
if (indexBtn) {
    indexBtn.onclick = async () => {
        await generateSitemap();
        window.open("https://search.google.com/search-console/sitemaps?resource_id=https://www.idigitalworks.com/", "_blank");
    };
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.onclick = () => signOut(auth).then(() => location.reload());
