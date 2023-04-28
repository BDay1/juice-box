require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const userRouter = express.Router();
const { getAllUsers } = require('../db');
const { getUserByUsername } = require('../db');
const { createUser } = require('../db');

userRouter.use ((req, res, next) => {
    console.log("A request is being made to /users");

    next();
});



userRouter.get('/',  async (req, res)=>{
    const users = await getAllUsers();

    res.send({
        users 
    });
});
/* we are validating the username and password to log in.
enter username and password. if username or password is not truthy/entered then responds with error message. if  both are entered and both are correct send success message. If one is not correct then send error incorrect informaiton*/

userRouter.post('/login', async (req, res, next) => {
    const { username, password } = req.body;
   
    
    if (!username || !password) {
      next({
        name: "MissingCredentialsError",
        message: "Please supply both a username and password"
      });
    }
  
    try {
      const user = await getUserByUsername(username); 
      const token = jwt.sign({id: user.id, username: user.username, passowrd: user.password}, process.env.JWT_SECRET);
  console.log(`${user.username}`);
      if (user && user.password == password) {
        // create token & return to user 
       
        res.send({ message: "you're logged in!", token : token });
      } else {
        next({ 
          name: 'IncorrectCredentialsError', 
          message: 'Username or password is incorrect'
        });
      }
    } catch(error) {
      console.log(error);
      next(error);
    }
  });
/*  */
  userRouter.post('/register', async (req, res, next) => {
    const { username, password, name, location } = req.body;
  
    try {
      const _user = await getUserByUsername(username);
  
      if (_user) {
        next({
          name: 'UserExistsError',
          message: 'A user by that username already exists'
        });
      }
  
      const user = await createUser({
        username,
        password,
        name,
        location,
      });
  
      const token = jwt.sign({ 
        id: user.id, 
        username
      }, process.env.JWT_SECRET, {
        expiresIn: '1w'
      });
  
      res.send({ 
        message: "thank you for signing up",
        token 
      });
    } catch ({ name, message }) {
      next({ name, message })
    } 
  });
  
module.exports = userRouter;