import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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

// --- 1. FULL PAGE READER + UNIQUE SHARING ---
window.openReader = (id, title, content, image, link) => {
    const reader = document.getElementById('readerView');
    const body = document.getElementById('readerBody');
    
    // Create Unique Share URL
    const uniqueUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;
    const shareText = encodeURIComponent(`iDigitalWorks AI Update: ${title}`);

    body.innerHTML = `
        <h1>${title}</h1>
        <div class="share-bar">
            <button onclick="copyToClipboard('${uniqueUrl}')" class="share-btn cp">🔗 Copy Link</button>
            <a href="https://wa.me/?text=${shareText}%20${encodeURIComponent(uniqueUrl)}" target="_blank" class="share-btn wa">WhatsApp</a>
            <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(uniqueUrl)}" target="_blank" class="share-btn tw">Twitter (X)</a>
        </div>
        ${image ? `<img src="${image}">` : ''}
        <div class="reader-text">${content}</div>
        ${link ? `<a href="${link}" target="_blank" style="color:#0071e3; font-weight:bold; font-size:18px;">Source Material →</a>` : ''}
    `;
    
    reader.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Update URL without refreshing so user can copy from address bar
    window.history.pushState({id}, title, `?id=${id}`);
};

window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        alert("Unique link copied! You can now share this specific article.");
    });
};

// --- 2. THE EDIT & REPUBLISH FIX ---
let editId = null;
window.editPost = (id, t, c, i, l) => {
    editId = id;
    document.getElementById('editTitle').value = t;
    document.getElementById('editContent').value = c;
    document.getElementById('editImage').value = i;
    document.getElementById('editLink').value = l;
    document.getElementById('editModal').classList.remove('hidden');
};

const saveBtn = document.getElementById('saveEditBtn');
if (saveBtn) {
    saveBtn.onclick = async () => {
        if (!editId) return;
        try {
            await updateDoc(doc(db, "news", editId), {
                title: document.getElementById('editTitle').value,
                content: document.getElementById('editContent').value,
                image: document.getElementById('editImage').value,
                link: document.getElementById('editLink').value
            });
            alert("Changes Republished Successfully!");
            document.getElementById('editModal').classList.add('hidden');
        } catch (e) { alert("Update Error: " + e.message); }
    };
}

// --- 3. RENDERING & AUTO-LOAD FROM URL ---
const publicFeed = document.getElementById('news-feed');
onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
    if (publicFeed) {
        publicFeed.innerHTML = '';
        snap.forEach(d => {
            const p = d.data();
            const id = d.id;
            const cleanContent = p.content.replace(/`/g, "'").replace(/"/g, '&quot;');
            
            publicFeed.innerHTML += `
                <div class="news-card" onclick="openReader('${id}', \`${p.title}\`, \`${cleanContent}\`, '${p.image}', '${p.link}')">
                    ${p.image ? `<img src="${p.image}">` : ''}
                    <h3>${p.title}</h3>
                    <p>${p.content}</p>
                </div>`;
        });
    }
    
    // Admin Feed Logic
    const adminFeed = document.getElementById('admin-feed');
    if (adminFeed) {
        adminFeed.innerHTML = '';
        snap.forEach(d => {
            const p = d.data(); const id = d.id;
            const cleanContent = p.content.replace(/`/g, "'").replace(/"/g, '&quot;');
            const el = document.createElement('div');
            el.style = "padding:12px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;";
            el.innerHTML = `<span>${p.title}</span> 
                <div>
                    <button onclick="editPost('${id}', \`${p.title}\`, \`${cleanContent}\`, '${p.image}', '${p.link}')" style="background:#eee; padding:5px 10px; border-radius:5px;">Edit</button>
                    <button onclick="deletePost('${id}')" style="color:red; margin-left:10px; background:none;">Delete</button>
                </div>`;
            adminFeed.appendChild(el);
        });
    }
});

// Auto-open article if URL has ?id=
window.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');
    if (postId) {
        const docRef = doc(db, "news", postId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const p = docSnap.data();
            window.openReader(docSnap.id, p.title, p.content, p.image, p.link);
        }
    }
});

// Close Reader & Reset URL
document.getElementById('closeReader').onclick = () => {
    document.getElementById('readerView').style.display = 'none';
    document.body.style.overflow = 'auto';
    window.history.pushState({}, '', window.location.pathname);
};

// ... [Keep your existing Auth/Login & GitHub Upload Logic here] ...
