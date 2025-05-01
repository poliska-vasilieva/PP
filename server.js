require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
});

const User = sequelize.define('User', {
    nickname: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('student', 'teacher', 'admin'),
        allowNull: false
    }
});

const Card = sequelize.define('Card', {
    word: {
        type: DataTypes.STRING,
        allowNull: false
    },
    translation: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

const Collection = sequelize.define('Collection', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

const Article = sequelize.define('Article', {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Заголовок не может быть пустым"
            },
            len: {
                args: [3, 255],
                msg: "Заголовок должен быть длиной от 3 до 255 символов"
            }
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Содержимое не может быть пустым"
            }
        }
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
    }
});
// Связь между пользователями и карточками
User.hasMany(Card);
Card.belongsTo(User);

// Связь между коллекциями и карточками
Collection.hasMany(Card);
Card.belongsTo(Collection);

sequelize.sync().then(() => {
    console.log('Database & tables created!');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.post('/register', async (req, res) => {
    const { nickname, email, password, role } = req.body;
    try {
        const existingUser = await User.findOne({ where: { email: email } });
        if (existingUser) {
            return res.status(409).json({ error: 'Аккаунт с такой почтой уже существует!' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ nickname, email, password: hashedPassword, role });
        
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
        res.status(201).json({ message: 'Пользователь успешно прошел регистрацию!', token: token, role: user.role }); // Изменено на user.role
    } catch (error) {
        console.error("Произошла ошибка:", error);
        res.status(500).json({ error: 'Произошла ошибка на сервере.' });
    }
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log("Полученные данные для входа:", { email, password }); // Проверка полученных данных

    try {
        console.log("Начинаем поиск пользователя по электронной почте...");
        const user = await User.findOne({ where: { email } });
        console.log("Результат поиска пользователя:", user);

        if (!user) {
            return res.status(401).json({ error: 'Неверный логин или пароль!' });
        }

        console.log("Начинаем сравнение пароля...");
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Пароль не совпадает"); // Добавлено логирование
            return res.status(401).json({ error: 'Неверный логин или пароль!' });
        }

        // Создание токена
        console.log("Начинаем создание токена...");
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
        console.log("Созданный токен:", token);

        res.json({ message: 'Успешный вход!', token, role: user.role }); // Ответ с токеном и ролью
    } catch (error) {
        console.error("Произошла ошибка при входе:", error); // Логирование ошибки на сервере
        res.status(500).json({ error: 'Произошла ошибка на сервере.' });
    }
});

app.post('/updateProfile', async (request, response) => {
    const { nickname, email, password, newPassword } = request.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {

        return response.sendStatus(404);
    }

    if (newPassword) {
        if (user.password !== password) {
            return response.sendStatus(403);
        }
        user.password = newPassword;
    }

    user.nickname = nickname;
    user.email = email;
    await user.save();

    response.sendStatus(200);
});

// Создание коллекции
app.post('/collections', async (req, res) => {
    const { title, description } = req.body;
    try {
        const collection = await Collection.create({ title, description });
        res.json(collection);
    } catch (error) {
        res.status(400).json({ error: 'Ошибка при создании коллекции' });
    }
});

// Получение всех коллекций
app.get('/collections', async (req, res) => {
    const collections = await Collection.findAll();
    res.json(collections);
});

// Создание карточки в коллекции
app.post('/collections/:collectionId/cards', async (req, res) => {
    const { collectionId } = req.params;
    const { word, translation } = req.body;
    try {
        const card = await Card.create({ word, translation, CollectionId: collectionId });
        res.json(card);
    } catch (error) {
        res.status(400).json({ error: 'Ошибка при создании карточки' });
    }
});

// Получение всех карточек в коллекции
app.get('/collections/:collectionId/cards', async (req, res) => {
    const { collectionId } = req.params;
    const cards = await Card.findAll({ where: { CollectionId: collectionId } });
    res.json(cards);
});

// Получение карточек для проверки
app.get('/collections/:collectionId/check', async (req, res) => {
    const { collectionId } = req.params;
    const cards = await Card.findAll({ where: { CollectionId: collectionId } });
    res.json(cards);
});

// Настройка Multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Папка для сохранения загруженных файлов
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Недопустимый формат файла. Разрешены только изображения (jpeg, png, gif).'));
        }
    }
});

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: err.message || 'Что-то пошло не так!' });
};

// Получение всех статей
app.get('/api/articles', async (req, res) => {
    try {
        const articles = await Article.findAll();
        res.json(articles);
    } catch (error) {
        console.error('Ошибка при получении статей:', error);
        res.status(500).json({ message: 'Не удалось получить статьи.' });
    }
});

// Создание статьи
app.post('/api/articles', upload.single('image'), async (req, res) => {
    try {
        const { title, content } = req.body;

        // Валидация данных на сервере (если валидация Sequelize не работает)
        if (!title || title.trim() === '') {
            return res.status(400).json({ message: "Заголовок не может быть пустым" });
        }
        if (!content || content.trim() === '') {
            return res.status(400).json({ message: "Содержимое не может быть пустым" });
        }

        const image = req.file ? req.file.filename : null;
        const article = await Article.create({ title, content, image });
        res.status(201).json({ message: 'Статья успешно создана!', article: article });
    } catch (error) {
        console.error('Ошибка при создании статьи:', error);
        // Обработка ошибок валидации Sequelize
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Не удалось создать статью.' });
    }
});

// Удаление статьи
app.delete('/api/articles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedRows = await Article.destroy({ where: { id } });

        if (deletedRows === 0) {
            return res.status(404).json({ message: 'Статья не найдена.' });
        }

        res.status(204).send(); // No Content - успешное удаление
    } catch (error) {
        console.error('Ошибка при удалении статьи:', error);
        res.status(500).json({ message: 'Не удалось удалить статью.' });
    }
});

// Редактирование статьи
app.put('/api/articles/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const image = req.file ? req.file.filename : null;

        //Валидация
        if (!title || title.trim() === '') {
            return res.status(400).json({ message: "Заголовок не может быть пустым" });
        }
        if (!content || content.trim() === '') {
            return res.status(400).json({ message: "Содержимое не может быть пустым" });
        }

        const [updatedRows] = await Article.update(
            { title, content, image },
            { where: { id } }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ message: 'Статья не найдена.' });
        }

        res.json({ message: 'Статья успешно обновлена!' });
    } catch (error) {
        console.error('Ошибка при обновлении статьи:', error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Не удалось обновить статью.' });
    }
});

app.use(errorHandler); // Подключаем обработчик ошибок


app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});