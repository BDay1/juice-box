const express = require('express');
const userRouter = express.Router();

userRouter.use ((req, res, next) => {
    console.log("A request is being made to /users");

    next();
});

const { getAllUsers } = require('../db');

userRouter.get('/',  async (req, res)=>{
    const users = await getAllUsers();

    res.send({
        users 
    });
});

module.exports = userRouter;