let currentCollectionId;
let currentCards = [];
let currentCardIndex = 0;
let correctCount = 0;
let incorrectCount = 0;

async function createCollection() {
    const title = document.getElementById('collectionTitle').value;
    const description = document.getElementById('collectionDescription').value;

    const response = await fetch('http://localhost:3000/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
    });

    loadCollections();
    document.getElementById('collectionTitle').value = '';
    document.getElementById('collectionDescription').value = '';
}

async function loadCollections() {
    const response = await fetch('http://localhost:3000/collections');
    const collections = await response.json();
    const collectionList = document.getElementById('collectionList');
    collectionList.innerHTML = '';

    collections.forEach(collection => {
        const li = document.createElement('li');
        li.textContent = `${collection.title} - ${collection.description}`;

        // Создаем кнопку "Добавить карточки"
        const addButton = document.createElement('button');
        addButton.textContent = "Добавить карточки";
        addButton.setAttribute('onclick', `loadCards(${collection.id})`); 
        li.appendChild(addButton);

        collectionList.appendChild(li);
    });
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

window.onload = loadCollections;