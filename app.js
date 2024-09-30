const express = require('express');
const mongoose = require('mongoose');
const Pet = require('./models/petmodel');
const User = require('./models/userModel');
const bcrypt = require('bcrypt');
const multer = require('multer');

const storage  = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);
  }
})

const upload = multer({storage });

const app = express();
const port = 3000;
mongoose.connect('mongodb://127.0.0.1:27017/petdb').then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index');
});
app.get('/Adoptpet', (req, res) => {
  res.render('Adoptpet');
});
app.get('/login', (req, res) => {
  res.render('registration');
});
app.get('/pethelp', (req, res) => {
  res.render('pethelp');
});
app.get('/selpet', (req, res) => {
  res.render('selpet');
});

app.post('/registeruser', async (req, res) => {
    const { username, email, password } = req.body;
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt, async function(err, hash) {
          // Store hash in your password DB.
          const user = new User({ username, email, password: hash });
          await user.save();
          res.redirect('/');
      });
  });
});

app.post('/sellpet', upload.single('image'), async (req, res) => {
    const { name, type, age, breed, gender, price, location } = req.body;
    const pet = new Pet({ image: req.file.path, name, type, age, breed, gender, price, location });
    await pet.save();
    res.redirect('/selpet');
});

app.post('/adoptpet', async (req, res) => {
    const { type, age, gender, location } = req.body;
    const conditions = [];

    if (type) conditions.push({ type: new RegExp(type, 'i') });
    if (age) conditions.push({ age: new Number(age, 'i') });
    if (gender) conditions.push({ gender: new RegExp(gender, 'i') });
    if (location) conditions.push({ location: new RegExp(location, 'i') });

    let query = {};
    if (conditions.length > 0) {
        query = { $or: conditions };
    }

    try {
        const pets = await Pet.find(query);
        res.render('renderpet', { pets });
    } catch (err) {
        res.status(500).send('An error occurred while fetching the pets');
    }
});

app.get('/renderpet', async (req, res) => {
    try {
        const pets = await Pet.find({});
        res.render('renderpet', { pets });
    } catch (err) {
        res.status(500).send('An error occurred while fetching the pets');
    }
});

app.get("/pets/:name", async (req, res) => {
//   console.log(req.params.name);
  const pets = await Pet.find({ type: req.params.name });
  res.render("renderpet", { pets });
});





app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});