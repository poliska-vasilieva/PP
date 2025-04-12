document.addEventListener('DOMContentLoaded', () => {
    const articleForm = document.getElementById('articleForm');
    const articleList = document.getElementById('articleList');

    // Функция для загрузки статей
    const loadArticles = async () => {
        const response = await fetch('/api/articles');
        const articles = await response.json();
        articleList.innerHTML = '';
        articles.forEach(article => {
            const li = document.createElement('li');
            li.classList.add('article__li');
            li.innerHTML = `
            ${article.image ? `<img src="/uploads/${article.image}" alt="${article.title}" style="width: 100px;">` : ''}
                        <h3>${article.title}</h3>
                        <p>${article.content}</p> 
                        <button onclick="deleteArticle(${article.id})">Delete</button>
                        <button onclick="editArticle(${article.id}, '${article.title}', '${article.content}')">Edit</button>
                    `;
            articleList.appendChild(li);
        });
    };

    // Функция для добавления статьи
    articleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(articleForm);
        await fetch(`/api/articles`, {
            method: 'POST',
            body: formData,
        });
        articleForm.reset();
        loadArticles();
    });

    // Функция для удаления статьи
    window.deleteArticle = async (id) => {
        await fetch(`/api/articles/${id}`, {
            method: 'DELETE',
        });
        loadArticles();
    };

    // Функция для редактирования статьи
    window.editArticle = (id, title, content) => {
        const formData = new FormData(articleForm);
        articleForm.elements['title'].value = title;
        articleForm.elements['content'].value = content;
        articleForm.onsubmit = async (e) => {
            e.preventDefault();
            await fetch(`/api/articles/${id}`, {
                method: 'PUT',
                body: formData,
            });
            articleForm.reset();
            loadArticles();
        };
    };

    loadArticles();
});