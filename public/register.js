document.getElementById('registerButton').addEventListener('click', async (event) => {
    event.preventDefault();
    const nickname = document.getElementById('nickname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value; // Получаем роль из формы

    const nicknameRegex = /^[A-Za-zА-Яа-яЁё]+\s[A-Za-zА-Яа-яЁё]+$/;
    if (!nicknameRegex.test(nickname)) {
        alert("Пожалуйста, введите имя и фамилию");
        return;
    }

    const emailRegex = /^[^@]+@[^@]+.[^@]+$/; // Исправлено на корректный регулярное выражение для email
    if (!emailRegex.test(email)) {
        alert("Пожалуйста, введите корректный адрес электронной почты.");
        return;
    }

    if (password.length < 9) {
        alert("Пароль должен содержать минимум 9 символов.");
        return;
    }

    const response = await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nickname, email, password, role }) // Отправляем роль
    });

    const data = await response.json();

    if (response.ok) {
        if (data.token && data.role) { // Убрано условие на redirect
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            window.location.href = '/profile'; // Здесь можно указать URL для перенаправления
        } else {
            alert('Ошибка: отсутствует токен или роль.');
        }
    } else {
        alert(data.error || 'Неизвестная ошибка.');
    }
});
