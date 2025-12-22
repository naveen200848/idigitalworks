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

// --- GITHUB INTEGRATION (SITEMAP & IMAGES) ---
const repoOwner = "naveen200848";
const repoName = "idigitalworks";

async function pushSitemapToGitHub() {
    const token = document.getElementById('githubToken').value;
    if (!token) return alert("Enter GitHub Token to update sitemap.xml");

    const xmlContent = await generateSitemap();
    const encodedContent = btoa(unescape(encodeURIComponent(xmlContent)));
    const path = "sitemap.xml";
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;

    try {
        const getRes = await fetch(url, { headers: { "Authorization": `token ${token}` } });
        const getData = await getRes.json();
        const sha = getData.sha;

        const res = await fetch(url, {
            method: "PUT",
            headers: { "Authorization": `token ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "Automated Sitemap Update",
                content: encodedContent,
                sha: sha,
                branch: "main"
            })
        });

        if (res.ok) console.log("Sitemap.xml successfully pushed to GitHub.");
    } catch (e) { console.error("GitHub Sitemap Error:", e); }
}

// IMAGE UPLOAD LOGIC
const uploadBtn = document.getElementById('uploadBtn');
if (uploadBtn) {
    uploadBtn.onclick = async () => {
        const file = document.getElementById('imageFile').files[0];
        const token = document.getElementById('githubToken').value;
        if (!file || !token) return alert("Select file and enter GitHub token.");

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const content = reader.result.split(',')[1];
            const fileName = `newsimages/${Date.now()}_${file.name}`;
            const api = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${fileName}`;

            const res = await fetch(api, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Upload news image", content: content, branch: "main" })
            });
            if (res.ok) {
                const url = `https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}@main/${fileName}`;
                document.getElementById('postImage').value = url;
                alert("Image Uploaded Successfully!");
            }
        };
    };
}

// --- ADMIN MANAGEMENT (LIST, EDIT, DELETE) ---
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
                <span><span class="index-status ${status}"></span> ${p.title} <small>(ID: ${d.id})</small></span>
                <div>
                    <button onclick="editPost('${d.id}', \`${p.title.replace(/'/g, "\\'")}\`, \`${p.content.replace(/'/g, "\\'").replace(/\n/g, '\\n')}\`, '${p.image}', '${p.link}', '${p.redirectUrl || ''}')" style="background:#eee; margin-right:5px;">Edit</button>
                    <button onclick="deletePost('${d.id}')" style="color:red; background:none;">Delete</button>
                </div>`;
            adminFeed.appendChild(row);
        });
    });
}

let currentEditId = null;
window.editPost = (id, title, content, image, link, redirect) => {
    currentEditId = id;
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
        await updateDoc(doc(db, "news", currentEditId), {
            title: document.getElementById('editTitle').value,
            content: document.getElementById('editContent').value,
            image: document.getElementById('editImage').value,
            link: document.getElementById('editLink').value,
            redirectUrl: document.getElementById('editRedirect').value
        });
        await pushSitemapToGitHub();
        alert("Post Updated & Sitemap Refreshed!");
        document.getElementById('editModal').classList.add('hidden');
    };
}

window.deletePost = async (id) => { 
    if(confirm("Delete permanently?")) {
        await deleteDoc(doc(db, "news", id));
        await pushSitemapToGitHub();
    }
};

// --- PUBLISH ---
const publishBtn = document.getElementById('publishBtn');
if (publishBtn) {
    publishBtn.onclick = async () => {
        publishBtn.innerText = "Publishing & Syncing GitHub...";
        try {
            await addDoc(collection(db, "news"), {
                title: document.getElementById('postTitle').value,
                content: document.getElementById('postContent').value,
                image: document.getElementById('postImage').value,
                link: document.getElementById('postLink').value,
                redirectUrl: document.getElementById('redirectUrl').value,
                title_clicks: 0, date: serverTimestamp()
            });
            await pushSitemapToGitHub();
            alert("Success! Sitemap.xml has been updated on GitHub.");
            location.reload();
        } catch(e) { alert(e.message); publishBtn.innerText = "Publish & Push Sitemap to GitHub"; }
    };
}

// ... [Keep Login and Analytics logic same as previous working version] ...
