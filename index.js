require('dotenv').config();

const PORT = 3000;
const express = require('express');
const server = express();
const apiRouter = require('./api');
const morgan = require('morgan');
const { client } = require('./db');
client.connect();

//begin middleware
server.use(express.json());
server.use(morgan('dev'));

//api router
server.use('/api', apiRouter);


server.listen(PORT, () => {
  console.log('The server is up on port', PORT)
});