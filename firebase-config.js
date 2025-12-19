import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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

// --- ANALYTICS TRACKER ---
window.trackAction = async (id, type) => {
    const postRef = doc(db, "news", id);
    if(type === 'view') await updateDoc(postRef, { views: increment(1) });
    if(type === 'share') await updateDoc(postRef, { shares: increment(1) });
};

// --- RENDER PUBLIC FEED (FULL CONTENT) ---
const publicFeed = document.getElementById('news-feed');
if (publicFeed) {
    onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
        publicFeed.innerHTML = '';
        snap.forEach(d => {
            const p = d.data(); const id = d.id;
            const uniqueUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;
            publicFeed.innerHTML += `
                <article class="full-news-item">
                    <span class="meta">AI Intelligence • ${p.views || 0} Reads</span>
                    <h2>${p.title}</h2>
                    ${p.image ? `<img src="${p.image}">` : ''}
                    <p>${p.content}</p>
                    <div class="share-row">
                        <button onclick="copyLink('${id}', '${uniqueUrl}')" class="share-btn">🔗 Copy Link</button>
                        <a href="https://wa.me/?text=Check this AI Update: ${encodeURIComponent(uniqueUrl)}" 
                           target="_blank" onclick="trackAction('${id}', 'share')" class="share-btn wa">WhatsApp</a>
                    </div>
                </article>`;
            trackAction(id, 'view');
        });
    });
}

window.copyLink = (id, url) => {
    navigator.clipboard.writeText(url);
    trackAction(id, 'share');
    alert("Unique link copied to clipboard!");
};

// --- ADMIN STATS DASHBOARD ---
const renderStats = (data) => {
    const ctx = document.getElementById('statsChart');
    if(!ctx) return;
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(i => i.title.substring(0, 15) + '...'),
            datasets: [{ label: 'Views', data: data.map(i => i.views || 0), backgroundColor: '#0071e3' }]
        },
        options: { indexAxis: 'y', plugins: { legend: { display: false } } }
    });
};

// --- AUTH & MANAGE SECTION (SAFE GUARDS) ---
onAuthStateChanged(auth, (user) => {
    const dash = document.getElementById('admin-dashboard');
    const login = document.getElementById('login-section');
    if (user) {
        if(dash) dash.classList.remove('hidden');
        if(login) login.classList.add('hidden');
        
        // Load Stats when Admin is logged in
        onSnapshot(query(collection(db, "news"), orderBy("views", "desc")), (snap) => {
            let totalViews = 0, totalShares = 0, chartData = [];
            snap.forEach(d => {
                const p = d.data();
                totalViews += (p.views || 0); totalShares += (p.shares || 0);
                chartData.push({ title: p.title, views: p.views });
            });
            if(document.getElementById('stat-views')) document.getElementById('stat-views').innerText = totalViews;
            if(document.getElementById('stat-shares')) document.getElementById('stat-shares').innerText = totalShares;
            if(document.getElementById('stat-posts')) document.getElementById('stat-posts').innerText = snap.size;
            renderStats(chartData);
        });
    } else {
        if(dash) dash.classList.add('hidden');
        if(login) login.classList.remove('hidden');
    }
});

// --- ADMIN ACTIONS (PUBLISH, EDIT, DELETE) ---
const pubBtn = document.getElementById('publishBtn');
if(pubBtn) {
    pubBtn.onclick = async () => {
        await addDoc(collection(db, "news"), {
            title: document.getElementById('postTitle').value,
            content: document.getElementById('postContent').value,
            image: document.getElementById('postImage').value,
            views: 0, shares: 0, date: serverTimestamp()
        });
        alert("Published!"); location.reload();
    };
}

const loginBtn = document.getElementById('loginBtn');
if(loginBtn) {
    loginBtn.onclick = () => {
        const e = document.getElementById('loginEmail').value;
        const p = document.getElementById('loginPassword').value;
        signInWithEmailAndPassword(auth, e, p).catch(err => alert(err.message));
    };
}
// [Remaining Admin logic for GitHub upload and Edit Modal goes here, wrapped in 'if' blocks]
