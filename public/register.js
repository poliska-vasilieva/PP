document.getElementById('registerButton').addEventListener('click', () => {
    let nickname = document.getElementById('nickname').value.trim();
    let email = document.getElementById('email').value.trim();
    let password = document.getElementById('password').value;
    let role = document.getElementById('role').value;

    const nicknameRegex = /^[A-Za-zА-Яа-яЁё]+$/; 
    if (!nicknameRegex.test(nickname)) {
        alert("Имя должно состоять только из букв.");
        return;
    }

    const emailRegex = /^[^@]+@[^@]+.[^@]+$/; 
    if (!emailRegex.test(email)) {
        alert("Пожалуйста, введите корректный адрес электронной почты.");
        return;
    }

    if (password.length < 9) { 
        alert("Пароль должен содержать минимум 9 символов.");
        return;
    }

    let data = {
        nickname,
        email,
        password,
        role
    };

    fetch('/register', {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    }).then(response => {
        if (response.status === 409) {
            alert("Аккаунт с такой почтой уже существует!");
            return;
        }
        if (response.status === 201) { 
            return response.json(); 
        } else {
            alert("Произошла ошибка. Пожалуйста, попробуйте еще раз."); 
        }
    }).then(data => {
        if (data && data.redirect) {
            window.location.href = data.redirect;
        }
    }).catch(error => {
        console.error("Ошибка при регистрации:", error); 
        alert("Произошла ошибка. Пожалуйста, попробуйте еще раз.");
    });
});
