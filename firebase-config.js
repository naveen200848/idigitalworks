import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, increment, getDocs, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Safety check for sitemap generator to prevent login crashes
let generateSitemap;
try {
    const sitemapModule = await import('./sitemap.js');
    generateSitemap = sitemapModule.generateSitemap;
} catch (e) {
    console.error("sitemap.js not found. Sitemap automation disabled.", e);
}

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
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPassword').value;
        if (!email || !pass) return alert("Credentials required.");
        
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

        // Default to last 30 days
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        document.getElementById('dateStart').valueAsDate = start;
        document.getElementById('dateEnd').valueAsDate = end;

        loadAnalytics();
        loadAdminList();
    } else {
        if (dash) dash.classList.add('hidden');
        if (login) login.classList.remove('hidden');
    }
});

// --- 2. GITHUB API (SITEMAP & IMAGES) ---
const owner = "naveen200848";
const repo = "idigitalworks";

async function updateGithubSitemap() {
    const token = document.getElementById('githubToken').value;
    if (!token || !generateSitemap) return console.warn("Sitemap sync skipped.");

    try {
        const xml = await generateSitemap();
        const contentBase64 = btoa(unescape(encodeURIComponent(xml)));
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/sitemap.xml`;

        const getFile = await fetch(url, { headers: { Authorization: `token ${token}` } });
        const fileData = await getFile.json();
        
        await fetch(url, {
            method: "PUT",
            headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Update Sitemap", content: contentBase64, sha: fileData.sha, branch: "main" })
        });
    } catch (e) { console.error("GitHub Sync Error:", e); }
}

const uploadBtn = document.getElementById('uploadBtn');
if (uploadBtn) {
    uploadBtn.onclick = async () => {
        const file = document.getElementById('imageFile').files[0];
        const token = document.getElementById('githubToken').value;
        if (!file || !token) return alert("Token and file required.");

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const content = reader.result.split(',')[1];
            const fileName = `newsimages/${Date.now()}_${file.name}`;
            const api = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`;

            const res = await fetch(api, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Upload news image", content: content, branch: "main" })
            });
            if (res.ok) {
                const imgUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/${fileName}`;
                document.getElementById('postImage').value = imgUrl;
                alert("Image Uploaded Successfully!");
            }
        };
    };
}

// --- 3. ANALYTICS (TITLE CLICKS ONLY) ---
const applyDateBtn = document.getElementById('applyDateBtn');
if (applyDateBtn) applyDateBtn.onclick = () => loadAnalytics();

async function loadAnalytics() {
    const startVal = document.getElementById('dateStart').value;
    const endVal = document.getElementById('dateEnd').value;

    const startDate = startVal ? new Date(startVal) : new Date(Date.now() - 30*24*3600*1000);
    const endDate = endVal ? new Date(endVal) : new Date();
    // Set end date to end of day
    endDate.setHours(23,59,59,999);

    // AI NEWS ANALYTICS
    onSnapshot(collection(db, "news"), (snap) => {
        let total = 0;
        snap.forEach(d => total += (d.data().title_clicks || 0));
        const clicksEl = document.getElementById('stat-title-views');
        if (clicksEl) clicksEl.innerText = total;
        const postsEl = document.getElementById('stat-posts');
        if (postsEl) postsEl.innerText = snap.size;
    });

    const newsDiscQ = query(collection(db, "discovery"), where("timestamp", ">=", startDate), where("timestamp", "<=", endDate));
    const newsDiscSnap = await getDocs(newsDiscQ);
    const discEl = document.getElementById('stat-discovery');
    if (discEl) discEl.innerText = newsDiscSnap.size;

    // AI TOOLS ANALYTICS
    onSnapshot(collection(db, "ai_tools"), (snap) => {
        let totalClicks = 0;
        snap.forEach(d => totalClicks += (d.data().clicks || 0));
        const toolsEl = document.getElementById('stat-tools');
        if (toolsEl) toolsEl.innerText = snap.size;
        const toolClicksEl = document.getElementById('stat-tool-clicks');
        if (toolClicksEl) toolClicksEl.innerText = totalClicks;
    });

    try {
        const toolDiscQ = query(collection(db, "discovery_tools"), where("timestamp", ">=", startDate), where("timestamp", "<=", endDate));
        const toolDiscSnap = await getDocs(toolDiscQ);
        const toolDiscEl = document.getElementById('stat-tool-discovery');
        if (toolDiscEl) toolDiscEl.innerText = toolDiscSnap.size;
    } catch(e) { console.log("Tools discovery collection might be empty/missing"); }
}

// --- 4. ADMIN MANAGEMENT (EDIT/DELETE) ---
function loadAdminList() {
    const adminFeed = document.getElementById('admin-feed');
    if (adminFeed) {
        onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
            adminFeed.innerHTML = '';
            snap.forEach(d => {
                const p = d.data();
                const ageH = (Date.now() - (p.date?.seconds * 1000)) / 3600000;
                const status = (ageH > 24 || p.title_clicks > 10) ? 'status-indexed' : 'status-pending';
                adminFeed.innerHTML += `
                    <div class="admin-post-item">
                        <span><span class="index-status ${status}"></span> ${p.title}</span>
                        <div>
                            <button onclick="editPost('${d.id}', \`${p.title.replace(/'/g, "\\'")}\`, \`${p.content.replace(/'/g, "\\'").replace(/\n/g, '\\n')}\`, '${p.image}', '${p.link || ''}', '${p.redirectUrl || ''}')">Edit</button>
                            <button onclick="deletePost('${d.id}')" style="color:red; background:none; margin-left:10px;">Delete</button>
                        </div>
                    </div>`;
            });
        });
    }

    const adminToolsFeed = document.getElementById('admin-tools-feed');
    if (adminToolsFeed) {
        onSnapshot(query(collection(db, "ai_tools"), orderBy("date", "desc")), (snap) => {
            adminToolsFeed.innerHTML = '';
            snap.forEach(d => {
                const p = d.data();
                adminToolsFeed.innerHTML += `
                    <div class="admin-post-item">
                        <div style="display:flex; align-items:center; gap:10px;">
                            ${p.image ? `<img src="${p.image}" style="width:30px; height:30px; border-radius:4px; object-fit:cover;">` : ''}
                            <span>${p.title} <small style="color:#888;">(${p.category || 'Uncategorized'})</small></span>
                        </div>
                        <div>
                            <button onclick="editTool('${d.id}', \`${p.title.replace(/'/g, "\\'")}\`, \`${p.description.replace(/'/g, "\\'").replace(/\n/g, '\\n')}\`, '${p.link}', '${p.category || ''}', '${p.image || ''}')">Edit</button>
                            <button onclick="deleteTool('${d.id}')" style="color:red; background:none; margin-left:10px;">Delete</button>
                        </div>
                    </div>`;
            });
        });
    }
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

window.editTool = (id, title, description, link, category, image) => {
    window.currentToolEditId = id;
    document.getElementById('editToolTitle').value = title;
    document.getElementById('editToolDesc').value = description;
    document.getElementById('editToolLink').value = link;
    document.getElementById('editToolCategory').value = category;
    document.getElementById('editToolImage').value = image;
    document.getElementById('editToolModal').classList.remove('hidden');
};

const saveEditBtn = document.getElementById('saveEditBtn');
if (saveEditBtn) {
    saveEditBtn.onclick = async () => {
        try {
            await updateDoc(doc(db, "news", window.currentEditId), {
                title: document.getElementById('editTitle').value,
                content: document.getElementById('editContent').value,
                image: document.getElementById('editImage').value,
                link: document.getElementById('editLink').value,
                redirectUrl: document.getElementById('editRedirect').value
            });
            await updateGithubSitemap();
            alert("Post Updated!");
            document.getElementById('editModal').classList.add('hidden');
        } catch (e) { alert("Save Failed: " + e.message); }
    };
}

const saveToolBtn = document.getElementById('saveToolBtn');
if (saveToolBtn) {
    saveToolBtn.onclick = async () => {
        try {
            await updateDoc(doc(db, "ai_tools", window.currentToolEditId), {
                title: document.getElementById('editToolTitle').value,
                description: document.getElementById('editToolDesc').value,
                link: document.getElementById('editToolLink').value,
                category: document.getElementById('editToolCategory').value,
                image: document.getElementById('editToolImage').value
            });
            alert("Tool Updated!");
            document.getElementById('editToolModal').classList.add('hidden');
        } catch (e) { alert("Save Failed: " + e.message); }
    };
}

window.deletePost = async (id) => { 
    if(confirm("Delete permanently?")) {
        await deleteDoc(doc(db, "news", id));
        await updateGithubSitemap();
    }
};

window.deleteTool = async (id) => {
    if(confirm("Delete permanently?")) {
        await deleteDoc(doc(db, "ai_tools", id));
    }
};

// --- 5. PUBLISH ---
const publishBtn = document.getElementById('publishBtn');
if (publishBtn) {
    publishBtn.onclick = async () => {
        publishBtn.innerText = "Processing...";
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
            alert("Published & GitHub Sitemap Updated!");
            location.reload();
        } catch(e) { alert(e.message); publishBtn.innerText = "Publish & Update Sitemap"; }
    };
}

const publishToolBtn = document.getElementById('publishToolBtn');
if (publishToolBtn) {
    publishToolBtn.onclick = async () => {
        publishToolBtn.innerText = "Processing...";
        try {
            await addDoc(collection(db, "ai_tools"), {
                title: document.getElementById('toolTitle').value,
                description: document.getElementById('toolDesc').value,
                link: document.getElementById('toolLink').value,
                category: document.getElementById('toolCategory').value,
                image: document.getElementById('toolImage').value,
                clicks: 0, date: serverTimestamp()
            });
            alert("AI Tool Published!");
            location.reload();
        } catch(e) { alert(e.message); publishToolBtn.innerText = "Publish AI Tool"; }
    };
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.onclick = () => signOut(auth).then(() => location.reload());
