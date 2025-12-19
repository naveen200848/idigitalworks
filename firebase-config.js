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

// --- AUTHENTICATION LOGIC ---
const loginBtn = document.getElementById('loginBtn');
if(loginBtn) {
    loginBtn.onclick = () => {
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPassword').value;
        signInWithEmailAndPassword(auth, email, pass).catch(err => alert(err.message));
    };
}

document.getElementById('logoutBtn').onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    const loginSec = document.getElementById('login-section');
    const adminDash = document.getElementById('admin-dashboard');
    if (user) {
        loginSec.classList.add('hidden');
        adminDash.classList.remove('hidden');
    } else {
        loginSec.classList.remove('hidden');
        adminDash.classList.add('hidden');
    }
});

// --- PUBLISH LOGIC ---
document.getElementById('publishBtn').onclick = async () => {
    const data = {
        title: document.getElementById('postTitle').value,
        content: document.getElementById('postContent').value,
        image: document.getElementById('postImage').value,
        link: document.getElementById('postLink').value,
        date: serverTimestamp()
    };
    await addDoc(collection(db, "news"), data);
    alert("Published!");
    location.reload();
};

// --- MANAGE & EDIT LOGIC ---
let currentEditId = null;

onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snapshot) => {
    const adminFeed = document.getElementById('admin-feed');
    if(!adminFeed) return;
    adminFeed.innerHTML = '';
    snapshot.forEach(postDoc => {
        const post = postDoc.data();
        const id = postDoc.id;
        const el = document.createElement('div');
        el.style = "padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;";
        el.innerHTML = `<span>${post.title}</span> 
            <div>
                <button onclick="openEditModal('${id}', \`${post.title}\`, \`${post.content}\`, '${post.image}', '${post.link}')" style="color:blue; cursor:pointer; background:none; border:none;">Edit</button>
                <button onclick="deletePost('${id}')" style="color:red; cursor:pointer; background:none; border:none; margin-left:10px;">Delete</button>
            </div>`;
        adminFeed.appendChild(el);
    });
});

window.openEditModal = (id, title, content, image, link) => {
    currentEditId = id;
    document.getElementById('editTitle').value = title;
    document.getElementById('editContent').value = content;
    document.getElementById('editImage').value = image;
    document.getElementById('editLink').value = link;
    document.getElementById('editModal').classList.remove('hidden');
};

window.closeEditModal = () => document.getElementById('editModal').classList.add('hidden');

document.getElementById('saveEditBtn').onclick = async () => {
    const postRef = doc(db, "news", currentEditId);
    await updateDoc(postRef, {
        title: document.getElementById('editTitle').value,
        content: document.getElementById('editContent').value,
        image: document.getElementById('editImage').value,
        link: document.getElementById('editLink').value
    });
    alert("Updated!");
    closeEditModal();
};

window.deletePost = async (id) => {
    if(confirm("Delete this?")) await deleteDoc(doc(db, "news", id));
};
