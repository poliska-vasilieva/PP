let currentUsers = [];
let currentSortColumn = -1;
let sortDirection = 1;

async function fetchUsers() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки пользователей');
        }

        currentUsers = await response.json();
        renderUsers(currentUsers);
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить пользователей. Проверьте права доступа.');
        window.location.href = '/profile';
    }
}

function getRoleName(role) {
    const roles = {
        'student': 'Студент',
        'teacher': 'Преподаватель',
        'admin': 'Администратор'
    };
    return roles[role] || role;
}

function renderUsers(users, roleFilter = 'all') {
    const userTableBody = document.getElementById('userTableBody');
    if (!userTableBody) return;

    userTableBody.innerHTML = '';

    const filteredUsers = roleFilter === 'all'
        ? users
        : users.filter(user => user.role === roleFilter);

    if (filteredUsers.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" style="text-align: center;">Нет пользователей</td>`;
        userTableBody.appendChild(row);
        return;
    }

    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.nickname || 'Не указано'}</td>
            <td>${user.email || 'Не указано'}</td>
            <td>${getRoleName(user.role)}</td>
            <td>${user.role === 'teacher' ? '—' : (user.group || 'Не указана')}</td>
            <td>
                ${user.role !== 'admin' 
                    ? `<button class="action-btn edit-btn" onclick="openEditModal(${user.id})">Редактировать</button>
                       <button class="action-btn delete-btn" onclick="deleteUser(${user.id})">Удалить</button>`
                    : ''}
            </td>
        `;
        userTableBody.appendChild(row);
    });
}

async function deleteUser(userId) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const confirmation = confirm('Вы уверены, что хотите удалить этого пользователя?');
    if (!confirmation) return;

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Не удалось удалить пользователя');
        }

        alert('Пользователь успешно удалён');
        await fetchUsers();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

function sortTable(columnIndex) {
    if (currentSortColumn === columnIndex) {
        sortDirection *= -1;
    } else {
        currentSortColumn = columnIndex;
        sortDirection = 1;
    }

    currentUsers.sort((a, b) => {
        let keyA, keyB;

        switch (columnIndex) {
            case 0: keyA = a.nickname?.toLowerCase() || ''; keyB = b.nickname?.toLowerCase() || ''; break;
            case 1: keyA = a.email?.toLowerCase() || ''; keyB = b.email?.toLowerCase() || ''; break;
            case 2: keyA = a.role; keyB = b.role; break;
            case 3: keyA = a.group || 'zzz'; keyB = b.group || 'zzz'; break;
            default: return 0;
        }

        return keyA.localeCompare(keyB) * sortDirection;
    });

    renderUsers(currentUsers, getActiveFilter());
}

function getActiveFilter() {
    const activeBtn = document.querySelector('.filter-btn.active');
    return activeBtn ? activeBtn.dataset.role : 'all';
}

function setupFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => 
                b.classList.remove('active'));
            btn.classList.add('active');
            renderUsers(currentUsers, btn.dataset.role);
        });
    });
}

function openEditModal(userId) {
    const user = currentUsers.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserName').value = user.nickname || '';
    document.getElementById('editUserEmail').value = user.email || '';
    
    const roleSelect = document.getElementById('editUserRole');
    const groupSelect = document.getElementById('editUserGroup');
    
    roleSelect.value = user.role;
    
    roleSelect.onchange = function() {
        groupSelect.style.display = this.value === 'student' ? 'block' : 'none';
    };
    
    if (user.role === 'student') {
        groupSelect.style.display = 'block';
        groupSelect.value = user.group || '';
    } else {
        groupSelect.style.display = 'none';
    }
    
    document.getElementById('editUserModal').style.display = 'block';
}

async function saveUserChanges() {
    const userId = document.getElementById('editUserId').value;
    const nickname = document.getElementById('editUserName').value.trim();
    const email = document.getElementById('editUserEmail').value.trim();
    const role = document.getElementById('editUserRole').value;
    const group = role === 'student' ? document.getElementById('editUserGroup').value : null;
    const token = localStorage.getItem('token');

    if (!nickname || !email || !role) {
        alert('Все поля обязательны для заполнения');
        return;
    }

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nickname,
                email,
                role,
                group: role === 'student' ? group : undefined
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка при обновлении пользователя');
        }

        closeEditModal();
        await fetchUsers();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

function closeEditModal() {
    document.getElementById('editUserModal').style.display = 'none';
}

async function createTeacher() {
    const name = document.getElementById('teacherName').value.trim();
    const email = document.getElementById('teacherEmail').value.trim();
    const password = document.getElementById('teacherPassword').value.trim();
    const token = localStorage.getItem('token');

    if (!name || !email || !password) {
        alert('Все поля обязательны для заполнения');
        return;
    }

    const nameRegex = /^[А-ЯЁа-яёA-Za-z-]+\s[А-ЯЁа-яёA-Za-z-\s]+$/;
    if (!nameRegex.test(name)) {
        alert('Введите корректное ФИО (минимум имя и фамилию, только буквы и дефисы)');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Введите корректный email');
        return;
    }

    if (password.length < 9) {
        alert('Пароль должен содержать минимум 9 символов');
        return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{9,}$/;
    if (!passwordRegex.test(password)) {
        alert('Пароль должен содержать минимум 1 букву и 1 цифру');
        return;
    }

    try {
        const response = await fetch('/api/teachers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nickname: name,
                email,
                password
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка при создании преподавателя');
        }

        alert('Преподаватель успешно создан');
        document.getElementById('teacherName').value = '';
        document.getElementById('teacherEmail').value = '';
        document.getElementById('teacherPassword').value = '';
        await fetchUsers();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupFilterButtons();
    fetchUsers();

    document.getElementById('createTeacherBtn').addEventListener('click', createTeacher);
    document.getElementById('saveUserBtn').addEventListener('click', saveUserChanges);
    document.querySelector('.close').addEventListener('click', closeEditModal);
    
    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('editUserModal')) {
            closeEditModal();
        }
    });
});