let currentCollectionId;
let currentCards = [];
let currentCardIndex = 0;
let correctCount = 0;
let incorrectCount = 0;

async function loadCollections() {
    const response = await fetch('http://localhost:3000/collections');
    const collections = await response.json();
    const collectionList = document.getElementById('collectionList');
    collectionList.innerHTML = '';

    collections.forEach(collection => {
        const li = document.createElement('li');
        li.textContent = `${collection.title} - ${collection.description}`;

        // Создаем кнопку "Проверить знания"
        const checkButton = document.createElement('button');
        checkButton.textContent = "Проверить знания";
        checkButton.setAttribute('onclick', `startCheck(${collection.id})`);
        li.appendChild(checkButton);

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

async function startCheck(collectionId) {
    const response = await fetch(`http://localhost:3000/collections/${collectionId}/check`);
    currentCards = await response.json();
    currentCardIndex = 0;
    correctCount = 0;
    incorrectCount = 0;

    document.getElementById('checkSection').style.display = 'block';
    document.getElementById('collectionList').style.display = 'none';
    showNextCard();
}

function showNextCard() {
    if (currentCardIndex < currentCards.length) {
        const card = currentCards[currentCardIndex];
        document.getElementById('checkCard').innerText = card.word;
    } else {
        showStatistics();
    }
}

function checkAnswer(isCorrect) {
    if (isCorrect) {
        correctCount++;
    } else {
        incorrectCount++;
    }
    currentCardIndex++;
    showNextCard();
}

function showStatistics() {
    document.getElementById('checkSection').style.display = 'none';
    document.getElementById('statistics').innerText =
        `Верно: ${correctCount}, Неверно: ${incorrectCount}`;

    alert("Проверка завершена! " + `Верно: ${correctCount}, Неверно: ${incorrectCount}`);

    loadCollections();
}

// Загрузка коллекций при загрузке страницы
window.onload = loadCollections;