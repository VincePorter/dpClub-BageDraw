// * node modules
const path = require('path');

// * third-party modules
require('dotenv').config();
const express = require('express');

// * my modules
const routes = require('./src/routes');

// * setup the app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);

// * start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
