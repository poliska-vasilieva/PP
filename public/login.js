document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('nickname', data.nickname);
        localStorage.setItem('email', data.email);
        window.location.href = data.redirect;
    } else if (response.status === 404) {
        alert("Пользователя не существует или данные введены неверно!");
    } else if (response.status === 401) {
        alert("Неверный пароль");
    } else {
        alert('Ошибка входа, проверьте свои данные.');
    }
});
