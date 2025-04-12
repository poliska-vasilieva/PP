document.addEventListener('DOMContentLoaded', () => {
    const nickname = localStorage.getItem('nickname');
    const email = localStorage.getItem('email');

    if (nickname) {
        document.getElementById('nickname').value = nickname;
    }
    if (email) {
        document.getElementById('email').value = email;
    }

    document.getElementById('saveButton').addEventListener('click', async () => {
        const nickname = document.getElementById('nickname').value;
        const email = document.getElementById('email').value;
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;

        try {
            const response = await fetch('/updateProfile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nickname, email, password: currentPassword, newPassword })
            });

            if (response.ok) {
                localStorage.setItem('nickname', nickname);
                localStorage.setItem('email', email);
                alert('Данные успешно обновлены');
            } else {
                alert('Ошибка при обновлении данных');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при отправке данных');
        }
    });

    document.getElementById('ButtonLogOut').addEventListener('click', () => {
        localStorage.removeItem('nickname');
        localStorage.removeItem('email');
        window.location.href = '/login';
    });
});