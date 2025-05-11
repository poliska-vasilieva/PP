document.addEventListener('DOMContentLoaded', () => {
    const articleForm = document.getElementById('articleForm');
    const articleList = document.getElementById('articleList');
    const token = localStorage.getItem('token');

    // Проверка роли пользователя
    const decoded = token ? decodeToken(token) : {};
    const isTeacher = decoded.role === 'teacher';
    const isAdmin = decoded.role === 'admin';

    // Скрываем форму создания для не-учителей
    if (!isTeacher) {
        articleForm.style.display = 'none';
    }

    // Загрузка статей
    const loadArticles = async () => {
        try {
            const response = await fetch('/api/articles');
            if (!response.ok) throw new Error('Ошибка загрузки статей');
            
            const articles = await response.json();
            renderArticles(articles);
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить статьи');
        }
    };

    // Отображение статей
    const renderArticles = (articles) => {
        articleList.innerHTML = '';
        
        articles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.className = 'article-item';
            articleElement.innerHTML = `
                ${article.image ? `<img src="/uploads/${article.image}" alt="${article.title}">` : ''}
                <h3>${article.title}</h3>
                <p>${article.content}</p>
                ${isTeacher || isAdmin ? `
                    <div class="article-actions">
                        ${isTeacher ? `<button class="edit-btn" data-id="${article.id}">Редактировать</button>` : ''}
                        <button class="delete-btn" data-id="${article.id}">Удалить</button>
                    </div>
                ` : ''}
            `;
            articleList.appendChild(articleElement);
        });

        // Назначение обработчиков для кнопок
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteArticle);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', handleEditArticle);
        });
    };

    // Обработка создания/редактирования статьи
    articleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(articleForm);
        const articleId = articleForm.dataset.editId;
        const url = articleId ? `/api/articles/${articleId}` : '/api/articles';
        const method = articleId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Ошибка сохранения статьи');
            
            articleForm.reset();
            delete articleForm.dataset.editId;
            loadArticles();
            alert('Статья успешно сохранена');
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось сохранить статью');
        }
    });

    // Удаление статьи
    const handleDeleteArticle = async (e) => {
        const articleId = e.target.dataset.id;
        if (!confirm('Удалить эту статью?')) return;

        try {
            const response = await fetch(`/api/articles/${articleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Ошибка удаления статьи');
            
            loadArticles();
            alert('Статья удалена');
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось удалить статью');
        }
    };

    // Редактирование статьи
    const handleEditArticle = async (e) => {
        const articleId = e.target.dataset.id;
        
        try {
            const response = await fetch(`/api/articles/${articleId}`);
            if (!response.ok) throw new Error('Ошибка загрузки статьи');
            
            const article = await response.json();
            articleForm.elements['title'].value = article.title;
            articleForm.elements['content'].value = article.content;
            articleForm.dataset.editId = article.id;
            
            // Прокрутка к форме
            articleForm.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить статью для редактирования');
        }
    };

    // Вспомогательная функция для декодирования токена
    function decodeToken(token) {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (error) {
            return {};
        }
    }

    loadArticles();
});