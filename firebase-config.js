import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// PASTE YOUR FIREBASE SETTINGS HERE
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "iDigitalWorks-News.firebaseapp.com",
  projectId: "idigitalworks-news",
  storageBucket: "iDigitalWorks-News.appspot.com",
  messagingSenderId: "182576210440",
  appId: "1:182576210440:web:ada14cf66380ffa77f67bd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- LOGIC FOR ADMIN ---
// --- CREATE NEW POST ---
const publishBtn = document.getElementById('publishBtn');
if(publishBtn) {
    publishBtn.onclick = async () => {
        const title = document.getElementById('postTitle').value;
        const content = document.getElementById('postContent').value;
        const image = document.getElementById('postImage').value;
        const link = document.getElementById('postLink').value;

        await addDoc(collection(db, "news"), { title, content, image, link, date: serverTimestamp() });
        alert("Published!");
        location.reload();
    }
}

// --- MANAGE POSTS (LOAD, EDIT, DELETE) ---
const adminFeed = document.getElementById('admin-feed');
if(adminFeed) {
    const q = query(collection(db, "news"), orderBy("date", "desc"));
    onSnapshot(q, (snapshot) => {
        adminFeed.innerHTML = '';
        snapshot.forEach(postDoc => {
            const post = postDoc.data();
            const id = postDoc.id;

            const postEl = document.createElement('div');
            postEl.style = "padding:15px; border:1px solid #ddd; border-radius:12px; margin-bottom:10px; background:#fafafa;";
            postEl.innerHTML = `
                <strong>${post.title}</strong>
                <div style="margin-top:10px;">
                    <button onclick="editPost('${id}', '${post.title}')" style="background:#0071e3; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Edit Title</button>
                    <button onclick="deletePost('${id}')" style="background:#ff3b30; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; margin-left:10px;">Delete</button>
                </div>
            `;
            adminFeed.appendChild(postEl);
        });
    });
}

// Attach functions to the window so the HTML buttons can see them
window.deletePost = async (id) => {
    if(confirm("Are you sure you want to delete this?")) {
        await deleteDoc(doc(db, "news", id));
    }
}

window.editPost = async (id, oldTitle) => {
    const newTitle = prompt("Enter new title:", oldTitle);
    if(newTitle) {
        await updateDoc(doc(db, "news", id), { title: newTitle });
    }
}
