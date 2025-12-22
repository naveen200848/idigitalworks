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

// --- 1. DISCOVERY (REFERRER & UTM) TRACKING ---
const trackDiscovery = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const utm_source = urlParams.get('utm_source') || 'Direct/Organic';
    const referrer = document.referrer || 'No Referrer';
    
    if (!sessionStorage.getItem('landed')) {
        await addDoc(collection(db, "discovery"), {
            source: utm_source,
            referrer: referrer,
            path: window.location.pathname,
            timestamp: serverTimestamp()
        });
        sessionStorage.setItem('landed', 'true');
    }
};

// Trigger Discovery tracking on landing (only for public news page)
if (window.location.pathname.includes('AINEWS.html')) {
    trackDiscovery();
}

// --- 2. TIME-FILTERED ANALYTICS ---
const loadFilteredStats = async (timeRange) => {
    const now = Date.now();
    let startTime;
    if (timeRange === '60m') startTime = now - (60 * 60 * 1000);
    else if (timeRange === '7d') startTime = now - (7 * 24 * 60 * 60 * 1000);
    else startTime = now - (30 * 24 * 60 * 60 * 1000);

    // Get Discovery Traffic
    const dq = query(collection(db, "discovery"), where("timestamp", ">=", new Date(startTime)));
    const dSnap = await getDocs(dq);
    if(document.getElementById('stat-discovery')) document.getElementById('stat-discovery').innerText = dSnap.size;

    // Update Discovery List
    const discList = document.getElementById('discovery-list');
    if (discList) {
        discList.innerHTML = '';
        dSnap.forEach(doc => {
            const data = doc.data();
            discList.innerHTML += `<div style="padding:5px; border-bottom:1px solid #eee;">
                <b>${data.source}</b> | Ref: ${data.referrer.substring(0, 30)}...
            </div>`;
        });
    }
};

const timeFilter = document.getElementById('timeFilter');
if (timeFilter) timeFilter.onchange = (e) => loadFilteredStats(e.target.value);

// --- 3. SITEMAP & GOOGLE SUBMISSION ---
const indexBtn = document.getElementById('indexBtn');
if (indexBtn) {
    indexBtn.onclick = async () => {
        const xml = await generateSitemap();
        console.log("Sitemap Generated:", xml);
        window.open("https://search.google.com/search-console/sitemaps?resource_id=https://www.idigitalworks.com/", "_blank");
    };
}

// --- 4. AUTH & DASHBOARD LOADING ---
onAuthStateChanged(auth, (user) => {
    const dash = document.getElementById('admin-dashboard');
    const login = document.getElementById('login-section');
    if (user) {
        if(dash) dash.classList.remove('hidden');
        if(login) login.classList.add('hidden');
        loadFilteredStats('30d'); // Initial load
        
        // Load Global Post Stats (Clicks on titles)
        onSnapshot(query(collection(db, "news")), (snap) => {
            let totalClicks = 0;
            snap.forEach(d => totalClicks += (d.data().title_clicks || 0));
            if(document.getElementById('stat-title-views')) document.getElementById('stat-title-views').innerText = totalClicks;
            if(document.getElementById('stat-posts')) document.getElementById('stat-posts').innerText = snap.size;
        });
    }
});

// --- 5. UPDATED TRACKING FOR NEWS PAGE ---
window.openAndTrack = async (id, title, content, image) => {
    // Increment specific title click views (as requested)
    await updateDoc(doc(db, "news", id), { title_clicks: increment(1) });
    // Open reader logic...
};

// ... [Existing Login, Publish, GitHub Upload, Edit, and Delete logic goes here] ...
