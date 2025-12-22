import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, increment, getDoc, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
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

// --- 1. DISCOVERY TRACKING ---
const trackDiscovery = async () => {
    const referrer = document.referrer;
    let source = "Direct / Social";
    if (referrer.includes('google.com')) source = "Google Search";
    if (referrer.includes('wa.me')) source = "WhatsApp";

    if (!sessionStorage.getItem('landed')) {
        await addDoc(collection(db, "discovery"), {
            source,
            timestamp: serverTimestamp(),
            path: window.location.pathname
        });
        sessionStorage.setItem('landed', 'true');
    }
};

// --- 2. FULL FEED RENDER (SEO VIEW) ---
const feed = document.getElementById('news-feed');
if (feed) {
    trackDiscovery();
    onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
        feed.innerHTML = '';
        snap.forEach(d => {
            const p = d.data();
            feed.innerHTML += `
                <article class="article-block">
                    <span class="article-meta">AI UPDATE • ${p.views || 0} READS</span>
                    <h2 onclick="openAndTrack('${d.id}', \`${p.title}\`, \`${p.content.replace(/"/g, '&quot;')}\`, '${p.image}')">${p.title}</h2>
                    ${p.image ? `<img src="${p.image}" alt="${p.title}">` : ''}
                    <div class="article-content">${p.content}</div>
                </article>`;
        });
    });
}

window.openAndTrack = async (id, title, content, image) => {
    await updateDoc(doc(db, "news", id), { views: increment(1) });
    // Scroll to top or open modal for focus
    const reader = document.getElementById('readerView');
    const body = document.getElementById('readerBody');
    if(!reader || !body) return;
    body.innerHTML = `<h1>${title}</h1>${image ? `<img src="${image}">` : ''}<div style="font-size:20px; line-height:1.8;">${content}</div>`;
    reader.style.display = 'block';
    window.history.pushState({id}, title, `?id=${id}`);
};

// --- 3. SITEMAP SUBMISSION ---
const indexBtn = document.getElementById('indexBtn');
if (indexBtn) {
    indexBtn.onclick = async () => {
        const xml = await generateSitemap();
        console.log("Sitemap Generated");
        window.open("https://search.google.com/search-console/sitemaps?resource_id=https://www.idigitalworks.com/", "_blank");
    };
}

// ... [Auth Login/Logout & Admin Feed Logic remain same as provided in previous stable version] ...
