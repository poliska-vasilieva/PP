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
        filterStudents('all');
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

function renderStudentList(students) {
    const studentsList = document.getElementById('studentsList');
    studentsList.innerHTML = '';

    if (students.length === 0) {
        studentsList.innerHTML = '<p class="p__main">Нет студентов в выбранной группе</p>';
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
        studentsList.appendChild(studentElement);
    });
}

function filterStudents(group) {
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.classList.remove('active');
        if ((group === 'all' && btn.textContent === 'Все') || 
            btn.textContent === group) {
            btn.classList.add('active');
        }
    });

    let filteredStudents = group === 'all' 
        ? [...allStudents] 
        : allStudents.filter(student => student.group === group);

    renderStudentList(filteredStudents);
}

async function viewStudentProfile(studentId) {
    const token = localStorage.getItem('token');
    try {
        const [student, testResults] = await Promise.all([
            fetch(`/api/users/${studentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => {
                if (!res.ok) throw new Error('Ошибка загрузки профиля студента');
                return res.json();
            }),
            fetch(`/api/students/${studentId}/test-results`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => {
                if (!res.ok) throw new Error('Ошибка загрузки результатов тестов');
                return res.json();
            })
        ]);

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
    resultsContainer.innerHTML = ''; // Очищаем контейнер
    
    if (testResults.length === 0) {
        resultsContainer.innerHTML = '<p class="p_history">Нет данных о тестах</p>';
        return;
    }

    // Берем только последние 3 результата
    const recentResults = testResults.slice(-3).reverse(); // Последний тест будет первым в списке

    recentResults.forEach(test => {
        const testElement = document.createElement('div');
        testElement.className = 'test-history-item'; 
        
        testElement.innerHTML = `
            <p><strong>Коллекция:</strong> ${test.Collection?.title || 'Неизвестная коллекция'}</p>
            <p><strong>Дата:</strong> ${new Date(test.createdAt).toLocaleString()}</p>
            <p><strong>Результат:</strong> ${test.correctCount} правильных, ${test.incorrectCount} ошибок</p>
        `;

        if (test.incorrectWords?.length > 0) {
            const wordsList = document.createElement('ul');
            wordsList.className = 'wrong-words-history'; 
            
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