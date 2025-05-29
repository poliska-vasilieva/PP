let allStudents = [];

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        const decoded = decodeToken(token);
        if (decoded.role !== 'teacher') {
            window.location.href = '/profile.html';
            return;
        }

        await loadStudentsList();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка загрузки страницы');
    }
});

function decodeToken(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
        console.error('Ошибка декодирования токена:', error);
        return {};
    }
}

async function loadStudentsList() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/students', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Ошибка загрузки списка студентов');

        allStudents = await response.json();
        filterStudents('all'); // По умолчанию показываем всех студентов
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

function filterStudents(group) {
    const studentsList = document.getElementById('studentsList');
    studentsList.innerHTML = '';

    // Обновляем активную кнопку фильтра
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === (group === 'all' ? 'Все' : `Группа ${group}`)) {
            btn.classList.add('active');
        }
    });

    let filteredStudents = [];
    if (group === 'all') {
        filteredStudents = [...allStudents];
    } else {
        filteredStudents = allStudents.filter(student => student.group === group);
    }

    if (filteredStudents.length === 0) {
        studentsList.innerHTML = '<p>Нет студентов в выбранной группе</p>';
        return;
    }

    // Сортируем студентов по имени внутри группы
    filteredStudents.sort((a, b) => a.nickname.localeCompare(b.nickname));

    filteredStudents.forEach(student => {
        const studentElement = document.createElement('div');
        studentElement.className = 'student-item';
        studentElement.innerHTML = `
            <h3 class="h3_students">${student.nickname}</h3>
            <p class="p_students">${student.email}</p>
            <p class="p_students">Группа: ${student.group || 'Не указана'}</p>
            <button onclick="viewStudentProfile(${student.id})" class="btn-primary">Просмотреть профиль</button>
        `;
        studentsList.appendChild(studentElement);
    });
}

function displayStudentsList(students) {
    const studentsList = document.getElementById('studentsList');
    studentsList.innerHTML = '';

    // Добавляем кнопки сортировки
    studentsList.innerHTML = `
        <div class="sort-controls">
            <button onclick="sortStudents('group')" class="btn-sort">Сортировать по группе</button>
            <button onclick="sortStudents('name')" class="btn-sort">Сортировать по имени</button>
        </div>
        <div id="studentsContainer"></div>
    `;

    const studentsContainer = document.getElementById('studentsContainer');
    
    if (students.length === 0) {
        studentsContainer.innerHTML = '<p>Нет зарегистрированных студентов</p>';
        return;
    }

    students.forEach(student => {
        const studentElement = document.createElement('div');
        studentElement.className = 'student-item';
        studentElement.innerHTML = `
            <h3 class="h3_students">${student.nickname}</h3>
            <p class="p_students">${student.email}</p>
            <p class="p_students">Группа: ${student.group || 'Не указана'}</p>
            <button onclick="viewStudentProfile(${student.id})" class="btn-primary">Просмотреть профиль</button>
        `;
        studentsContainer.appendChild(studentElement);
    });
}

// Добавляем функцию сортировки
function sortStudents(criteria) {
    const token = localStorage.getItem('token');
    fetch('/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(students => {
        const sortedStudents = [...students].sort((a, b) => {
            if (criteria === 'group') {
                const groupA = a.group || 'zzz'; // Студенты без группы в конец
                const groupB = b.group || 'zzz';
                return groupA.localeCompare(groupB);
            } else {
                return a.nickname.localeCompare(b.nickname);
            }
        });
        displayStudentsList(sortedStudents);
    })
    .catch(error => {
        console.error('Ошибка сортировки:', error);
        alert('Ошибка при сортировке студентов');
    });
}

async function viewStudentProfile(studentId) {
    const token = localStorage.getItem('token');
    try {
        // Запрос должен включать группу
        const studentResponse = await fetch(`/api/users/${studentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!studentResponse.ok) {
            const errorData = await studentResponse.json();
            throw new Error(errorData.error || 'Ошибка загрузки профиля студента');
        }
        
        const student = await studentResponse.json();

        // Остальной код остается без изменений
        const testsResponse = await fetch(`/api/students/${studentId}/test-results`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!testsResponse.ok) {
            const errorData = await testsResponse.json();
            throw new Error(errorData.error || 'Ошибка загрузки результатов тестов');
        }
        
        const testResults = await testsResponse.json();

        document.getElementById('studentsList').style.display = 'none';
        document.getElementById('studentProfile').style.display = 'block';
        
        document.getElementById('studentName').textContent = student.nickname;
        document.getElementById('studentEmail').textContent = student.email;
        document.getElementById('studentGroup').textContent = `Группа: ${student.group || 'Не указана'}`;
        
        displayTestResults(testResults);
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
        backToStudentsList();
    }
}

function displayTestResults(testResults) {
    const resultsContainer = document.getElementById('studentTestResults');
    resultsContainer.innerHTML = '';

    if (testResults.length === 0) {
        resultsContainer.innerHTML = '<p class="p_history">Нет данных о тестах</p>';
        return;
    }

    testResults.forEach((test, index) => {
        const testElement = document.createElement('div');
        testElement.className = 'test-result';
        testElement.innerHTML = `
            <h4>${test.Collection?.title || 'Неизвестная коллекция'}</h4>
            <p class="p_history"><strong>Дата: </strong> ${new Date(test.createdAt).toLocaleString()}</p>
            <p class="p_history"><strong>Правильных ответов: </strong>${test.correctCount}</p>
            <p class="p_history"><strong>Ошибок: </strong>${test.incorrectCount}</p>
        `;

        if (test.incorrectWords && test.incorrectWords.length > 0) {
            const wordsList = document.createElement('ul');
            wordsList.innerHTML = '<h5>Ошибки:</h5>';
            test.incorrectWords.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `${item.word} - ${item.translation}`;
                wordsList.appendChild(li);
            });
            testElement.appendChild(wordsList);
        }

        resultsContainer.appendChild(testElement);
    });
}

function backToStudentsList() {
    document.getElementById('studentProfile').style.display = 'none';
    document.getElementById('studentsList').style.display = 'block';
}

window.filterStudents = filterStudents;
window.viewStudentProfile = viewStudentProfile;
window.backToStudentsList = backToStudentsList;