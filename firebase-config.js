import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
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

// --- ADMIN: CREATE NEW POST ---
const publishBtn = document.getElementById('publishBtn');
if(publishBtn) {
    publishBtn.onclick = async () => {
        // Getting values from the Admin HTML inputs
        const titleVal = document.getElementById('postTitle').value;
        const contentVal = document.getElementById('postContent').value;
        const imageVal = document.getElementById('postImage').value;
        const linkVal = document.getElementById('postLink').value;

        if(!titleVal || !contentVal) {
            alert("Please fill in at least the Title and Content.");
            return;
        }

        try {
            // We save with these exact keys so ainews.html can read them
            await addDoc(collection(db, "news"), { 
                title: titleVal, 
                content: contentVal, 
                image: imageVal, 
                link: linkVal, 
                date: serverTimestamp() // Using 'date' as the key
            });
            alert("Published to iDigitalWorks!");
            location.reload();
        } catch (e) {
            console.error("Error adding document: ", e);
            alert("Error publishing: " + e.message);
        }
    }
}

// --- ADMIN: MANAGE POSTS ---
const adminFeed = document.getElementById('admin-feed');
if(adminFeed) {
    const q = query(collection(db, "news"), orderBy("date", "desc"));
    onSnapshot(q, (snapshot) => {
        adminFeed.innerHTML = '';
        snapshot.forEach(postDoc => {
            const post = postDoc.data();
            const id = postDoc.id;

            const postEl = document.createElement('div');
            postEl.className = "post-item"; // Matches your admin.html CSS
            postEl.style = "padding:15px; border:1px solid #ddd; border-radius:12px; margin-bottom:10px; background:#fafafa; display:flex; justify-content:space-between; align-items:center;";
            postEl.innerHTML = `
                <div>
                    <strong>${post.title}</strong>
                </div>
                <div>
                    <button onclick="editPost('${id}', '${post.title}')" style="background:#0071e3; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Edit</button>
                    <button onclick="deletePost('${id}')" style="background:#ff3b30; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; margin-left:10px;">Delete</button>
                </div>
            `;
            adminFeed.appendChild(postEl);
        });
    });
}

// --- GLOBAL FUNCTIONS FOR BUTTONS ---
window.deletePost = async (id) => {
    if(confirm("Are you sure you want to delete this post?")) {
        await deleteDoc(doc(db, "news", id));
    }
}

window.editPost = async (id, oldTitle) => {
    const newTitle = prompt("Enter new title:", oldTitle);
    if(newTitle && newTitle !== oldTitle) {
        await updateDoc(doc(db, "news", id), { title: newTitle });
    }
}

// --- PUBLIC: RENDER TO AINEWS.HTML ---
const publicFeed = document.getElementById('news-feed');
if(publicFeed) {
    const q = query(collection(db, "news"), orderBy("date", "desc"));
    onSnapshot(q, (snapshot) => {
        publicFeed.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            // This builds the card using the exact keys we saved above
            publicFeed.innerHTML += `
                <div class="news-card">
                    ${data.image ? `<img src="${data.image}" style="width:100%; height:180px; object-fit:cover; border-radius:16px; margin-bottom:15px;">` : ''}
                    <span class="tag">AI UPDATE</span>
                    <h3>${data.title}</h3>
                    <p style="color:#6e6e73; font-size:15px;">${data.content}</p>
                    ${data.link ? `<a href="${data.link}" target="_blank" style="color:#0066cc; text-decoration:none; font-weight:600; margin-top:10px; display:inline-block;">Learn more →</a>` : ''}
                </div>`;
        });
    });
}
