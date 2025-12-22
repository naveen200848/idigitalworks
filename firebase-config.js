import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, increment, getDocs, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// IMPORTANT: Ensure sitemap.js is in the same folder
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

// --- PUBLISH & UPDATE SITEMAP LOGIC ---
const publishBtn = document.getElementById('publishBtn');
if (publishBtn) {
    publishBtn.onclick = async () => {
        // Disable button to prevent double-clicking while processing
        publishBtn.disabled = true;
        publishBtn.innerText = "Publishing...";

        try {
            const title = document.getElementById('postTitle').value;
            const content = document.getElementById('postContent').value;
            const image = document.getElementById('postImage').value;
            const link = document.getElementById('postLink').value; // Added missing link field

            if (!title || !content) {
                alert("Please enter at least a Headline and Content.");
                publishBtn.disabled = false;
                publishBtn.innerText = "Publish & Update Sitemap";
                return;
            }

            // 1. Save to Firestore
            await addDoc(collection(db, "news"), {
                title: title,
                content: content,
                image: image,
                link: link,
                title_clicks: 0,
                views: 0,
                date: serverTimestamp()
            });

            // 2. Refresh the Sitemap logic
            const xml = await generateSitemap();
            console.log("Sitemap updated with new post.");

            alert("Post Published Successfully! Sitemap data updated.");
            location.reload(); 

        } catch (error) {
            console.error("Publishing failed:", error);
            alert("Error publishing post: " + error.message);
            publishBtn.disabled = false;
            publishBtn.innerText = "Publish & Update Sitemap";
        }
    };
}

// --- INDEXING (SUBMIT TO GOOGLE) LOGIC ---
const indexBtn = document.getElementById('indexBtn');
if (indexBtn) {
    indexBtn.onclick = async () => {
        try {
            const xml = await generateSitemap();
            alert("New sitemap data generated! Opening Google Search Console for final submission.");
            // Opens the specific GSC sitemap tool for your domain
            window.open("https://search.google.com/search-console/sitemaps?resource_id=https://www.idigitalworks.com/", "_blank");
        } catch (error) {
            alert("Error generating sitemap: " + error.message);
        }
    };
}

// ... [Keep your existing Login and Discovery Tracking code here] ...
