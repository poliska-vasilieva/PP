window.onload = function () {
    document.getElementById('statisticsContainer').style.display = 'none';
    loadCollections();

    const token = localStorage.getItem('token');
    if (token) {
        const decoded = decodeToken(token);
        if (decoded.role === 'student') {
            loadTestHistory();
        }
    }
};

let currentCollectionId;
let currentCards = [];
let currentCardIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let testResults = [];
let allCollections = [];

async function loadCollections(searchTerm = '') {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
        // Загружаем только публичные коллекции
        const response = await fetch('/collections', {
            headers
        });

        if (!response.ok) {
            throw new Error('Ошибка при загрузке коллекций');
        }

        allCollections = await response.json();
        displayCollections(allCollections, searchTerm, token, false); // false - не избранные
    } catch (error) {
        console.error('Ошибка:', error);
        showError(error.message);
    }
}

function displayCollections(collections, searchTerm = '', token = null, showFavorites = false) {
    const collectionList = document.getElementById('collectionList');
    collectionList.innerHTML = '';

    // Устанавливаем значение в поле поиска
    document.getElementById('searchInput').value = searchTerm;

    // Обновляем табы (если пользователь авторизован)
    if (token) {
        const tabsContainer = document.getElementById('tabsContainer');
        tabsContainer.innerHTML = `
            <div class="tabs">
                <button class="tab-button ${!showFavorites ? 'active' : ''}" onclick="showRegularCollections()">Все коллекции</button>
                <button class="tab-button ${showFavorites ? 'active' : ''}" onclick="showFavoriteCollections()">Избранное</button>
            </div>
        `;
        tabsContainer.style.display = 'block';
    } else {
        document.getElementById('tabsContainer').style.display = 'none';
    }

    // Остальной код функции остается без изменений...
    // Фильтрация по поисковому запросу
    let filteredCollections = searchTerm 
        ? collections.filter(c => 
            c.title.toLowerCase().includes(searchTerm.toLowerCase()))
        : collections;

    // Если показываем избранное, фильтруем только приватные коллекции
    if (showFavorites) {
        filteredCollections = filteredCollections.filter(c => !c.isPublic);
    } else {
        // Иначе показываем только публичные
        filteredCollections = filteredCollections.filter(c => c.isPublic);
    }

    if (filteredCollections.length === 0) {
        const noResults = document.createElement('p');
        noResults.textContent = showFavorites ? 'Нет избранных коллекций' : 'Коллекции не найдены';
        collectionList.appendChild(noResults);
        return;
    }

    filteredCollections.forEach(collection => {
        const li = document.createElement('li');
        li.className = 'collection-item';
        li.innerHTML = `
            <h3 class="h3__main__title">${collection.title}</h3>
            <p class="p__main">${collection.description || 'Без описания'}</p>
            <div class="collection-buttons">
                <button class="btn-test" onclick="startTest(${collection.id})">Проверить знания</button>
                ${token && decodeToken(token).role === 'student' && !showFavorites ? 
                `<button class="btn-favorite" onclick="addToFavorites(${collection.id})">Добавить в избранное</button>` : ''}
                ${showFavorites ? 
                `<button class="btn-remove" onclick="removeFromFavorites(${collection.id})">Удалить из избранного</button>` : ''}
            </div>
        `;
        collectionList.appendChild(li);
    });
}

function searchCollections() {
    const token = localStorage.getItem('token');
    const searchTerm = document.getElementById('searchInput').value;
    const isFavoritesTab = document.querySelector('.tab-button:last-child')?.classList.contains('active');
    
    if (isFavoritesTab) {
        showFavoriteCollections();
    } else {
        displayCollections(allCollections, searchTerm, token, false);
    }
}

function showRegularCollections() {
    const token = localStorage.getItem('token');
    const searchTerm = document.getElementById('searchInput')?.value || '';
    displayCollections(allCollections, searchTerm, token, false);
}

async function showFavoriteCollections() {
    const token = localStorage.getItem('token');
    if (!token) {
        showError('Необходима авторизация');
        return;
    }

    try {
        const response = await fetch('/favorite-collections', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Ошибка при загрузке избранных коллекций');
        }

        const favorites = await response.json();
        const searchTerm = document.getElementById('searchInput')?.value || '';
        displayCollections(favorites, searchTerm, token, true); // true - это избранное
    } catch (error) {
        console.error('Ошибка:', error);
        showError(error.message);
    }
}

// Функция для удаления из избранного
async function removeFromFavorites(collectionId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showError('Необходима авторизация');
        return;
    }

    try {
        const response = await fetch(`/collections/${collectionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка при удалении из избранного');
        }

        showSuccess('Коллекция удалена из избранного');
        await showFavoriteCollections();
    } catch (error) {
        console.error('Ошибка:', error);
        showError(error.message);
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

async function addToFavorites(collectionId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showError('Необходима авторизация');
        return;
    }

    try {
        const response = await fetch(`/collections/${collectionId}/clone`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка при добавлении в избранное');
        }

        showSuccess('Коллекция добавлена в избранное');
        loadCollections();
    } catch (error) {
        console.error('Ошибка:', error);
        showError(error.message);
    }
}

async function startTest(collectionId) {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const response = await fetch(`/collections/${collectionId}/cards`, {
            headers
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки карточек');
        }

        currentCards = await response.json();
        if (currentCards.length === 0) {
            throw new Error('В этой коллекции нет карточек');
        }

        currentCardIndex = 0;
        correctCount = 0;
        incorrectCount = 0;
        currentCollectionId = collectionId;
        testResults = { incorrectWords: [] };

        document.getElementById('checkSection').style.display = 'block';
        document.getElementById('collectionList').style.display = 'none';

        // Обработчик для показа перевода
        const checkCard = document.getElementById('checkCard');
        checkCard.style.cursor = 'pointer';
        checkCard.onclick = function () {
            const card = currentCards[currentCardIndex];
            document.getElementById('translation').textContent = `Перевод: ${card.translation}`;
            document.getElementById('translation').style.display = 'block';
        };

        showNextCard();
    } catch (error) {
        console.error('Ошибка:', error);
        showError(error.message);
        document.getElementById('checkSection').style.display = 'none';
        document.getElementById('collectionList').style.display = 'block';
    }
}

function showNextCard() {
    if (currentCardIndex < currentCards.length) {
        const card = currentCards[currentCardIndex];
        document.getElementById('checkCard').innerText = card.word;
        document.getElementById('translation').textContent = '';
        document.getElementById('translation').style.display = 'none';
    } else {
        finishTest();
    }
}

function checkAnswer(isCorrect) {
    const card = currentCards[currentCardIndex];

    if (isCorrect) {
        correctCount++;
    } else {
        incorrectCount++;
        testResults.incorrectWords.push({
            word: card.word,
            translation: card.translation
        });
    }

    currentCardIndex++;
    showNextCard();
}

async function finishTest() {
    document.getElementById('checkSection').style.display = 'none';

    // Обновляем статистику
    document.getElementById('correctCount').textContent = correctCount;
    document.getElementById('incorrectCount').textContent = incorrectCount;

    // Показываем контейнер статистики
    document.getElementById('statisticsContainer').style.display = 'block';

    // Добавляем список неправильных слов
    const wrongWordsContainer = document.createElement('div');
    wrongWordsContainer.className = 'wrong-words-container';

    if (testResults.incorrectWords.length > 0) {
        const wrongWordsTitle = document.createElement('h4');
        wrongWordsTitle.textContent = 'Слова с ошибками:';
        wrongWordsContainer.appendChild(wrongWordsTitle);

        const wrongWordsList = document.createElement('ul');
        wrongWordsList.className = 'wrong-words-list';

        testResults.incorrectWords.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.word} - ${item.translation}`;
            wrongWordsList.appendChild(li);
        });

        wrongWordsContainer.appendChild(wrongWordsList);
    } else {
        const noErrors = document.createElement('p');
        noErrors.textContent = 'Все слова изучены правильно!';
        wrongWordsContainer.appendChild(noErrors);
    }

    document.getElementById('statisticsContainer').appendChild(wrongWordsContainer);

    // Сохраняем результаты
    const token = localStorage.getItem('token');
    if (token) {
        try {
            await fetch('/test-results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    collectionId: currentCollectionId,
                    correctCount,
                    incorrectCount,
                    incorrectWords: testResults.incorrectWords
                })
            });
        } catch (error) {
            console.error('Ошибка при сохранении результатов:', error);
        }
    }

    loadCollections();
    loadTestHistory();
}

async function loadTestHistory() {
    const token = localStorage.getItem('token');
    if (!token) return;

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
    const historyContainer = document.createElement('div');
    historyContainer.className = 'test-history-container';
    historyContainer.innerHTML = '<h3>История тестов</h3>';

    if (history.length === 0) {
        historyContainer.innerHTML += '<p>Нет данных о прошлых тестах</p>';
    } else {
        history.forEach((test, index) => {
            const testElement = document.createElement('div');
            testElement.className = 'test-history-item';
            testElement.innerHTML = `
                <p><strong>Коллекция:</strong> ${test.Collection?.title || 'Неизвестная коллекция'}</p>
                <p><strong>Дата:</strong> ${new Date(test.createdAt).toLocaleString()}</p>
                <p><strong>Результат:</strong> ${test.correctCount} правильных, ${test.incorrectCount} ошибок</p>
            `;

            if (test.incorrectWords && test.incorrectWords.length > 0) {
                const wordsList = document.createElement('ul');
                wordsList.className = 'wrong-words-history';
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

    // Добавляем историю под статистикой
    const statsContainer = document.getElementById('statisticsContainer');
    const existingHistory = document.querySelector('.test-history-container');
    if (existingHistory) {
        statsContainer.replaceChild(historyContainer, existingHistory);
    } else {
        statsContainer.appendChild(historyContainer);
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => errorDiv.style.display = 'none', 5000);
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => successDiv.style.display = 'none', 5000);
    } else {
        alert(message);
    }
}

window.onload = function () {
    loadCollections();

    const token = localStorage.getItem('token');
    if (token) {
        const decoded = decodeToken(token);
        if (decoded.role === 'student') {
            loadTestHistory();
        }
    }
};