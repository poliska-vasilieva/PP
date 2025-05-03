function handleRoleBasedButtons(userRole) {
    const teacherButton = document.getElementById('teacherButton');
    const studentButton = document.getElementById('studentButton');
    const adminButton = document.getElementById('adminButton');

    // Сначала скрываем все кнопки
    teacherButton.style.display = 'none';
    studentButton.style.display = 'none';
    adminButton.style.display = 'none';

    // Затем показываем только те, которые соответствуют роли
    if (userRole === 'teacher') {
        teacherButton.style.display = 'block';
    } else if (userRole === 'student') {
        studentButton.style.display = 'block';
    } else if (userRole === 'admin') {
        adminButton.style.display = 'block';
    }
}

function handleRegistrationSuccess(data) {
    localStorage.setItem('token', data.token); // Сохраняем токен
    localStorage.setItem('role', data.role); // Сохраняем роль в localStorage
    handleRoleBasedButtons(data.role); // Отображаем кнопки
    window.location.href = '/profile';
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const registrationForm = document.getElementById('registrationForm');

    // Получаем роль из localStorage (если есть)
    const userRoleFromStorage = localStorage.getItem('role');

    // Если есть роль в localStorage, отображаем кнопки
    if (userRoleFromStorage) {
        handleRoleBasedButtons(userRoleFromStorage);
    }

    if (token) {
        try {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const userRoleFromToken = tokenPayload.role; // Получаем роль пользователя

            // Сравнение ролей: роль из токена имеет приоритет
            const userRole = userRoleFromToken || userRoleFromStorage;

            console.log("Роль текущего пользователя:", userRole);
            handleRoleBasedButtons(userRole);

        } catch (error) {
            console.error("Ошибка при разборе токена:", error);
            localStorage.removeItem('token'); // Удаляем недействительный токен
            localStorage.removeItem('role'); // Очищаем роль, если токен недействителен
        }
    }

    if (registrationForm) {
        registrationForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const nickname = document.getElementById('nickname').value;
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

document.addEventListener('DOMContentLoaded', () => {
  const nicknameInput = document.getElementById('nickname');
  const emailInput = document.getElementById('email');

  // Загружаем данные из localStorage при загрузке страницы
  const nickname = localStorage.getItem('nickname');
  const email = localStorage.getItem('email');

  if (nickname) {
    nicknameInput.value = nickname;
  }
  if (email) {
    emailInput.value = email;
  }

  document.getElementById('saveButton').addEventListener('click', async () => {
    const nickname = nicknameInput.value;
    const email = emailInput.value;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    // Валидация на клиенте
    if (!nickname || !email) {
      alert('Имя и электронная почта обязательны для заполнения');
      return;
    }

    try {
      const response = await fetch('/updateProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nickname, email, currentPassword, newPassword }) 
      });

      if (response.ok) {
        // Сохраняем в localStorage только при успешном обновлении
        localStorage.setItem('nickname', nickname);
        localStorage.setItem('email', email);
        alert('Данные успешно обновлены');
      } else if (response.status === 403) {
        alert('Неверный текущий пароль');
      } else if (response.status === 404) {
        alert('Пользователь не найден'); // Обрабатываем 404 ошибку
      }
       else if (response.status === 400) {
        const data = await response.json();
        alert(data.message); //  Выводим сообщение об ошибке с сервера
      }
       else {
        alert('Ошибка при обновлении данных');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Произошла ошибка при соединении с сервером');
    }
  });
});