// document.getElementById('loginForm').addEventListener('submit', async (event) => {
//     event.preventDefault(); // Предотвращение перезагрузки страницы

//     const email = document.getElementById('email').value; 
//     const password = document.getElementById('password').value;

//     const response = await fetch('/login', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json' // указание о передаче JSON
//         },
//         body: JSON.stringify({ email, password }) // преобразование объекта в JSON строку
//     });

//     // проверка успешного ответа от сервера
//     if (response.ok) {
//         const data = await response.json(); 

//         localStorage.setItem('nickname', data.nickname);
//         localStorage.setItem('email', data.email);

//         // Перенаправляем на указанную страницу
//         window.location.href = data.redirect; 
//     } else if (response.status === 404) {
//         alert("Пользователя не существует или данные введены неверно!"); 
//     } else if (response.status === 401) {
//         alert("Неверный пароль");
//     } else {
//         alert('Ошибка входа, проверьте свои данные.'); // Общее сообщение об ошибке
//     }
// });

// Авторизация
document.getElementById('loginButton').addEventListener('click', async (event) => {
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

    const data = await response.json();
    
    if (response.ok) {        // Сохраняем токен и роль в localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        
        // Перенаправление на соответствующую страницу
        window.location.href = '/dashboard'; // или другая страница
    } else {
        alert(data.error);
    }
});