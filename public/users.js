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
        window.location.href = '/profile.html';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Неизвестно';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Неизвестно';

    return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getRoleName(role) {
    const roles = {
        'student': 'Студент',
        'teacher': 'Учитель',
        'admin': 'Администратор'
    };
    return roles[role] || role;
}

function renderUsers(users, roleFilter = 'all') {
    const userTableBody = document.getElementById('userTableBody');
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
            <td>${user.nickname}</td>
            <td>${user.email}</td>
            <td>${getRoleName(user.role)}</td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <button class="action-btn" onclick="deleteUser(${user.id})">Удалить</button>
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
            throw new Error('Не удалось удалить пользователя');
        }

        alert('Пользователь успешно удалён');
        fetchUsers();
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
            case 0: keyA = a.nickname; keyB = b.nickname; break;
            case 1: keyA = a.email; keyB = b.email; break;
            case 2: keyA = a.role; keyB = b.role; break;
            case 3: keyA = new Date(a.createdAt); keyB = new Date(b.createdAt); break;
            default: return 0;
        }

        if (columnIndex === 3) {
            return (keyA - keyB) * sortDirection;
        } else {
            return keyA.localeCompare(keyB) * sortDirection;
        }
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

document.addEventListener('DOMContentLoaded', () => {
    setupFilterButtons();
    fetchUsers();
});