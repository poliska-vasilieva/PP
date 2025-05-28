document.getElementById('registerButton').addEventListener('click', async (event) => {
    event.preventDefault();
    const nickname = document.getElementById('nickname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const role = 'student'; 

    const nicknameRegex = /^[A-Za-zА-Яа-яЁё]+\s[A-Za-zА-Яа-яЁё]+$/;
    if (!nicknameRegex.test(nickname)) {
        alert("Пожалуйста, введите имя и фамилию");
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
        body: JSON.stringify({ nickname, email, password, role })
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