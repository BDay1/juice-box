const { Client } = require('pg');

const client = new Client('postgres://localhost:5432/juicebox-dev');


const createUser = async ({ 
    username, 
    password,
    name,
    location,
    active
 }) => {
    try {
        const { rows: [ user ] } = await client.query(`
        INSERT INTO  users ( username, password, name, location) 
        VALUES  ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING 
        RETURNING *;
        ` , [username, password, name, location]);
        return user;
    } catch (error) {
        throw error;
    }
  }
  //do the keys we are looking formatch what we are trying to input

  const updateUser = async (id, fields = {}) => {
    // build the set string
    const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');
  //double dollar sign = setting the value to the setstring is the value of the key index +1, youre setting a value to a thing seen as a value?
    // return early if they dont match
    if (setString.length === 0) {
      return;
    }
  
    try {
      const {rows: [user] } = await client.query(`
        UPDATE users
        SET ${ setString }
        WHERE id=${ id }
        RETURNING *;
      `, Object.values(fields));
  //updating the user where the id matches
      return user;
    } catch (error) {
      throw error;
    }
  }
  const getAllUsers = async () => {
    const { rows } = await client.query(
        `SELECT id, username, name, location, active
        FROM users;
        `);
        return rows;
}
  const getUserById = async (userId) => {
    try{
       
        const {rows: [user] } = await client.query(`
        SELECT * FROM users
        WHERE id = ${userId}
        `)
        if(user.length === 0) return
        delete user.password;
        const userPosts = await getPostsByUser(userId);
        user.posts = userPosts;
        console.log(user)
        return user;
    
    } catch (error) {
        throw error;
    }
}

  const createPost= async ({
    authorId,
    title,
    content
  }) => 
   {
    try {
        const { rows: [ post ] } = await client.query(`
        INSERT INTO  posts ( "authorId", title, content) 
        VALUES  ($1, $2, $3) 
        RETURNING *;
        ` , [authorId, title, content]);
        return post;
    } catch (error) {
        throw error;
    }
  }
  const updatePost = async ( id, fields = {}) => {
    const setString = Object.keys(fields).map(
        (key, index) => `"${ key }"=$${ index + 1 }`
      ).join(', ');

      if (setString.length === 0) {
        return;
      }

    try{
        const {rows: [post] } = await client.query(`
        UPDATE posts
        SET ${ setString }
        WHERE id=${ id }
        RETURNING *;
        `, Object.values(fields));
        return post;
    } catch (error) {
        throw error;
    }
}

  const getAllPosts = async () => {
    const { rows } = await client.query(
        `SELECT *
        FROM posts;
        `);
        return rows;
}
const getPostsByUser = async (userId) => {
    try{
        const {rows} = await client.query(`
        SELECT * FROM posts
        WHERE "authorId"=${ userId };
        `);
        return rows;
    } catch (error) {
        throw error;
    }
}   // first get the user (NOTE: Remember the query returns // (1) an object that contains 
        // (2) a `rows` array that (in this case) will contain 
        // (3) one object, which is our user.
      // if it doesn't exist (if there are no `rows` or `rows.length`), return null
      // if it does:
      // delete the 'password' key from the returned object
      // get their posts (use getPostsByUser)
      // then add the posts to the user object with key 'posts'
      // return the user object


module.exports = {
  client,
  createUser,
  updateUser,
  getAllUsers,
  getUserById,
  createPost,
  updatePost,
  getAllPosts,
  getPostsByUser,
}