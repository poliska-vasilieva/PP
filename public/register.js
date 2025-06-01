document.getElementById('registerButton').addEventListener('click', async (event) => {
    event.preventDefault();
    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const group = document.getElementById('group').value;
    const role = 'student';

    // Проверка формата полного имени: Фамилия Имя Отчество (минимум 2 слова)
    const fullnameRegex = /^[А-Яа-яЁё]+\s+[А-Яа-яЁё]+(?:\s+[А-Яа-яЁё]+)?$/;
    if (!fullnameRegex.test(fullname)) {
        alert("Пожалуйста, введите полное имя в формате: Фамилия Имя Отчество");
        return;
    }

    const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
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
        body: JSON.stringify({ 
            nickname: fullname, 
            email, 
            password, 
            role, 
            group 
        })
    });

    const data = await response.json();

    if (response.ok) {
        if (data.token) {
            localStorage.setItem('token', data.token);
            window.location.href = '/profile';
        } else {
            alert('Ошибка: отсутствует токен.');
        }
    } else {
        alert(data.error || 'Неизвестная ошибка.');
    }
});