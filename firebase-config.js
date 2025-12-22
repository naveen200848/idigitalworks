import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, increment, getDocs, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// IMPORTANT: Ensure sitemap.js exists in the same folder as this file.
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

// --- 1. LOGIN LOGIC ---
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.onclick = () => {
        const e = document.getElementById('loginEmail').value;
        const p = document.getElementById('loginPassword').value;
        if (!e || !p) return alert("Please enter email and password.");
        
        loginBtn.disabled = true;
        loginBtn.innerText = "Checking...";
        
        signInWithEmailAndPassword(auth, e, p)
            .catch(err => {
                alert("Login Error: " + err.message);
                loginBtn.disabled = false;
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
        loadManagementList();
    } else {
        if(dash) dash.classList.add('hidden');
        if(login) login.classList.remove('hidden');
    }
});

// --- 2. ANALYTICS & DISCOVERY ---
const loadAnalytics = async (range) => {
    const now = Date.now();
    let startTime = now - (30 * 24 * 60 * 60 * 1000);
    if (range === '60m') startTime = now - 3600000;
    if (range === '7d') startTime = now - (7 * 24 * 3600000);

    // Track Global Title Clicks
    onSnapshot(collection(db, "news"), (snap) => {
        let clicks = 0;
        snap.forEach(d => clicks += (d.data().title_clicks || 0));
        const el = document.getElementById('stat-title-views');
        if(el) el.innerText = clicks;
        const postsEl = document.getElementById('stat-posts');
        if(postsEl) postsEl.innerText = snap.size;
    });

    // Track Discovery
    const dq = query(collection(db, "discovery"), where("timestamp", ">=", new Date(startTime)));
    const dSnap = await getDocs(dq);
    const discEl = document.getElementById('stat-discovery');
    if(discEl) discEl.innerText = dSnap.size;

    const list = document.getElementById('discovery-list');
    if (list) {
        list.innerHTML = '';
        dSnap.forEach(d => {
            const data = d.data();
            list.innerHTML += `<div style="padding:5px; border-bottom:1px solid #eee;"><b>${data.source}</b> | Ref: ${data.referrer?.substring(0, 30)}...</div>`;
        });
    }
};

const timeFilter = document.getElementById('timeFilter');
if (timeFilter) timeFilter.onchange = (e) => loadAnalytics(e.target.value);

// --- 3. PUBLISHING & SITEMAPS ---
const publishBtn = document.getElementById('publishBtn');
if (publishBtn) {
    publishBtn.onclick = async () => {
        const title = document.getElementById('postTitle').value;
        const content = document.getElementById('postContent').value;
        if (!title || !content) return alert("Missing Headline or Content.");

        publishBtn.disabled = true;
        publishBtn.innerText = "Publishing...";

        try {
            await addDoc(collection(db, "news"), {
                title, content, 
                image: document.getElementById('postImage').value,
                link: document.getElementById('postLink').value,
                title_clicks: 0, date: serverTimestamp()
            });
            await generateSitemap(); // Automatic sitemap logic refresh
            alert("Published & Sitemap Updated!");
            location.reload();
        } catch (e) {
            alert("Error: " + e.message);
            publishBtn.disabled = false;
            publishBtn.innerText = "Publish & Update Sitemap";
        }
    };
}

const indexBtn = document.getElementById('indexBtn');
if (indexBtn) {
    indexBtn.onclick = async () => {
        await generateSitemap();
        window.open("https://search.google.com/search-console/sitemaps?resource_id=https://www.idigitalworks.com/", "_blank");
    };
}

// --- 4. MANAGEMENT LIST ---
const loadManagementList = () => {
    const feed = document.getElementById('admin-feed');
    if (!feed) return;
    onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
        feed.innerHTML = '';
        snap.forEach(d => {
            const p = d.data();
            const ageHours = (Date.now() - (p.date?.seconds * 1000)) / 3600000;
            const statusClass = (ageHours > 24 || p.title_clicks > 10) ? 'status-indexed' : 'status-pending';
            
            const div = document.createElement('div');
            div.className = "admin-post-item";
            div.innerHTML = `<span><span class="index-status ${statusClass}"></span> ${p.title}</span>
                <button onclick="deletePost('${d.id}')" style="color:red; background:none;">Delete</button>`;
            feed.appendChild(div);
        });
    });
};

window.deletePost = async (id) => { if(confirm("Delete permanently?")) await deleteDoc(doc(db, "news", id)); };
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.onclick = () => signOut(auth).then(() => location.reload());
