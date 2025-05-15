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
        validate: {
            notEmpty: {
                msg: "Имя и фамилия не могут быть пустыми."
            },
            is: {
                args: /^[A-Za-zА-Яа-яЁё]+\s[A-Za-zА-Яа-яЁё]+$/,
                msg: "Пожалуйста, введите имя и фамилию"
            }
        }
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
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
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
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Название коллекции не может быть пустым"
            }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    userId: {
        type: DataTypes.INTEGER,
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

const TestResult = sequelize.define('TestResult', {
    correctCount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    incorrectCount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    incorrectWords: {
        type: DataTypes.JSON,
        allowNull: false
    }
});

// Добавьте связи
User.hasMany(TestResult);
TestResult.belongsTo(User);
Collection.hasMany(TestResult);
TestResult.belongsTo(Collection);

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

    if (!nickname || !email || !password || !role) {
        return res.status(400).json({ error: 'Все поля обязательны для заполнения!' });
    }

    try {
        const existingUser = await User.findOne({ where: { email: email } });
        if (existingUser) {
            return res.status(409).json({ error: 'Аккаунт с такой почтой уже существует!' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({ nickname, email, password: hashedPassword, role });
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
        res.status(201).json({ message: 'Пользователь успешно прошел регистрацию!', token, role: user.role });
    } catch (error) {
        console.error("Произошла ошибка:", error);
        res.status(500).json({ error: 'Произошла ошибка на сервере.' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны для входа!' });
    }

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Неверный логин или пароль!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Неверный логин или пароль!' });
        } const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ message: 'Успешный вход!', token, role: user.role });
    } catch (error) {
        console.error("Произошла ошибка при входе:", error);
        res.status(500).json({ error: 'Произошла ошибка на сервере.' });
    }
});

app.get('/profile/data', async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userId = decodedToken.id;

    const user = await User.findByPk(userId);
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(user);
});

app.post('/updateProfile', async (request, response) => {
    const { nickname, email, currentPassword, newPassword } = request.body; // Исправлено: Получаем currentPassword

    if (!nickname || !email) {
        return response.status(400).json({ message: 'Имя и электронная почта обязательны для заполнения' }); // Отправляем JSON ответ с сообщением
    }

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return response.sendStatus(404); // Пользователь не найден
        }

        // Проверяем текущий пароль
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
            return response.sendStatus(403); // Ошибка доступа, текущий пароль неверен
        }

        // Обновляем данные пользователя
        user.nickname = nickname;
        user.email = email;

        // Хэшируем новый пароль, если он предоставлен
        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10); // 10 - salt rounds
            user.password = hashedPassword; // Сохраняем хэшированный пароль
        }

        await user.save();
        response.sendStatus(200); // Успешное обновление данных

    } catch (error) {
        console.error("Ошибка при обновлении профиля:", error);
        return response.status(500).send("Ошибка на сервере"); // Отправляем сообщение об ошибке сервера
    }
});

// Добавьте этот роут перед другими роутами коллекций
app.get('/collections/:id', async (req, res) => {
    try {
        const collection = await Collection.findByPk(req.params.id, {
            include: [Card] // Опционально, если нужно включать карточки
        });

        if (!collection) {
            return res.status(404).json({ error: 'Коллекция не найдена' });
        }

        res.json(collection);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении коллекции' });
    }
});

app.post('/collections', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (decoded.role !== 'teacher') {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        const { title, description } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Название коллекции обязательно' });
        }

        const collection = await Collection.create({
            title,
            description,
            isPublic: true,
            userId: decoded.id
        });
        res.json(collection);
    } catch (error) {
        res.status(400).json({ error: 'Ошибка при создании коллекции' });
    }
});

app.post('/personal-collections', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const { title, description } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Название коллекции обязательно' });
        }

        const collection = await Collection.create({
            title,
            description,
            isPublic: false,
            userId: decoded.id
        });
        res.json(collection);
    } catch (error) {
        res.status(400).json({ error: 'Ошибка при создании коллекции' });
    }
});

app.get('/collections', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    try {
        let whereCondition = { isPublic: true };

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            whereCondition = {
                [Sequelize.Op.or]: [
                    { isPublic: true },
                    { userId: decoded.id }
                ]
            };
        }
        const collections = await Collection.findAll({ where: whereCondition });
        res.json(collections);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении коллекций' });
    }
});

app.post('/collections/:id/cards', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const { word, translation } = req.body;
        const collectionId = req.params.id;

        if (!word || !translation) {
            return res.status(400).json({ error: 'Слово и перевод обязательны' });
        }

        // Проверяем, существует ли коллекция и есть ли права на добавление карточек
        const collection = await Collection.findByPk(collectionId);
        if (!collection) {
            return res.status(404).json({ error: 'Коллекция не найдена' });
        }

        // Проверяем права: только владелец или админ могут добавлять карточки
        if (decoded.role !== 'admin' && collection.userId !== decoded.id) {
            return res.status(403).json({ error: 'Нет прав для добавления карточек в эту коллекцию' });
        }

        const card = await Card.create({
            word,
            translation,
            CollectionId: collectionId,
            UserId: decoded.id
        });

        res.status(201).json(card);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при создании карточки' });
    }
});

app.get('/collections/:id/cards', async (req, res) => {
    try {
        const collectionId = req.params.id;
        const cards = await Card.findAll({
            where: { CollectionId: collectionId }
        });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении карточек' });
    }
});

app.post('/collections/:id/clone', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (decoded.role !== 'student') {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        const originalCollection = await Collection.findByPk(req.params.id, {
            include: [Card]
        });

        if (!originalCollection) {
            return res.status(404).json({ error: 'Коллекция не найдена' });
        }

        const newCollection = await Collection.create({
            title: `Копия: ${originalCollection.title}`,
            description: originalCollection.description,
            isPublic: false,
            userId: decoded.id
        });

        const cardsToCreate = originalCollection.Cards.map(card => ({
            word: card.word,
            translation: card.translation,
            CollectionId: newCollection.id
        }));

        await Card.bulkCreate(cardsToCreate);

        res.json(newCollection);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при клонировании коллекции' });
    }
});

app.put('/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { word, translation } = req.body;

        if (!word || !translation) {
            return res.status(400).json({ error: 'Слово и перевод обязательны' });
        }

        const [updated] = await Card.update(
            { word, translation },
            { where: { id } }
        );

        if (updated === 0) {
            return res.status(404).json({ error: 'Карточка не найдена' });
        }

        res.json({ message: 'Карточка обновлена' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при обновлении карточки' });
    }
});

app.delete('/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Card.destroy({ where: { id } });

        if (deleted === 0) {
            return res.status(404).json({ error: 'Карточка не найдена' });
        }

        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении карточки' });
    }
});

app.put('/collections/:id', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const { id } = req.params;
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Название коллекции обязательно' });
        }

        const collection = await Collection.findByPk(id);
        if (!collection) {
            return res.status(404).json({ error: 'Коллекция не найдена' });
        }

        // Проверка прав: админ или владелец коллекции
        if (decoded.role !== 'admin' && collection.userId !== decoded.id) {
            return res.status(403).json({ error: 'Нет прав для редактирования этой коллекции' });
        }

        const [updated] = await Collection.update(
            { title, description },
            { where: { id } }
        );

        if (updated === 0) {
            return res.status(404).json({ error: 'Коллекция не найдена' });
        }

        // Возвращаем обновленную коллекцию
        const updatedCollection = await Collection.findByPk(id);
        res.json(updatedCollection);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при обновлении коллекции' });
    }
});

// Удаление коллекции
app.delete('/collections/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Удаляем все карточки коллекции
        await Card.destroy({ where: { CollectionId: id } });

        // Удаляем саму коллекцию
        const deleted = await Collection.destroy({ where: { id } });

        if (deleted === 0) {
            return res.status(404).json({ error: 'Коллекция не найдена' });
        }

        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении коллекции' });
    }
});

app.get('/collections/:id/check-edit', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const { id } = req.params;

        const collection = await Collection.findByPk(id);
        if (!collection) {
            return res.status(404).json({ error: 'Коллекция не найдена' });
        }

        // Проверяем права:
        if (decoded.role !== 'admin' &&
            (decoded.role === 'student' || collection.userId !== decoded.id)) {
            return res.status(403).json({ error: 'Нет прав для редактирования этой коллекции' });
        }

        res.json({ canEdit: true });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при проверке прав' });
    }
});

// Добавьте этот маршрут в server.js
app.post('/collections/:id/statistics', async (req, res) => {
    try {
        const { correctCount, incorrectCount } = req.body;
        // Здесь можно сохранять статистику в базу данных, если нужно
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при сохранении статистики' });
    }
});

app.get('/collections/:id/statistics', async (req, res) => {
    try {
        // Здесь можно получать статистику из базы данных
        res.json({ correct: 0, incorrect: 0 }); // Заглушка - замените реальными данными
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении статистики' });
    }
});

app.get('/favorite-collections', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const collections = await Collection.findAll({
            where: {
                userId: decoded.id,
                isPublic: false
            }
        });
        res.json(collections);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении избранных коллекций' });
    }
});

app.get('/api/students', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (decoded.role !== 'teacher') {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        const students = await User.findAll({
            where: { role: 'student' },
            attributes: ['id', 'nickname', 'email'],
            order: [['nickname', 'ASC']]
        });

        res.json(students);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении списка студентов' });
    }
});

// Получение результатов тестов студента
app.get('/api/students/:id/test-results', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (decoded.role !== 'teacher') {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        const studentId = req.params.id;
        const testResults = await TestResult.findAll({
            where: { UserId: studentId },
            include: [Collection],
            order: [['createdAt', 'DESC']]
        });

        res.json(testResults);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении результатов тестов' });
    }
});

// Получение данных пользователя по ID
app.get('/api/users/:id', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (decoded.role !== 'teacher') {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'nickname', 'email', 'role'],
            where: { role: 'student' }
        });

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении данных пользователя' });
    }
});

app.post('/test-results', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const { collectionId, correctCount, incorrectCount, incorrectWords } = req.body;

        const testResult = await TestResult.create({
            correctCount,
            incorrectCount,
            incorrectWords,
            UserId: decoded.id,
            CollectionId: collectionId
        });

        res.status(201).json(testResult);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при сохранении результатов теста' });
    }
});

app.get('/test-results', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        const testResults = await TestResult.findAll({
            where: { UserId: decoded.id },
            include: [Collection],
            order: [['createdAt', 'DESC']],
            limit: 3
        });

        res.json(testResults);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении истории тестов' });
    }
});

// Добавьте этот маршрут перед errorHandler
app.get('/api/users', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        const users = await User.findAll({
            where: {
                role: ['student', 'teacher']
            },
            attributes: ['id', 'nickname', 'email', 'role'],
            order: [['role', 'ASC'], ['nickname', 'ASC']]
        });

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении пользователей' });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        const userId = req.params.id;
        const deleted = await User.destroy({
            where: {
                id: userId,
                role: ['student', 'teacher'] // Админов нельзя удалять
            }
        });

        if (deleted === 0) {
            return res.status(404).json({ error: 'Пользователь не найден или нельзя удалить' });
        }

        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении пользователя' });
    }
});

// Добавьте маршруты для статей перед errorHandler

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Получение всех статей
app.get('/api/articles', async (req, res) => {
    try {
        const articles = await Article.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении статей' });
    }
});

// Получение статьи по ID
app.get('/api/articles/:id', async (req, res) => {
    try {
        const article = await Article.findByPk(req.params.id);
        if (!article) {
            return res.status(404).json({ error: 'Статья не найдена' });
        }
        res.json(article);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении статьи' });
    }
});

// Создание статьи (только для учителей)
app.post('/api/articles', upload.single('image'), async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (decoded.role !== 'teacher') {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: 'Заголовок и содержание обязательны' });
        }

        const article = await Article.create({
            title,
            content,
            image: req.file ? req.file.filename : null,
            UserId: decoded.id
        });

        res.status(201).json(article);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при создании статьи' });
    }
});

// Обновление статьи (только для автора-учителя)
app.put('/api/articles/:id', upload.single('image'), async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const articleId = req.params.id;
        const { title, content } = req.body;

        const article = await Article.findByPk(articleId);
        if (!article) {
            return res.status(404).json({ error: 'Статья не найдена' });
        }

        if (decoded.role !== 'teacher' || article.UserId !== decoded.id) {
            return res.status(403).json({ error: 'Нет прав для редактирования' });
        }

        const updateData = {
            title,
            content,
            ...(req.file && { image: req.file.filename })
        };

        await article.update(updateData);
        res.json(article);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при обновлении статьи' });
    }
});

// Удаление статьи (для учителя и админа)
app.delete('/api/articles/:id', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const articleId = req.params.id;

        const article = await Article.findByPk(articleId);
        if (!article) {
            return res.status(404).json({ error: 'Статья не найдена' });
        }

        // Преподаватель может удалять только свои статьи, админ - любые
        if (decoded.role !== 'admin' &&
            (decoded.role !== 'teacher' || article.UserId !== decoded.id)) {
            return res.status(403).json({ error: 'Нет прав для удаления' });
        }

        await article.destroy();
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении статьи' });
    }
});

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: err.message || 'Что-то пошло не так!' });
};

app.use(errorHandler);


app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});