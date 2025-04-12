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
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'user'
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
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
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

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/profileAdmin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profileAdmin.html'));
});

app.get('/profileUser', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profileUser.html'));
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

        const redirectUrl = role === 'admin' ? '/profileAdmin' : '/profileUser';

        res.status(201).json({ message: 'Пользователь успешно прошел регистрацию!', redirect: redirectUrl });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role }, 'secret_key', { expiresIn: '1h' });

        const redirectUrl = user.role === 'admin' ? '/profileAdmin' : '/profileUser';

        // Добавляем nickname в ответ
        res.json({ message: 'Login successful', token, redirect: redirectUrl, nickname: user.nickname });
    } catch (error) {
        res.status(400).json({ error: error.message });
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

// Настройка загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Получение всех статей
app.get('/api/articles', async (req, res) => {
    const articles = await Article.findAll();
    res.json(articles);
});

// Создание статьи
app.post('/api/articles', upload.single('image'), async (req, res) => {
    const { title, content } = req.body;
    const image = req.file ? req.file.filename : null;
    await Article.create({ title, content, image });
    res.status(201).json({ message: 'Article created' });
});

// Удаление статьи
app.delete('/api/articles/:id', async (req, res) => {
    const { id } = req.params;
    await Article.destroy({ where: { id } });
    res.status(204).send();
});

// Редактирование статьи
app.put('/api/articles/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const image = req.file ? req.file.filename : null;

    await Article.update(
        { title, content, image },
        { where: { id } }
    );

    res.json({ message: 'Article updated' });
});


app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});