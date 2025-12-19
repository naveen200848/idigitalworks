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

// --- GITHUB UPLOAD ---
const uploadBtn = document.getElementById('uploadBtn');
if (uploadBtn) {
    uploadBtn.onclick = async () => {
        const file = document.getElementById('imageFile').files[0];
        const token = document.getElementById('githubToken').value;
        if (!file || !token) return alert("Select file and enter token!");
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
                alert("Image Uploaded to GitHub!");
            }
        };
    };
}

// --- READER & SHARING ---
window.openReader = (title, content, image, link) => {
    const reader = document.getElementById('readerView');
    const body = document.getElementById('readerBody');
    const shareText = encodeURIComponent(`Check out this AI Update: ${title}`);
    const shareUrl = encodeURIComponent(window.location.href);

    body.innerHTML = `
        <h1>${title}</h1>
        <div class="share-bar">
            <a href="https://wa.me/?text=${shareText}%20${shareUrl}" target="_blank" class="share-btn wa">WhatsApp</a>
            <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" class="share-btn tw">Twitter</a>
        </div>
        ${image ? `<img src="${image}">` : ''}
        <p>${content}</p>
        ${link ? `<a href="${link}" target="_blank" style="display:block; margin-top:20px; color:#0071e3;">External Source →</a>` : ''}
    `;
    reader.style.display = 'block';
    document.body.style.overflow = 'hidden';
};

const closeReader = document.getElementById('closeReader');
if (closeReader) {
    closeReader.onclick = () => {
        document.getElementById('readerView').style.display = 'none';
        document.body.style.overflow = 'auto';
    };
}

// --- AUTH & DASHBOARD ---
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.onclick = () => signInWithEmailAndPassword(auth, document.getElementById('loginEmail').value, document.getElementById('loginPassword').value).catch(e => alert(e.message));
}
if(document.getElementById('logoutBtn')) document.getElementById('logoutBtn').onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    const dash = document.getElementById('admin-dashboard');
    const login = document.getElementById('login-section');
    if (user) { 
        dash?.classList.remove('hidden'); 
        login?.classList.add('hidden'); 
        const saved = localStorage.getItem('gh_token');
        if(saved && document.getElementById('githubToken')) document.getElementById('githubToken').value = saved;
    } else { 
        dash?.classList.add('hidden'); 
        login?.classList.remove('hidden'); 
    }
});

// --- PUBLISH & SYNC ---
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

const publicFeed = document.getElementById('news-feed');
const adminFeed = document.getElementById('admin-feed');

onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
    if (publicFeed) publicFeed.innerHTML = '';
    if (adminFeed) adminFeed.innerHTML = '';
    snap.forEach(d => {
        const p = d.data(); const id = d.id;
        if (publicFeed) {
            publicFeed.innerHTML += `
                <div class="news-card" onclick="openReader(\`${p.title}\`, \`${p.content.replace(/`/g, "'")}\`, '${p.image}', '${p.link}')">
                    ${p.image ? `<img src="${p.image}">` : ''}
                    <h3>${p.title}</h3>
                    <p>${p.content}</p>
                </div>`;
        }
        if (adminFeed) {
            const el = document.createElement('div'); el.style = "padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;";
            el.innerHTML = `<span>${p.title}</span> <div><button onclick="editPost('${id}', \`${p.title}\`, \`${p.content.replace(/`/g, "'")}\`, '${p.image}', '${p.link}')">Edit</button> <button onclick="deletePost('${id}')" style="color:red">Delete</button></div>`;
            adminFeed.appendChild(el);
        }
    });
});

// --- EDIT LOGIC (FIXED) ---
let editId = null;
window.editPost = (id, t, c, i, l) => {
    editId = id; 
    document.getElementById('editTitle').value = t; 
    document.getElementById('editContent').value = c;
    document.getElementById('editImage').value = i; 
    document.getElementById('editLink').value = l;
    document.getElementById('editModal').classList.remove('hidden');
};

document.getElementById('saveEditBtn').onclick = async () => {
    const postRef = doc(db, "news", editId);
    await updateDoc(postRef, {
        title: document.getElementById('editTitle').value,
        content: document.getElementById('editContent').value,
        image: document.getElementById('editImage').value,
        link: document.getElementById('editLink').value
    });
    alert("Article Republished!");
    document.getElementById('editModal').classList.add('hidden');
};

window.deletePost = async (id) => { if (confirm("Delete permanently?")) await deleteDoc(doc(db, "news", id)); };
