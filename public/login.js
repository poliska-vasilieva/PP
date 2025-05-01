document.getElementById('loginButton').addEventListener('click', async (event) => {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        console.log("Отправляем запрос на вход...");
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) { // Сохраняем токен и роль в localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            
            // Перенаправление на соответствующую страницу
            window.location.href = '/main.html'; // или другая страница
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error("Ошибка при выполнении запроса:", error); // Логирование ошибки на клиенте
        alert('Произошла ошибка при попытке войти. Пожалуйста, попробуйте еще раз.');
    }
});