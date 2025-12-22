import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

export async function generateSitemap() {
    const db = getFirestore();
    const querySnapshot = await getDocs(query(collection(db, "news"), orderBy("date", "desc")));

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Core Static Pages
    ["index.html", "ainews.html", "whatsapp-automation.html","whatsapp-recovery.html"].forEach(page => {
        xml += `  <url>\n    <loc>https://www.idigitalworks.com/${page}</loc>\n    <priority>1.0</priority>\n  </url>\n`;
    });

    // Dynamic AI News
    querySnapshot.forEach((doc) => {
        const post = doc.data();
        const date = post.date ? new Date(post.date.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        xml += `  <url>\n    <loc>https://www.idigitalworks.com/ainews.html?id=${doc.id}</loc>\n    <lastmod>${date}</lastmod>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;
    return xml;
}
