document.addEventListener('DOMContentLoaded', () => {
    const articleForm = document.getElementById('articleForm');
    const articleList = document.getElementById('articleList');

    // Функция для загрузки статей
    const loadArticles = async () => {
        try {
            const response = await fetch('/api/articles');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const articles = await response.json();
            articleList.innerHTML = '';
            articles.forEach(article => {
                const li = document.createElement('li');
                li.classList.add('article__li');
                li.innerHTML = `
                    ${article.image ? `<img src="/uploads/${article.image}" alt="${escapeHTML(article.title)}" style="width: 100px;">` : ''}
                    <h3>${escapeHTML(article.title)}</h3>
                    <p>${escapeHTML(article.content)}</p>
                    <button data-id="${article.id}" class="delete-btn">Удалить</button>
                    <button data-id="${article.id}" data-title="${escapeHTML(article.title)}" data-content="${escapeHTML(article.content)}" class="edit-btn">Редактировать</button>
                `;
                articleList.appendChild(li);
            });

            articleList.addEventListener('click', handleArticleActions);

        } catch (error) {
            console.error(`Ошибка при загрузке статей:, error`);
            displayErrorMessage('Не удалось загрузить статьи.'); // Покажем сообщение об ошибке
        }
    };

    // Функция для добавления статьи
    articleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(articleForm);
            const response = await fetch('/api/articles', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`); // Используем сообщение с сервера, если есть
            }

            articleForm.reset();
            loadArticles();
            displaySuccessMessage('Статья успешно создана!');

        } catch (error) {
            console.error(`Ошибка при создании статьи:, error`);
            displayErrorMessage('Не удалось создать статью.'); // Покажем сообщение об ошибке
        }
    });

    // Функция для обработки действий со статьями (удаление, редактирование)
    const handleArticleActions = async (event) => {
        const target = event.target;

        if (target.classList.contains('delete-btn')) {
            const id = target.dataset.id;
            try {
                const response = await fetch('/api/articles/${id}', {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                loadArticles();
                displaySuccessMessage('Статья успешно удалена!');

            } catch (error) {
                console.error(`Ошибка при удалении статьи:, error`);
                displayErrorMessage('Не удалось удалить статью.'); // Покажем сообщение об ошибке
            }
        } else if (target.classList.contains('edit-btn')) {
            const id = target.dataset.id;
            const title = target.dataset.title;
            const content = target.dataset.content;
            editArticle(id, title, content);
        }
    };

    // Функция для редактирования статьи
    const editArticle = (id, title, content) => {
        articleForm.elements['title'].value = title;
        articleForm.elements['content'].value = content;

        articleForm.dataset.editId = id;
        const submitButton = articleForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Сохранить';

        articleForm.removeEventListener('submit', articleForm.submitHandler);
        articleForm.submitHandler = async (e) => {
            e.preventDefault();
            try {
                const formData = new FormData(articleForm);
                const response = await fetch(`/api/articles/${id}`, {
                    method: 'PUT',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                articleForm.reset();
                delete articleForm.dataset.editId;
                submitButton.textContent = 'Создать';
                loadArticles();
                displaySuccessMessage('Статья успешно обновлена!');

            } catch (error) {
                console.error('Ошибка при редактировании статьи:', error);
                displayErrorMessage('Не удалось обновить статью.'); // Покажем сообщение об ошибке
            }
        };
        articleForm.addEventListener('submit', articleForm.submitHandler);
    };

    // Вспомогательная функция для экранирования HTML
    function escapeHTML(string) {
        return string.replace(/[&<>"']/g, function (m) {
            switch (m) {
                case '&':
                    return '&amp;';
                case '<':
                    return '&lt;';
                case '>':
                    return '&gt;';
                case '"':
                    return '&quot;';
                case "'":
                    return '&#039;';
                default:
                    return m;
            }
        });
    }

    // Вспомогательные функции для отображения сообщений (нужно реализовать в UI)
    function displaySuccessMessage(message) {
        // Реализуйте отображение сообщения об успехе (например, alert, toast)
        alert('Успех: ' + message);
    }

    function displayErrorMessage(message) {
        // Реализуйте отображение сообщения об ошибке (например, alert, toast)
        alert('Ошибка: ' + message);
    }

    loadArticles();
});