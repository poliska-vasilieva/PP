function handleRoleBasedButtons(userRole) {
    const teacherButtonOne = document.getElementById('teacherButtonOne');
    const teacherButtonTwo = document.getElementById('teacherButtonTwo');
    const teacherButtonFree = document.getElementById('teacherButtonFree');
    const studentButton = document.getElementById('studentButton');
    const adminButton = document.getElementById('adminButton');

    teacherButtonOne.style.display = 'none';
    teacherButtonTwo.style.display = 'none';
    teacherButtonFree.style.display = 'none';
    studentButton.style.display = 'none';
    adminButton.style.display = 'none';

    if (userRole === 'teacher') {
        teacherButtonOne.style.display = 'block';
        teacherButtonTwo.style.display = 'block';
        teacherButtonFree.style.display = 'block';
    } else if (userRole === 'student') {
        studentButton.style.display = 'block';
    } else if (userRole === 'admin') {
        adminButton.style.display = 'block';
    }
}
function decodeToken(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
        console.error('Ошибка декодирования токена:', error);
        return {};
    }
}

function setupRoleButtons(role) {
    const roles = ['teacher', 'student', 'admin'];
    roles.forEach(r => {
        const btn = document.getElementById(`${r}Button`);
        if (btn) btn.style.display = r === role ? 'block' : 'none';
    });
}

async function saveProfile(token) {
    const nickname = document.getElementById('nickname').value;
    const email = document.getElementById('email').value;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    if (!nickname || !email) {
        alert('Имя и электронная почта обязательны');
        return;
    }

    try {
        const response = await fetch('/updateProfile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nickname, email, currentPassword, newPassword })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ошибка при обновлении');

        alert('Данные успешно обновлены');
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message || 'Произошла ошибка');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        const decoded = decodeToken(token);
        handleRoleBasedButtons(decoded.role);

        // Загрузка данных профиля
        const response = await fetch('/profile/data', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Ошибка загрузки профиля');

        const userData = await response.json();
        document.getElementById('nickname').value = userData.nickname || '';
        document.getElementById('email').value = userData.email || '';

        // Обработчики для кнопок ролей
        if (decoded.role === 'teacher') {
            document.getElementById('teacherButtonOne').addEventListener('click', () => {
                window.location.href = '/create__collection.html';
            });
            document.getElementById('teacherButtonTwo').addEventListener('click', () => {
                window.location.href = '/students.html';
            });
            document.getElementById('teacherButtonFree').addEventListener('click', () => {
                window.location.href = '/creating__article.html';
            });
        }
        if (decoded.role === 'student') {
            await loadTestHistory();
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка загрузки страницы');
    }
});

async function fetchUserProfile(token) {
    try {
        const decoded = decodeToken(token);
        const response = await fetch('/profile/data', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            document.getElementById('nickname').value = userData.nickname || '';
            document.getElementById('email').value = userData.email || '';
            
            // Скрываем группу для преподавателей и администраторов
            const groupInfo = document.getElementById('groupInfo');
            if (decoded.role === 'teacher' || decoded.role === 'admin') {
                groupInfo.style.display = 'none';
            } else {
                document.getElementById('groupDisplay').textContent = userData.group || 'Не указана';
                groupInfo.style.display = 'block';
            }
        }
        else {
            console.error("Ошибка при получении данных профиля:", response.status);
        }
    } catch (error) {
        console.error("Ошибка при запросе данных профиля:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const saveButton = document.getElementById('saveButton');
    const logoutButton = document.getElementById('ButtonLogOut');

    if (token) {
        const decoded = decodeToken(token);
        handleRoleBasedButtons(decoded.role);
        fetchUserProfile(token);

        // Остальные обработчики кнопок остаются без изменений
        document.getElementById('teacherButtonOne').addEventListener('click', () => {
            window.location.href = '/create__collection.html';
        });

        document.getElementById('studentButton').addEventListener('click', () => {
            window.location.href = '/main.html';
        });

        document.getElementById('adminButton').addEventListener('click', () => {
            window.location.href = '/users.html';
        });

        // Загружаем историю тестов только для студентов
        if (decoded.role === 'student') {
            loadTestHistory();
        } else {
            // Скрываем раздел истории для преподавателей и администраторов
            document.getElementById('testHistory').style.display = 'none';
            document.querySelector('.h3_history').style.display = 'none';
        }
    }

    saveButton.addEventListener('click', async () => {
        const nickname = document.getElementById('nickname').value;
        const email = document.getElementById('email').value;
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const group = document.getElementById('group').value;


        if (!nickname || !email) {
            alert('Имя и электронная почта обязательны для заполнения');
            return;
        }

        try {
            const response = await fetch('/updateProfile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nickname, email, currentPassword, newPassword, group })
            });

            if (response.ok) {
                alert('Данные успешно обновлены');
            } else if (response.status === 403) {
                alert('Неверный текущий пароль');
            } else if (response.status === 404) {
                alert('Пользователь не найден');
            } else {
                const data = await response.json();
                alert(data.message || 'Ошибка при обновлении данных');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при соединении с сервером');
        }
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    });
});

async function loadTestHistory() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = decodeToken(token);
    if (decoded.role === 'admin') {
        document.getElementById('testHistory').style.display = 'none';
        document.querySelector('.h3_history').style.display = 'none';
        return;
    } else {
        document.getElementById('testHistory').style.display = 'flex';
        document.querySelector('.h3_history').style.display = 'flex';
    }

    try {
        const response = await fetch('/test-results', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const history = await response.json();
            displayTestHistory(history);
        }
    } catch (error) {
        console.error('Ошибка при загрузке истории тестов:', error);
    }
}

function displayTestHistory(history) {
    const historyContainer = document.getElementById('testHistory');
    if (!historyContainer) return;

    if (history.length === 0) {
        historyContainer.innerHTML = '<p class="p_history">Нет данных о прошлых тестах</p>';
        return;
    }

    historyContainer.innerHTML = '';

    history.forEach((test, index) => {
        const testElement = document.createElement('div');
        testElement.className = 'test-result';
        testElement.innerHTML = `
          <p class="p_history"><strong>Тест ${index + 1}:</strong> ${test.Collection?.title || 'Неизвестная коллекция'}</p>
          <p class="p_history"><strong>Дата: </strong>${new Date(test.createdAt).toLocaleString()}</p>
          <p class="p_history"><strong>Правильно: </strong>${test.correctCount}, <strong>Неправильно: </strong>${test.incorrectCount}</p>
      `;
        if (test.incorrectWords && test.incorrectWords.length > 0) {
            const wordsList = document.createElement('ul');
            test.incorrectWords.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `${item.word} - ${item.translation}`;
                wordsList.appendChild(li);
            });
            testElement.appendChild(wordsList);
        }
        historyContainer.appendChild(testElement);
    });
}

const TestManager = {
    currentCards: [],
    currentIndex: 0,
    results: { correct: 0, incorrect: 0, wrongWords: [] },

    async loadCards(collectionId) {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const response = await fetch(`/collections/${collectionId}/check`, { headers });
        if (!response.ok) throw new Error('Ошибка загрузки карточек');

        this.currentCards = await response.json();
        this.currentIndex = 0;
        this.results = { correct: 0, incorrect: 0, wrongWords: [] };
        return this.currentCards.length > 0;
    },

    getCurrentCard() {
        return this.currentCards[this.currentIndex];
    },

    recordAnswer(isCorrect) {
        const card = this.getCurrentCard();
        if (isCorrect) {
            this.results.correct++;
        } else {
            this.results.incorrect++;
            this.results.wrongWords.push({
                word: card.word,
                translation: card.translation
            });
        }
        this.currentIndex++;
    },

    async saveResults(collectionId) {
        const token = localStorage.getItem('token');
        if (!token) return;

        await fetch('/test-results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                collectionId,
                correctCount: this.results.correct,
                incorrectCount: this.results.incorrect,
                incorrectWords: this.results.wrongWords
            })
        });
    }
};

async function loadCollections() {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const response = await fetch('/collections', { headers });
        if (!response.ok) throw new Error('Ошибка при загрузке коллекций');

        const collections = await response.json();
        renderCollections(collections, token);
    } catch (error) {
        console.error('Ошибка:', error);
        showError(error.message);
    }
}

function renderCollections(collections, token) {
    const collectionList = document.getElementById('collectionList');
    if (!collectionList) return;

    collectionList.innerHTML = collections.map(collection => `
        <li>
            <h3>${collection.title}</h3>
            <p>${collection.description || 'Без описания'}</p>
            <button onclick="startTest(${collection.id})">Начать тест</button>
            ${token && decodeToken(token).role === 'student' && collection.isPublic ?
            `<button onclick="cloneCollection(${collection.id})">Добавить в избранное</button>` : ''}
        </li>
    `).join('');
}

async function startTest(collectionId) {
    try {
        const hasCards = await TestManager.loadCards(collectionId);
        if (!hasCards) {
            alert('В этой коллекции нет карточек');
            return;
        }

        document.getElementById('collectionList').style.display = 'none';
        document.getElementById('checkSection').style.display = 'block';
        showNextCard();
    } catch (error) {
        console.error('Ошибка:', error);
        showError(error.message);
    }
}

function showNextCard() {
    if (TestManager.currentIndex < TestManager.currentCards.length) {
        const card = TestManager.getCurrentCard();
        document.getElementById('checkCard').textContent = card.word;
        document.getElementById('translation').textContent = '';
    } else {
        finishTest();
    }
}

async function finishTest() {
    await TestManager.saveResults(TestManager.currentCollectionId);

    const stats = `Правильно: ${TestManager.results.correct}\nНеправильно: ${TestManager.results.incorrect}`;
    alert(stats);
    document.getElementById('checkSection').style.display = 'none';
    document.getElementById('collectionList').style.display = 'block';
    loadCollections();
}

window.onload = function () {
    loadCollections();
    if (localStorage.getItem('token')) {
        loadTestHistory();
    }
};