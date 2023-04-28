const express = require('express');
const tagsRouter = express.Router();
const { getAllTags, getPostsByTagName } = require('../db');


tagsRouter.use ((req, res, next) => {
   

    next();
});



tagsRouter.get('/',  async (req, res)=>{

    const tags = await getAllTags();


    res.send({
        tags
    });
});

tagsRouter.get('/:tagName/posts', async (req, res, next) => {

    const { tagName } = req.params;
    try {
        const posts = await getPostsByTagName(tagName);
        
        const myPosts = posts.filter(post =>{
            if(post.active){
                return true;
            } if(req.user && post.author.id === req.user.id){
                return true;
            } else {
                return false;
            }
        });


        res.send({myPosts})
    
    } catch (error) {
        next(error)
    }
  });
module.exports = tagsRouter;