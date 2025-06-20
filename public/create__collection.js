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
        const response = await fetch('/collections', {
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
        const response = await fetch('/collections', {
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

        // Фильтруем коллекции для преподавателя - показываем только его
        const filteredCollections = userRole === 'teacher' 
            ? collections.filter(collection => collection.userId === userId)
            : collections;

        filteredCollections.forEach(collection => {
            const li = document.createElement('li');
            li.textContent = `${collection.title} - ${collection.description || 'без описания'}`;

            const canEdit = userRole === 'admin' ||
                (userRole === 'teacher' && collection.userId === userId) ||
                (userRole === 'student' && collection.userId === userId && !collection.isPublic);

            if (canEdit) {
                const editButton = document.createElement('button');
                editButton.textContent = 'Редактировать';
                editButton.onclick = () => editCollection(collection.id);
                li.appendChild(editButton);
            }

            const canDelete = userRole === 'admin' || collection.userId === userId;
            if (canDelete) {
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Удалить';
                deleteButton.onclick = () => deleteCollection(collection.id);
                li.appendChild(deleteButton);
            }

            if (canEdit) {
                const addButton = document.createElement('button');
                addButton.textContent = "Добавить карточки";
                addButton.onclick = () => loadCards(collection.id);
                li.appendChild(addButton);
            }
            li.className = "coll-item";
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

    try {
        const response = await fetch(`/collections/${collectionId}/cards`);
        if (!response.ok) {
            throw new Error('Ошибка при загрузке карточек');
        }
        currentCards = await response.json();
        updateCardList();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
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
    const token = localStorage.getItem('token');

    if (!word || !translation) {
        alert('Слово и перевод обязательны');
        return;
    }

    try {
        const response = await fetch(`/collections/${currentCollectionId}/cards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ word, translation })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка при создании карточки');
        }

        const newCard = await response.json();
        currentCards.push(newCard);
        updateCardList();
        document.getElementById('cardWord').value = '';
        document.getElementById('cardTranslation').value = '';
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
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
        const response = await fetch(`/cards/${cardId}`, {
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
            const response = await fetch(`/cards/${cardId}`, {
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
        li.className = "coll-item";
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
        const response = await fetch(`/collections/${collectionId}`, {
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
        // Загрузка текущих данных коллекции
        const collectionResponse = await fetch(`/collections/${collectionId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!collectionResponse.ok) {
            const error = await collectionResponse.json();
            throw new Error(error.error || 'Ошибка при загрузке коллекции');
        }

        const collection = await collectionResponse.json();

        // Запрос новых данных у пользователя
        const newTitle = prompt('Введите новое название:', collection.title);
        const newDescription = prompt('Введите новое описание:', collection.description || '');

        if (newTitle) {
            // Отправка обновленных данных на сервер
            const updateResponse = await fetch(`/collections/${collectionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: newTitle,
                    description: newDescription
                })
            });

            if (!updateResponse.ok) {
                const error = await updateResponse.json();
                throw new Error(error.error || 'Ошибка при обновлении коллекции');
            }

            // Обновление списка коллекций
            loadCollections();
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

window.onload = loadCollections;