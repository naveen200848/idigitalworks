onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snap) => {
    const publicFeed = document.getElementById('news-feed');
    const adminFeed = document.getElementById('admin-feed');

    if (publicFeed) publicFeed.innerHTML = '';
    if (adminFeed) adminFeed.innerHTML = '';

    snap.forEach(d => {
        const p = d.data();
        const id = d.id;
        const cleanContent = p.content.replace(/`/g, "'").replace(/"/g, '&quot;');

        // PUBLIC VIEW (ainews.html)
        if (publicFeed) {
            publicFeed.innerHTML += `
                <article class="full-news-item">
                    <span class="meta">AI Intelligence • ${p.views || 0} READS</span>
                    <h2 onclick="openAndTrack('${id}', \`${p.title}\`, \`${cleanContent}\`, '${p.image}', '${p.link}')">
                        ${p.title}
                    </h2>
                    ${p.image ? `<img src="${p.image}">` : ''}
                    <p>${p.content}</p>
                    ...
                </article>`;
        }

        // ADMIN VIEW (admin.html) - THIS RESTORES YOUR BUTTONS
        if (adminFeed) {
            const el = document.createElement('div');
            el.className = "admin-post-item";
            el.innerHTML = `
                <span>${p.title}</span>
                <div class="action-btns">
                    <button onclick="editPost('${id}', \`${p.title}\`, \`${cleanContent}\`, '${p.image}', '${p.link}')" style="background:#f5f5f7;">Edit</button>
                    <button onclick="deletePost('${id}')" style="color:#ff3b30; background:none; margin-left:10px;">Delete</button>
                </div>`;
            adminFeed.appendChild(el);
        }
    });
});
