let currentCollectionId;
let currentCards = [];
let currentCardIndex = 0;
let correctCount = 0;
let incorrectCount = 0;

async function createCollection() {
    const title = document.getElementById('collectionTitle').value;
    const description = document.getElementById('collectionDescription').value;

    if (!title) {
        alert('Название коллекции обязательно');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Необходима авторизация');
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/collections', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка при создании коллекции');
        }

        loadCollections();
        document.getElementById('collectionTitle').value = '';
        document.getElementById('collectionDescription').value = '';
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

async function loadCollections() {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
        const response = await fetch('http://localhost:3000/collections', {
            headers
        });

        if (!response.ok) {
            throw new Error('Ошибка при загрузке коллекций');
        }

        const collections = await response.json();
        const collectionList = document.getElementById('collectionList');
        collectionList.innerHTML = '';

        // Получаем данные пользователя из токена
        let userId = null;
        let userRole = null;
        if (token) {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            userId = decoded.id;
            userRole = decoded.role;
        }

        collections.forEach(collection => {
            const li = document.createElement('li');
            li.textContent = `${collection.title} - ${collection.description || 'без описания'}`;

            // Показываем кнопку редактирования только если:
            // 1. Это админ
            // 2. Это учитель и коллекция его
            // 3. Это студент и коллекция его (не публичная)
            const canEdit = userRole === 'admin' || 
                          (userRole === 'teacher' && collection.userId === userId) ||
                          (userRole === 'student' && collection.userId === userId && !collection.isPublic);

            if (canEdit) {
                const editButton = document.createElement('button');
                editButton.textContent = 'Редактировать';
                editButton.onclick = () => editCollection(collection.id);
                li.appendChild(editButton);
            }

            // Кнопка удаления (показываем для своих коллекций или для админа)
            const canDelete = userRole === 'admin' || collection.userId === userId;
            if (canDelete) {
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Удалить';
                deleteButton.onclick = () => deleteCollection(collection.id);
                li.appendChild(deleteButton);
            }

            // Кнопка "Добавить карточки" (показываем если есть права на редактирование)
            if (canEdit) {
                const addButton = document.createElement('button');
                addButton.textContent = "Добавить карточки";
                addButton.onclick = () => loadCards(collection.id);
                li.appendChild(addButton);
            }

            collectionList.appendChild(li);
        });
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

async function loadCards(collectionId) {
    currentCollectionId = collectionId;
    document.getElementById('cardSection').style.display = 'block';
    document.getElementById('collectionList').style.display = 'none';

    const response = await fetch(`http://localhost:3000/collections/${collectionId}/cards`);
    currentCards = await response.json();
    updateCardList();
}

function updateCardList() {
    const cardList = document.getElementById('cardList');
    cardList.innerHTML = '';
    currentCards.forEach(card => {
        const li = document.createElement('li');
        li.textContent = `${card.word} - ${card.translation}`;
        cardList.appendChild(li);
    });
}

async function createCard() {
    const word = document.getElementById('cardWord').value;
    const translation = document.getElementById('cardTranslation').value;

    await fetch(`http://localhost:3000/collections/${currentCollectionId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, translation })
    }); currentCards.push({ word, translation });
    updateCardList();
    document.getElementById('cardWord').value = '';
    document.getElementById('cardTranslation').value = '';
}

async function saveCollection() {
    alert("Коллекция сохранена!");
    goBack();
}

function goBack() {
    document.getElementById('cardSection').style.display = 'none';
    document.getElementById('collectionList').style.display = 'block';
    loadCollections();
}

async function deleteCard(cardId) {
    try {
        const response = await fetch(`http://localhost:3000/cards/${cardId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Ошибка при удалении карточки');
        }

        // Обновляем список карточек
        currentCards = currentCards.filter(card => card.id !== cardId);
        updateCardList();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

async function editCard(cardId) {
    const card = currentCards.find(c => c.id === cardId);
    if (!card) return;

    const newWord = prompt('Введите новое слово:', card.word);
    const newTranslation = prompt('Введите новый перевод:', card.translation);

    if (newWord && newTranslation) {
        try {
            const response = await fetch(`http://localhost:3000/cards/${cardId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word: newWord, translation: newTranslation })
            });

            if (!response.ok) {
                throw new Error('Ошибка при обновлении карточки');
            }

            // Обновляем данные карточки
            card.word = newWord;
            card.translation = newTranslation;
            updateCardList();
        } catch (error) {
            console.error('Ошибка:', error);
            alert(error.message);
        }
    }
}
// Обновим функцию updateCardList для добавления кнопок
function updateCardList() {
    const cardList = document.getElementById('cardList');
    cardList.innerHTML = '';
    currentCards.forEach(card => {
        const li = document.createElement('li');
        li.textContent = `${card.word} - ${card.translation}`;

        // Кнопка редактирования
        const editButton = document.createElement('button');
        editButton.textContent = 'Редактировать';
        editButton.onclick = () => editCard(card.id);
        li.appendChild(editButton);

        // Кнопка удаления
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Удалить';
        deleteButton.onclick = () => deleteCard(card.id);
        li.appendChild(deleteButton);

        cardList.appendChild(li);
    });
}

async function deleteCollection(collectionId) {
    if (!confirm('Вы уверены, что хотите удалить эту коллекцию?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Необходима авторизация');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/collections/${collectionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка при удалении коллекции');
        }

        loadCollections();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

async function editCollection(collectionId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Необходима авторизация');
        return;
    }

    try {
        // Сначала проверяем права на редактирование
        const checkResponse = await fetch(`http://localhost:3000/collections/${collectionId}/check-edit`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!checkResponse.ok) {
            const error = await checkResponse.json();
            throw new Error(error.error || 'Нет прав для редактирования');
        }

        const collection = await (await fetch(`http://localhost:3000/collections/${collectionId}`)).json();
        
        const newTitle = prompt('Введите новое название:', collection.title);
        const newDescription = prompt('Введите новое описание:', collection.description || '');

        if (newTitle) {
            const updateResponse = await fetch(`http://localhost:3000/collections/${collectionId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title: newTitle, description: newDescription })
            });

            if (!updateResponse.ok) {
                throw new Error('Ошибка при обновлении коллекции');
            }

            loadCollections();
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

window.onload = loadCollections;