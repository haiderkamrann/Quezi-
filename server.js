const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}

const usersFilePath = path.join(uploadFolder, 'users.json');
if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify([]));
}

// // Middleware to handle file uploads
// const upload = multer({ dest: 'uploads/' });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

// Route to get all users
app.get('/users', (req, res) => {
    fs.readFile(usersFilePath, (err, data) => {
        if (err) {
            return res.status(500).send('Error reading users file');
        }
        res.json(JSON.parse(data));
    });
});

// Route to save user data
app.post('/users', upload.single('profilePicture'), (req, res) => {
    fs.readFile(usersFilePath, (err, data) => {
        if (err) {
            return res.status(500).send('Error reading users file');
        }

        const users = JSON.parse(data);

        const emailExists = users.some(user => user.email === req.body.email);
        if (emailExists) {
            return res.status(400).send('Error: Email already exists. Please use a different email.');
        }

        const validIds = users.filter(user => user.id !== null).map(user => user.id);
        const newId = validIds.length ? Math.max(...validIds) + 1 : 1;

        const date = new Date();

        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString();
        const day = date.getDate().toString();

        const hours = date.getHours().toString();
        const minutes = date.getMinutes().toString();
        const seconds = date.getSeconds().toString();

        const formattedDate = `${year}-${month}-${day} / ${hours}:${minutes}:${seconds}`;

        const profilePicture = req.file ? req.file.filename : 'defaultImage.png';

        // Hash the password
        // const plainPassword = req.body.password; 
        bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ error: 'Error hashing password' });
            }

            // After the password is hashed, create the new user object
            const newUser = {
                id: newId,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                password: hashedPassword,  // Use the hashed password
                profilePicture: profilePicture,
                createdAt: formattedDate,
                updatedAt: ""
            };

            users.push(newUser);

            // Write the updated users array back to the file
            fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), err => {
                if (err) {
                    return res.status(500).send('Error writing users file');
                }
                res.status(200).json(newUser);
            });
        });
    });
});

// Route to update user data
app.put('/users/:id', upload.single('profilePicture'), (req, res) => {
    const userId = parseInt(req.params.id, 10);

    fs.readFile(usersFilePath, (err, data) => {
        if (err) {
            return res.status(500).send('Error reading users file');
        }

        let users = JSON.parse(data);

        // Find the index of the user to be updated
        const userIndex = users.findIndex(user => user.id === userId);

        if (userIndex === -1) {
            return res.status(404).send('User not found');
        }

        const currentUser = users[userIndex];

        // Check if the updated email already exists for any other user
        const updatedEmail = req.body.email;
        const emailExists = users.some(user => user.email === updatedEmail && user.id !== userId);

        if (emailExists) {
            return res.status(400).send('Email already exists');
        }

        // Update the user's details
        const date = new Date();
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString()}-${date.getDate().toString()} / ${date.getHours().toString()}:${date.getMinutes().toString()}:${date.getSeconds().toString()}`;

        // If the password is provided, hash it
        if (req.body.password && req.body.password !== currentUser.password) {
            bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
                if (err) {
                    return res.status(500).json({ error: 'Error hashing password' });
                }

                const updatedUser = {
                    ...currentUser,
                    firstName: req.body.firstName || currentUser.firstName,
                    lastName: req.body.lastName || currentUser.lastName,
                    email: updatedEmail || currentUser.email,
                    password: hashedPassword,  // Save the hashed password
                    profilePicture: req.file ? req.file.filename : currentUser.profilePicture,
                    updatedAt: formattedDate
                };

                users[userIndex] = updatedUser;

                fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), err => {
                    if (err) {
                        return res.status(500).send('Error writing users file');
                    }
                    res.status(200).json(updatedUser);
                });
            });
        } else {
            // If the password is not being updated, proceed as usual
            const updatedUser = {
                ...currentUser,
                firstName: req.body.firstName || currentUser.firstName,
                lastName: req.body.lastName || currentUser.lastName,
                email: updatedEmail || currentUser.email,
                password: currentUser.password,  // Keep the existing password
                profilePicture: req.file ? req.file.filename : currentUser.profilePicture,
                updatedAt: formattedDate
            };

            users[userIndex] = updatedUser;

            fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), err => {
                if (err) {
                    return res.status(500).send('Error writing users file');
                }
                res.status(200).json(updatedUser);
            });
        }
    });
});


// Route to delete user data
app.delete('/users/:id', (req, res) => {
    fs.readFile(usersFilePath, (err, data) => {
        if (err) {
            return res.status(500).send('Error reading users file');
        }

        let users = JSON.parse(data);
        const userId = parseInt(req.params.id, 10);

        const userIndex = users.findIndex(user => user.id === userId);

        if (userIndex === -1) {
            return res.status(404).send('User not found');
        }

        users.splice(userIndex, 1);

        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), err => {
            if (err) {
                return res.status(500).send('Error writing users file');
            }
            res.status(204).send();
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


