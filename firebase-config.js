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
        if (!e || !p) return alert("Credentials required.");
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
        if (dash) dash.classList.remove('hidden');
        if (login) login.classList.add('hidden');
        loadAnalytics('30d');
        loadAdminList();
    } else {
        if (dash) dash.classList.add('hidden');
        if (login) login.classList.remove('hidden');
    }
});

// --- GITHUB API HELPERS ---
const owner = "naveen200848";
const repo = "idigitalworks";

async function updateGithubSitemap() {
    const token = document.getElementById('githubToken').value;
    if (!token) return console.log("No token: Sitemap.xml update skipped.");

    const xml = await generateSitemap();
    const encoded = btoa(unescape(encodeURIComponent(xml)));
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/sitemap.xml`;

    try {
        const getFile = await fetch(url, { headers: { Authorization: `token ${token}` } });
        const data = await getFile.json();
        await fetch(url, {
            method: "PUT",
            headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Update Sitemap", content: encoded, sha: data.sha })
        });
    } catch (e) { console.error("Sitemap Push Failed:", e); }
}

// --- ANALYTICS ---
async function loadAnalytics(range) {
    const now = Date.now();
    let start = now - (30 * 24 * 3600000);
    if (range === '60m') start = now - 3600000;

    onSnapshot(collection(db, "news"), (snap) => {
        let clicks = 0;
        snap.forEach(d => clicks += (d.data().title_clicks || d.data().views || 0));
        if (document.getElementById('stat-title-views')) document.getElementById('stat-title-views').innerText = clicks;
        if (document.getElementById('stat-posts')) document.getElementById('stat-posts').innerText = snap.size;
    });

    const dSnap = await getDocs(query(collection(db, "discovery"), where("timestamp", ">=", new Date(start))));
    if (document.getElementById('stat-discovery')) document.getElementById('stat-discovery').innerText = dSnap.size;
}

// --- PUBLIC FEED ---
const feed = document.getElementById('news-feed');
if (feed) {
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
    const reader = document.getElementById('readerView');
    const body = document.getElementById('readerBody');
    if (reader && body) {
        body.innerHTML = `<h1>${title}</h1>${image ? `<img src="${image}" style="width:100%">` : ''}<div style="font-size:20px; line-height:1.8;">${content}</div>`;
        reader.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
};

// --- ADMIN LIST & EDIT ---
function loadAdminList() {
    const adminFeed = document.getElementById('admin-feed');
    if (!adminFeed) return;
    onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
        adminFeed.innerHTML = '';
        snap.forEach(d => {
            const p = d.data();
            const ageH = (Date.now() - (p.date?.seconds * 1000)) / 3600000;
            const status = (ageH > 24 || (p.title_clicks || p.views) > 10) ? 'status-indexed' : 'status-pending';
            const row = document.createElement('div');
            row.className = "admin-post-item";
            row.innerHTML = `
                <span><span class="index-status ${status}"></span> ${p.title} <small>(${d.id})</small></span>
                <div>
                    <button onclick="editPost('${d.id}', \`${p.title.replace(/'/g, "\\'")}\`, \`${p.content.replace(/'/g, "\\'").replace(/\n/g, '\\n')}\`, '${p.image}', '${p.link}', '${p.redirectUrl || ''}')">Edit</button>
                    <button onclick="deletePost('${d.id}')" style="color:red; background:none; margin-left:10px;">Delete</button>
                </div>`;
            adminFeed.appendChild(row);
        });
    });
}

window.editPost = (id, title, content, image, link, redirect) => {
    window.currentEditId = id;
    document.getElementById('editTitle').value = title;
    document.getElementById('editContent').value = content;
    document.getElementById('editImage').value = image;
    document.getElementById('editLink').value = link;
    document.getElementById('editRedirect').value = redirect;
    document.getElementById('editModal').classList.remove('hidden');
};

const saveEditBtn = document.getElementById('saveEditBtn');
if (saveEditBtn) {
    saveEditBtn.onclick = async () => {
        await updateDoc(doc(db, "news", window.currentEditId), {
            title: document.getElementById('editTitle').value,
            content: document.getElementById('editContent').value,
            image: document.getElementById('editImage').value,
            link: document.getElementById('editLink').value,
            redirectUrl: document.getElementById('editRedirect').value
        });
        await updateGithubSitemap();
        alert("Updated!");
        document.getElementById('editModal').classList.add('hidden');
    };
}

window.deletePost = async (id) => {
    if (confirm("Delete?")) {
        await deleteDoc(doc(db, "news", id));
        await updateGithubSitemap();
    }
};

// --- PUBLISH ---
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
            await updateGithubSitemap();
            alert("Success!");
            location.reload();
        } catch (e) {
            alert(e.message);
            publishBtn.innerText = "Publish & Update Sitemap";
        }
    };
}

// Global scope attachments
window.deletePost = window.deletePost;
window.editPost = window.editPost;

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.onclick = () => signOut(auth).then(() => location.reload());
