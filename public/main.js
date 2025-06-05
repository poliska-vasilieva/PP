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
        displayCollections(allCollections, searchTerm, token, false);
    } catch (error) {
        console.error('Ошибка:', error);
        showError(error.message);
    }
}

function displayCollections(collections, searchTerm = '', token = null, showFavorites = false) {
    const collectionList = document.getElementById('collectionList');
    collectionList.innerHTML = '';

    document.getElementById('searchInput').value = searchTerm;

    if (token) {
        const decoded = decodeToken(token);
        const tabsContainer = document.getElementById('tabsContainer');
        tabsContainer.innerHTML = `
            <div class="tabs">
                <button class="tab-button ${!showFavorites ? 'active' : ''}" onclick="showRegularCollections()">Все коллекции</button>
                ${decoded.role !== 'admin' ?
                `<button class="tab-button ${showFavorites ? 'active' : ''}" onclick="showFavoriteCollections()">Избранное</button>` : ''}
            </div>
        `;
        tabsContainer.style.display = 'block';
    } else {
        document.getElementById('tabsContainer').style.display = 'none';
    }

    let filteredCollections = searchTerm
        ? collections.filter(c =>
            c.title.toLowerCase().includes(searchTerm.toLowerCase()))
        : collections;

    if (showFavorites) {
        filteredCollections = filteredCollections.filter(c => !c.isPublic);
    } else {
        filteredCollections = filteredCollections.filter(c => c.isPublic);
    }

    if (filteredCollections.length === 0) {
        const noResults = document.createElement('p');
        noResults.className = 'p__main';

        noResults.textContent = showFavorites ? 'Нет избранных коллекций' : 'Коллекции не найдены';
        collectionList.appendChild(noResults);
        return;
    }

    filteredCollections.forEach(collection => {
        const li = document.createElement('li');
        li.className = 'collection-item';

        const token = localStorage.getItem('token');
        const decoded = token ? decodeToken(token) : {};
        const isAdmin = decoded.role === 'admin';
        const isStudent = decoded.role === 'student';

        li.innerHTML = `
            <h3 class="h3__main__title">${collection.title}</h3>
            <p class="p__main">${collection.description || 'Без описания'}</p>
            <div class="collection-buttons">
                ${!isAdmin ? `<button class="btn-test" onclick="startTest(${collection.id})">Проверить знания</button>` : ''}
                ${isAdmin ? `<button class="btn-delete" onclick="deleteCollection(${collection.id})">Удалить коллекцию</button>` : ''}
                ${token && isStudent && !showFavorites ?
                `<button class="btn-favorite" onclick="addToFavorites(${collection.id})">Добавить в избранное</button>` : ''}
                ${showFavorites ?
                `<button class="btn-remove" onclick="removeFromFavorites(${collection.id})">Удалить из избранного</button>` : ''}
            </div>
        `;
        collectionList.appendChild(li);
    });
}

async function deleteCollection(collectionId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showError('Необходима авторизация');
        return;
    }

    const confirmation = confirm('Вы уверены, что хотите удалить эту коллекцию?');
    if (!confirmation) return;

    try {
        const response = await fetch(`/collections/${collectionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка при удалении коллекции');
        }

        showSuccess('Коллекция успешно удалена');
        loadCollections();
    } catch (error) {
        console.error('Ошибка:', error);
        showError(error.message);
    }
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

// ... (остальной код остается без изменений до функции startTest)

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
        document.getElementById('statisticsContainer').style.display = 'none';

        // Стилизация flash-карты
        const checkCard = document.getElementById('checkCard');
        checkCard.style.cssText = `
            width: 300px;
            height: 200px;
            margin: 20px auto;
            perspective: 1000px;
            cursor: pointer;
            position: relative;
        `;

        // Очищаем предыдущее содержимое
        checkCard.innerHTML = '';

        // Создаем контейнер для flash-карты
        const cardContainer = document.createElement('div');
        cardContainer.className = 'flash-card';
        cardContainer.style.cssText = `
            width: 100%;
            height: 100%;
            position: relative;
            transform-style: preserve-3d;
            transition: transform 0.6s;
        `;

        // Создаем лицевую сторону (слово)
        const frontFace = document.createElement('div');
        frontFace.className = 'card-face front';
        frontFace.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9f9f9;
            border-radius: 10px;
            box-shadow: 10px 10px 20px 0px rgb(44 100 133);
            padding: 20px;
            font-size: 24px;
            text-align: center;
        `;

        // Создаем обратную сторону (перевод)
        const backFace = document.createElement('div');
        backFace.className = 'card-face back';
        backFace.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgb(195 222 237 / 40%);
            border-radius: 10px;
            box-shadow: 10px 10px 20px 0px rgb(44 100 133);
            padding: 20px;
            font-size: 24px;
            text-align: center;
            transform: rotateY(180deg);
        `;

        // Добавляем стороны в контейнер
        cardContainer.appendChild(frontFace);
        cardContainer.appendChild(backFace);
        checkCard.appendChild(cardContainer);

        // Обработчик клика для переворота карточки
        let isFlipped = false;
        checkCard.onclick = function() {
            isFlipped = !isFlipped;
            cardContainer.style.transform = isFlipped ? 'rotateY(180deg)' : 'rotateY(0)';
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
        const cardContainer = document.querySelector('.flash-card');
        
        // Устанавливаем слово на лицевую сторону
        const frontFace = document.querySelector('.front');
        frontFace.textContent = card.word;
        
        // Устанавливаем перевод на обратную сторону
        const backFace = document.querySelector('.back');
        backFace.textContent = card.translation;
        
        // Сбрасываем состояние переворота
        cardContainer.style.transform = 'rotateY(0)';
        
        // Скрываем кнопки проверки, пока карточка не перевернута
        document.querySelector('.prov__button').style.display = 'none';
        
        // Показываем кнопки после первого переворота
        let isFirstFlip = true;
        document.getElementById('checkCard').onclick = function() {
            const cardContainer = document.querySelector('.flash-card');
            const isFlipped = cardContainer.style.transform === 'rotateY(180deg)';
            
            if (!isFlipped && isFirstFlip) {
                document.querySelector('.prov__button').style.display = 'block';
                isFirstFlip = false;
            }
            
            cardContainer.style.transform = isFlipped ? 'rotateY(0)' : 'rotateY(180deg)';
        };
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
    const statsContainer = document.getElementById('statisticsContainer');
    statsContainer.style.display = 'block';

    // Очищаем предыдущие результаты
    statsContainer.innerHTML = `
        <h3 class="h3_history">Результаты теста</h3>
        <p class="p_history">Правильных ответов: <span id="correctCount">${correctCount}</span></p>
        <p class="p_history">Неправильных ответов: <span id="incorrectCount">${incorrectCount}</span></p>
    `;

    // Создаем контейнер для сообщения о правильных словах
    const successMessageContainer = document.createElement('div');
    successMessageContainer.className = 'success-message-container';

    if (testResults.incorrectWords.length === 0) {
        const noErrors = document.createElement('p');
        noErrors.className = 'p_history success-message';
        noErrors.textContent = 'Все слова изучены правильно!';
        successMessageContainer.appendChild(noErrors);
        statsContainer.appendChild(successMessageContainer);
    } else {
        // Добавляем список неправильных слов
        const wrongWordsContainer = document.createElement('div');
        wrongWordsContainer.className = 'wrong-words-container';

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
        statsContainer.appendChild(wrongWordsContainer);
    }

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
    historyContainer.innerHTML = '<h3 class="h3_history">История тестов</h3>';

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