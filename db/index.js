const { Client } = require('pg');
const client = new Client('postgres://localhost:5432/juicebox-dev');





/*******CREATE USER ********/

/*This is a function with 4 parameters. we are creating an object variable for data we are getting from the client. from the client we are requesting the parameters values and inserting them into an array which gets translated into our object of users*/

const createUser = async ({ 
    username, 
    password,
    name,
    location
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


/*******UPDATE USER ********/

/*this function has 2 parameters one equalling an object. we we are building a string to pass to our sql request. this string is being created by mapping through the fields objext of key value pairs. We are looking for the keys that we are setting(which would be usually seen as $1,$2,$3 but we dont know how many the user is updating hence the mapping) if we have mapped and there is no keys to be updated we do nothing. If there is keys in fields then we are passing ${setString}, the keys, to the query. that is where we will then go into the rows update the keys with the object values from fields and return the new user data. 



double dollar sign = setting the value to the setstring is the value of the key index +1, youre setting the keys for the $1, $2....*/


const updateUser = async (id, fields = {}) => {
  // build the set string
    const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');
  
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

  /*******GET ALL USERS ********/

  /* we have function getallusers we are creating a variable to hold our query results from the client. it is calling 5 key values from the users table and returning it in our data object users for our api*/
  const getAllUsers = async () => {
    const { rows } = await client.query(
        `SELECT id, username, name, location, active
        FROM users;
        `);
        return rows;
}

/*******GET USER BY ID********/
/*we have a function  with one parameter userId. we are going to create a query that asks for all users whos id is equal to the id requested. then this will link to the post where the id matches. delte passwordis for security reasons so the password of the user is not sent with the returned information.*/
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

/*******CREATE POST ********/
/* our create post function is calling 3 parameters. we are making a request from the client to insert this 3 keys and their values into our object. then we are invoking the function to link the tags to the posts with the matching post ids */
  const createPost= async ({
    authorId,
    title,
    content,
    tags = []
  }) => 
   {
    try {
        const { rows: [ post ] } = await client.query(`
        INSERT INTO  posts ( "authorId", title, content) 
        VALUES  ($1, $2, $3) 
        RETURNING *;
        `, [authorId, title, content]);
        const tagList = await createTags(tags);

    return await addTagsToPost(post.id, tagList);
  } catch (error) {
    throw error;
  }
}

/*******CREATE POST TAG********/
async function createPostTag(postId, tagId) {
  try {
    await client.query(`
      INSERT INTO post_tags("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `, [postId, tagId]);
  } catch (error) {
    throw error;
  }
}

/*******ADD TAGS TO POST ********/
async function addTagsToPost(postId, tagList) {
  try {
    console.log(tagList)
    const createPostTagPromises = tagList.map(
      tag => createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
}

/*******UPDATE POST********/
  const updatePost = async ( postId, fields = {}) => {
   // read off the tags & remove that field 
   const { tags } = fields; // might be undefined
   delete fields.tags;
 
   // build the set string
   const setString = Object.keys(fields).map((key, index) => `"${ key }"=$${ index + 1 }`).join(', ');
 
   try {
     // update any fields that need to be updated
     if (setString.length > 0) {
       await client.query(`
         UPDATE posts
         SET ${ setString }
         WHERE id=${ postId }
         RETURNING *;
       `, Object.values(fields));
     }
 
     // return early if there's no tags to update
     if (tags === undefined) {
       return await getPostById(postId);
     }
 
     // make any new tags that need to be made
     const tagList = await createTags(tags);
     const tagListIdString = tagList.map(
       tag => `${ tag.id }`
     ).join(', ');
 
     // delete any post_tags from the database which aren't in that tagList
     await client.query(`
       DELETE FROM post_tags
       WHERE "tagId"
       NOT IN (${ tagListIdString })
       AND "postId"=$1;
     `, [postId]);
 
     // and create post_tags as necessary
     await addTagsToPost(postId, tagList);
 
     return await getPostById(postId);
   } catch (error) {
     throw error;
   }
 }

 /*******GET ALL POSTS********/
  const getAllPosts = async () => {
    const { rows } = await client.query(
        `SELECT *
        FROM posts;
        `);
        return rows;
}

/*******GET ALL TAGS********/
const getAllTags = async () => {
  const { rows } = await client.query(
    `SELECT *
     FROM tags;`
  );
  return rows;
}

/*******GET POSTS BY USER********/
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

 /*******CREATE TAGS********/
 async function createTags(tagList) {
    if (tagList.length === 0) { 
      return; 
    }
  
    // need something like: $1), ($2), ($3 
    const insertValues = tagList.map(
      (_, index) => `$${index + 1}`).join('), (');
    // then we can use: (${ insertValues }) in our string template
  
    // need something like $1, $2, $3
    const selectValues = tagList.map(
      (_, index) => `$${index + 1}`).join(', ');
    // then we can use (${ selectValues }) in our string template
  //   next({
  //     name: 'NoMatchingPost',
  //     message: 'Error, No Matches!'
  // })
    try {
      const { rows: tags } = await client.query(`
    INSERT INTO tags(name)
    VALUES (${ insertValues})
    ON CONFLICT ("name") DO NOTHING
    RETURNING *;
    `, tagList);
   return tags
    } catch (error) {
      throw error;
    }
  }
  
 /*******GET POST BY ID ********/
  async function getPostById(postId) {
    try {
      const { rows: [ post ]  } = await client.query(`
        SELECT *
        FROM posts
        WHERE id=$1;
      `, [postId]);

      if (!post) {
        throw {
          name: "PostNotFoundError",
          message: "Could not find a post with that postId"
        };
      }
  
      const { rows: tags } = await client.query(`
        SELECT tags.*
        FROM tags
        JOIN post_tags ON tags.id=post_tags."tagId"
        WHERE post_tags."postId"=$1;
      `, [postId])
  
      const { rows: [author] } = await client.query(`
        SELECT id, username, name, location
        FROM users
        WHERE id=$1;
      `, [post.authorId])
  
      post.tags = tags;
      post.author = author;
  
      delete post.authorId;
  
      return post;
    } catch (error) {
      throw error;
    }
  }

  /*******GET POST BY TAG NAME ********/
  async function getPostsByTagName(tagName) {
    try {
      const { rows: postIds } = await client.query(`
        SELECT posts.id
        FROM posts
        JOIN post_tags ON posts.id=post_tags."postId"
        JOIN tags ON tags.id=post_tags."tagId"
        WHERE tags.name=$1;
      `, [tagName]);
  
      const posts = await Promise.all(postIds.map(
        post => getPostById(post.id)

      ));
      return posts;
    } catch (error) {
      throw error;
    }
  } 

  /*******GET USER BY USERNAME ********/
  async function getUserByUsername(username) {
    try {
      const { rows: [user] } = await client.query(`
        SELECT *
        FROM users
        WHERE username=$1;
      `, [username]);
  
      return user;
    } catch (error) {
      throw error;
    }
  }
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
  createPostTag,
  addTagsToPost,
  getPostById,
  createTags,
  getPostsByTagName,
  getAllTags,
  getUserByUsername
}