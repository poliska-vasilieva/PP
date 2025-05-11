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

        const students = await response.json();
        displayStudentsList(students);
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

function displayStudentsList(students) {
    const studentsList = document.getElementById('studentsList');
    studentsList.innerHTML = '';

    if (students.length === 0) {
        studentsList.innerHTML = '<p>Нет зарегистрированных студентов</p>';
        return;
    }

    students.forEach(student => {
        const studentElement = document.createElement('div');
        studentElement.className = 'student-item';
        studentElement.innerHTML = `
            <h3 class="h3_students">${student.nickname}</h3>
            <p class="p_students">${student.email}</p>
            <button onclick="viewStudentProfile(${student.id})" class="btn-primary">Просмотреть профиль</button>
        `;
        studentsList.appendChild(studentElement);
    });
}

async function viewStudentProfile(studentId) {
    const token = localStorage.getItem('token');
    try {
        // данные студента
        const studentResponse = await fetch(`/api/users/${studentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!studentResponse.ok) {
            const errorData = await studentResponse.json();
            throw new Error(errorData.error || 'Ошибка загрузки профиля студента');
        }
        
        const student = await studentResponse.json();

        // результаты тестов
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

window.viewStudentProfile = viewStudentProfile;
window.backToStudentsList = backToStudentsList;