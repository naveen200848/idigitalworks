import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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

// --- GITHUB UPLOAD LOGIC ---
const uploadBtn = document.getElementById('uploadBtn');
if (uploadBtn) {
    uploadBtn.onclick = async () => {
        const file = document.getElementById('imageFile').files[0];
        const token = document.getElementById('githubToken').value;
        if (!file || !token) return alert("Select file and enter token!");

        if (document.getElementById('rememberToken').checked) {
            localStorage.setItem('gh_token', token);
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const content = reader.result.split(',')[1];
            const fileName = `newsimages/${Date.now()}_${file.name}`;
            const apiLink = `https://api.github.com/repos/naveen200848/idigitalworks/contents/${fileName}`;

            const res = await fetch(apiLink, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Upload", content: content, branch: "main" })
            });

            if (res.ok) {
                const rawUrl = `https://cdn.jsdelivr.net/gh/naveen200848/idigitalworks@main/${fileName}`;
                document.getElementById('postImage').value = rawUrl;
                document.getElementById('imagePreviewTarget').src = rawUrl;
                document.getElementById('imagePreviewContainer').style.display = "block";
                alert("GitHub Upload Successful!");
            }
        };
    };
}

// --- REMEMBER TOKEN ON LOAD ---
window.onload = () => {
    const saved = localStorage.getItem('gh_token');
    if (saved && document.getElementById('githubToken')) {
        document.getElementById('githubToken').value = saved;
        document.getElementById('rememberToken').checked = true;
    }
};

// --- AUTH LOGIC ---
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.onclick = () => {
        signInWithEmailAndPassword(auth, document.getElementById('loginEmail').value, document.getElementById('loginPassword').value).catch(e => alert(e.message));
    };
}
document.getElementById('logoutBtn').onclick = () => { localStorage.removeItem('gh_token'); signOut(auth); };

onAuthStateChanged(auth, (user) => {
    const dash = document.getElementById('admin-dashboard');
    const login = document.getElementById('login-section');
    if (user) { dash.classList.remove('hidden'); login.classList.add('hidden'); }
    else { dash.classList.add('hidden'); login.classList.remove('hidden'); }
});

// --- PUBLISH & MANAGE ---
const pubBtn = document.getElementById('publishBtn');
if (pubBtn) {
    pubBtn.onclick = async () => {
        await addDoc(collection(db, "news"), {
            title: document.getElementById('postTitle').value,
            content: document.getElementById('postContent').value,
            image: document.getElementById('postImage').value,
            link: document.getElementById('postLink').value,
            date: serverTimestamp()
        });
        alert("Published!"); location.reload();
    };
}

// --- FEED LOGIC (PUBLIC & ADMIN) ---
const publicFeed = document.getElementById('news-feed');
const adminFeed = document.getElementById('admin-feed');

onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
    if (publicFeed) publicFeed.innerHTML = '';
    if (adminFeed) adminFeed.innerHTML = '';
    snap.forEach(d => {
        const post = d.data(); const id = d.id;
        if (publicFeed) {
            publicFeed.innerHTML += `<div class="news-card">
                ${post.image ? `<img src="${post.image}">` : ''}
                <span class="tag">AI UPDATE</span>
                <h3>${post.title}</h3>
                <p>${post.content}</p>
                ${post.link ? `<a class="btn" href="${post.link}" target="_blank">Read More →</a>` : ''}
            </div>`;
        }
        if (adminFeed) {
            const el = document.createElement('div'); el.style = "padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;";
            el.innerHTML = `<span>${post.title}</span> <div><button onclick="editPost('${id}', \`${post.title}\`, \`${post.content}\`, '${post.image}', '${post.link}')">Edit</button> <button onclick="deletePost('${id}')" style="color:red">Delete</button></div>`;
            adminFeed.appendChild(el);
        }
    });
});

// --- EDIT & DELETE ---
let editId = null;
window.editPost = (id, t, c, i, l) => {
    editId = id; document.getElementById('editTitle').value = t; document.getElementById('editContent').value = c;
    document.getElementById('editImage').value = i; document.getElementById('editLink').value = l;
    document.getElementById('editModal').classList.remove('hidden');
};
document.getElementById('saveEditBtn').onclick = async () => {
    await updateDoc(doc(db, "news", editId), {
        title: document.getElementById('editTitle').value, content: document.getElementById('editContent').value,
        image: document.getElementById('editImage').value, link: document.getElementById('editLink').value
    });
    alert("Updated!"); document.getElementById('editModal').classList.add('hidden');
};
window.deletePost = async (id) => { if (confirm("Delete?")) await deleteDoc(doc(db, "news", id)); };
