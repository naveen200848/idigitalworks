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

// --- 1. AUTHENTICATION & DASHBOARD TOGGLE ---
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.onclick = () => {
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPassword').value;
        if (!email || !pass) return alert("Enter both email and password.");
        
        signInWithEmailAndPassword(auth, email, pass)
            .then(() => console.log("Login Successful"))
            .catch(err => alert("Login Failed: " + err.message));
    };
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.onclick = () => signOut(auth).then(() => location.reload());
}

onAuthStateChanged(auth, (user) => {
    const dash = document.getElementById('admin-dashboard');
    const loginSec = document.getElementById('login-section');
    
    if (user) {
        if (dash) dash.classList.remove('hidden');
        if (loginSec) loginSec.classList.add('hidden');
        
        // Load Saved Token if available
        const savedToken = localStorage.getItem('gh_token');
        if (savedToken && document.getElementById('githubToken')) {
            document.getElementById('githubToken').value = savedToken;
            document.getElementById('rememberToken').checked = true;
        }

        // LOAD DASHBOARD STATS
        onSnapshot(query(collection(db, "news")), (snap) => {
            let v = 0, s = 0;
            snap.forEach(d => { v += (d.data().views || 0); s += (d.data().shares || 0); });
            if (document.getElementById('stat-views')) document.getElementById('stat-views').innerText = v;
            if (document.getElementById('stat-shares')) document.getElementById('stat-shares').innerText = s;
            if (document.getElementById('stat-posts')) document.getElementById('stat-posts').innerText = snap.size;
        });
    } else {
        if (dash) dash.classList.add('hidden');
        if (loginSec) loginSec.classList.remove('hidden');
    }
});

// --- 2. GITHUB UPLOAD ---
const uploadBtn = document.getElementById('uploadBtn');
if (uploadBtn) {
    uploadBtn.onclick = async () => {
        const file = document.getElementById('imageFile').files[0];
        const token = document.getElementById('githubToken').value;
        if (!file || !token) return alert("Need file and GitHub token.");

        if (document.getElementById('rememberToken').checked) localStorage.setItem('gh_token', token);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const content = reader.result.split(',')[1];
            const fileName = `newsimages/${Date.now()}_${file.name}`;
            const api = `https://api.github.com/repos/naveen200848/idigitalworks/contents/${fileName}`;

            const res = await fetch(api, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Upload", content: content, branch: "main" })
            });
            if (res.ok) {
                const url = `https://cdn.jsdelivr.net/gh/naveen200848/idigitalworks@main/${fileName}`;
                document.getElementById('postImage').value = url;
                alert("Image Uploaded Successfully!");
            }
        };
    };
}

// --- 3. PUBLISH & MANAGE ---
const publishBtn = document.getElementById('publishBtn');
if (publishBtn) {
    publishBtn.onclick = async () => {
        await addDoc(collection(db, "news"), {
            title: document.getElementById('postTitle').value,
            content: document.getElementById('postContent').value,
            image: document.getElementById('postImage').value,
            link: document.getElementById('postLink').value,
            views: 0, shares: 0, date: serverTimestamp()
        });
        alert("Published!"); location.reload();
    };
}

// --- 4. RENDER ADMIN LIST ---
const adminFeed = document.getElementById('admin-feed');
if (adminFeed) {
    onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
        adminFeed.innerHTML = '';
        snap.forEach(d => {
            const p = d.data(); const id = d.id;
            const cleanC = p.content.replace(/`/g, "'").replace(/"/g, '&quot;');
            const row = document.createElement('div');
            row.className = "admin-post-item";
            row.innerHTML = `<span>${p.title}</span><div>
                <button onclick="editPost('${id}', \`${p.title}\`, \`${cleanC}\`, '${p.image}', '${p.link}')" style="background:#eee;">Edit</button>
                <button onclick="deletePost('${id}')" style="color:#ff3b30; background:none; margin-left:10px;">Delete</button>
            </div>`;
            adminFeed.appendChild(row);
        });
    });
}

// --- 5. EDIT & DELETE GLOBALS ---
let currentEditId = null;
window.editPost = (id, t, c, i, l) => {
    currentEditId = id;
    document.getElementById('editTitle').value = t;
    document.getElementById('editContent').value = c;
    document.getElementById('editImage').value = i;
    document.getElementById('editLink').value = l;
    document.getElementById('editModal').classList.remove('hidden');
};

const saveEditBtn = document.getElementById('saveEditBtn');
if (saveEditBtn) {
    saveEditBtn.onclick = async () => {
        await updateDoc(doc(db, "news", currentEditId), {
            title: document.getElementById('editTitle').value,
            content: document.getElementById('editContent').value,
            image: document.getElementById('editImage').value,
            link: document.getElementById('editLink').value
        });
        alert("Updated Successfully!");
        document.getElementById('editModal').classList.add('hidden');
    };
}

window.deletePost = async (id) => { if (confirm("Delete this post permanently?")) await deleteDoc(doc(db, "news", id)); };
