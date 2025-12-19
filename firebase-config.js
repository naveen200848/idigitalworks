import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// PASTE YOUR FIREBASE SETTINGS HERE
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "iDigitalWorks-News.firebaseapp.com",
  projectId: "idigitalworks-new",
  storageBucket: "iDigitalWorks-News.appspot.com",
  messagingSenderId: "182576210440",
  appId: "1:182576210440:web:ada14cf66380ffa77f67bd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- LOGIC FOR ADMIN ---
const publishBtn = document.getElementById('publishBtn');
if(publishBtn) {
    publishBtn.onclick = async () => {
        const title = document.getElementById('postTitle').value;
        const content = document.getElementById('postContent').value;
        await addDoc(collection(db, "news"), { title, content, date: serverTimestamp() });
        alert("Published!");
    }
}

// --- LOGIC FOR PUBLIC PAGE ---
const feed = document.getElementById('news-feed');
if(feed) {
    const q = query(collection(db, "news"), orderBy("date", "desc"));
    onSnapshot(q, (snapshot) => {
        feed.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            feed.innerHTML += `
                <div class="news-card">
                    <span class="tag">AI UPDATE</span>
                    <h3>${data.title}</h3>
                    <p>${data.content}</p>
                </div>`;
        });
    });
}
