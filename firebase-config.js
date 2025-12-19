import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, increment, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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

// --- 1. FIXED ANALYTICS TRACKER ---
window.trackAction = async (id, actionType) => {
    try {
        const postRef = doc(db, "news", id);
        if (actionType === 'view') {
            await updateDoc(postRef, { views: increment(1) });
        }
        if (actionType === 'share') {
            await updateDoc(postRef, { shares: increment(1) });
        }
    } catch (e) { console.error("Tracking failed:", e); }
};

// --- 2. UNIQUE URL & READER LOGIC ---
window.openAndTrack = (id, title, content, image, link) => {
    // Only track a view when the user intentionally clicks to read or open the post
    trackAction(id, 'view'); 
    
    const reader = document.getElementById('readerView');
    const body = document.getElementById('readerBody');
    if(!reader || !body) return;

    const uniqueUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;
    const shareText = encodeURIComponent(`iDigitalWorks AI Update: ${title}`);

    body.innerHTML = `
        <h1>${title}</h1>
        <div class="share-bar" style="margin:20px 0; border-y:1px solid #eee; padding:15px 0; display:flex; gap:10px;">
            <button onclick="copyAndTrack('${id}', '${uniqueUrl}')" style="background:#f5f5f7; border:1px solid #d2d2d7; padding:10px 20px; border-radius:50px; cursor:pointer; font-weight:600;">🔗 Copy Link</button>
            <a href="https://wa.me/?text=${shareText}%20${encodeURIComponent(uniqueUrl)}" target="_blank" onclick="trackAction('${id}', 'share')" style="background:#25D366; color:white; padding:10px 20px; border-radius:50px; text-decoration:none; font-weight:bold;">WhatsApp</a>
        </div>
        ${image ? `<img src="${image}" style="width:100%; border-radius:12px; margin-bottom:20px;">` : ''}
        <p style="white-space:pre-wrap; font-size:20px; line-height:1.8;">${content}</p>
        ${link ? `<a href="${link}" target="_blank" style="color:#0071e3; font-weight:bold;">Source →</a>` : ''}
    `;
    reader.style.display = 'block';
    document.body.style.overflow = 'hidden';
    window.history.pushState({id}, title, `?id=${id}`);
};

window.copyAndTrack = (id, url) => {
    navigator.clipboard.writeText(url);
    trackAction(id, 'share');
    alert("Unique link copied to clipboard!");
};

// --- 3. RENDER FEED (REMOVED AUTO-INCREMENT LOOP) ---
const publicFeed = document.getElementById('news-feed');
if (publicFeed) {
    onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
        publicFeed.innerHTML = '';
        snap.forEach(d => {
            const p = d.data(); const id = d.id;
            const cleanContent = p.content.replace(/`/g, "'").replace(/"/g, '&quot;');
            
            // NOTE: trackAction(id, 'view') is NOT called here anymore to prevent the loop
            publicFeed.innerHTML += `
                <article class="full-news-item" style="border-bottom:1px solid #eee; padding-bottom:40px; margin-bottom:40px;">
                    <span style="font-size:12px; font-weight:bold; color:#86868b; text-transform:uppercase;">${p.views || 0} READS</span>
                    <h2 onclick="openAndTrack('${id}', \`${p.title}\`, \`${cleanContent}\`, '${p.image}', '${p.link}')" style="cursor:pointer; font-family:serif; font-size:42px; margin:10px 0;">${p.title}</h2>
                    ${p.image ? `<img src="${p.image}" style="width:100%; border-radius:8px;">` : ''}
                    <p style="white-space:pre-wrap; font-size:19px; line-height:1.8;">${p.content}</p>
                </article>`;
        });
    });
}

// ... [Keep Auth, Login, and Edit Modal logic from previous turn, ensuring it uses the 'if' checks] ...
