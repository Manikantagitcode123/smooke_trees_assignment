const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());

const dbPath = path.join(__dirname, 'user_address.db');
let db = null;

// Initialize the database and server
const initializeDbAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // Create the User and Address tables if they don't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS User (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL
            );
            CREATE TABLE IF NOT EXISTS Address (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                address VARCHAR(255) NOT NULL,
                FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
            );
        `);

        app.listen(3000, () => {
            console.log('Server started on http://localhost:3000');
        });
    } catch (error) {
        console.error('DB Error:', error);
        process.exit(1);
    }
};

initializeDbAndServer();


// API Endpoints

// Register new user with address
app.post('/register', async (req, res) => {
    const { name, address } = req.body;

    try {
        // Insert into the User table
        const userResult = await db.run(
            `INSERT INTO User (name) VALUES (?)`,
            [name]
        );
        const userId = userResult.lastID;

        // Insert into the Address table
        await db.run(
            `INSERT INTO Address (userId, address) VALUES (?, ?)`,
            [userId, address]
        );

        res.status(200).send('User and address added successfully');
    } catch (error) {
        console.error('Error adding user and address:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Fetch all users and their addresses
app.get('/users', async (req, res) => {
    try {
        const usersWithAddresses = await db.all(`
            SELECT User.id, User.name, Address.address
            FROM User
            LEFT JOIN Address ON User.id = Address.userId
        `);

        res.status(200).json(usersWithAddresses);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
    }
});
