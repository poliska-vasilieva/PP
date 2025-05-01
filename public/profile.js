function handleRoleBasedButtons(userRole) {
    const teacherButton = document.getElementById('teacherButton');
    const studentButton = document.getElementById('studentButton');
    const adminButton = document.getElementById('adminButton');
    teacherButton.style.display = 'none';
    studentButton.style.display = 'none';
    adminButton.style.display = 'none';

    if (userRole === 'teacher') {
        teacherButton.style.display = 'block';
    } else if (userRole === 'student') {
        studentButton.style.display = 'block';
    } else if (userRole === 'admin') {
        adminButton.style.display = 'block';
    }
}

// Функция для обработки успешной регистрации и отображения кнопок
function handleRegistrationSuccess(data) {
    localStorage.setItem('token', data.token); // Сохраняем токен
    handleRoleBasedButtons(data.role); // Отображаем кнопки

    // Перенаправляем на страницу профиля (всегда одна и та же)
    window.location.href = '/profile';
}

document.addEventListener('DOMContentLoaded', () => {
    // ... код для получения токена из localStorage (как в предыдущем ответе)

    const token = localStorage.getItem('token');

    if (token) {
        try {
            // Извлечение информации о пользователе из токена
            const tokenPayload = JSON.parse(atob(token.split('.')[1])); // Декодируем токен
            const userRole = tokenPayload.role; // Получаем роль пользователя
            console.log("Роль текущего пользователя:", userRole); // Проверка роли

            handleRoleBasedButtons(userRole);
        } catch (error) {
            console.error("Ошибка при разборе токена:", error);
            localStorage.removeItem('token'); // Удаляем недействительный токен
            // Возможно, перенаправляем на страницу логина
        }
    }

    // Пример обработки регистрации (замените на ваш реальный код отправки формы)
    const registrationForm = document.getElementById('registrationForm'); // Замените на ID вашей формы
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (event) => { // При отправке формы
            event.preventDefault(); // Предотвращаем перезагрузку страницы

            // Получаем данные из формы (пример)
            const nickname = document.getElementById('nickname').value; // Замените на ваши ID
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nickname, email, password, role })
                });

                if (response.ok) {
                    const data = await response.json();
                    handleRegistrationSuccess(data); // Обрабатываем успешную регистрацию
                } else {
                    const errorData = await response.json();
                    alert(`Ошибка при регистрации: ${errorData.error || 'Неизвестная ошибка'}`);
                }
            } catch (error) {
                console.error("Ошибка при отправке запроса:", error);
                alert('Произошла ошибка при отправке запроса на сервер.');
            }
        });
    }
});