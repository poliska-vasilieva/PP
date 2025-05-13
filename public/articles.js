document.addEventListener('DOMContentLoaded', async () => {
    const articlesList = document.getElementById('articlesList');
    const token = localStorage.getItem('token');
    const decoded = token ? JSON.parse(atob(token.split('.')[1])) : {};
    const isAdmin = decoded.role === 'admin';

    try {
        const response = await fetch('/api/articles');
        if (!response.ok) throw new Error('Ошибка загрузки статей');

        const articles = await response.json();

        articlesList.innerHTML = articles.map(article => `
            <article class="article-card">
                ${article.image ? `<img src="/uploads/${article.image}" alt="${article.title}" class="article__img">` : ''}
                <div class="article__text">
                    <h3 class="article__title">${article.title}</h3>
                    <div class="article__p">${article.content}</div>
                </div>
                ${isAdmin ? `<button class="delete-article" data-id="${article.id}">Удалить</button>` : ''}
            </article>
        `).join('');

        // Обработка удаления для админа
        document.querySelectorAll('.delete-article').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Удалить эту статью?')) return;

                try {
                    const response = await fetch(`/api/articles/${btn.dataset.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) throw new Error('Ошибка удаления статьи');
                    btn.closest('.article-card').remove();
                    alert('Статья удалена');
                } catch (error) {
                    console.error('Ошибка:', error);
                    alert('Не удалось удалить статью');
                }
            });
        });

    } catch (error) {
        console.error('Ошибка:', error);
        articlesList.innerHTML = '<p>Не удалось загрузить статьи</p>';
    }
});
