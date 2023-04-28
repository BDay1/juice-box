// grab our client with destructuring from the export in index.js
const { 
    client,
    createUser,
    updateUser,
    getAllUsers,
    getUserById,
    createPost,
    updatePost,
    getAllPosts,
    getPostsByUser,
    createTags,
    addTagsToPost,
    getPostsByTagName
 } = require('./index');



/*******DROP TABLES ********/
const dropTables = async () => {
    try {
        console.log("Starting to drop tables!")
        await client.query(`
        DROP TABLE IF EXISTS post_tags;
        DROP TABLE IF EXISTS tags;
        DROP TABLE IF EXISTS posts;
        DROP TABLE IF EXISTS users;
        `);
      console.log("Thy table has been dropped!")
    } catch (error) {
        console.error("Well, that didnt work....")
        throw error;
    }
}


/*******CREATE TABLES ********/
// this is going to move that data to a format to read in the code and create our tables for our data

const createTables = async () => {
    try {
        console.log("Found my hammer, table on the way!")
        await client.query(`
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username varchar(255) UNIQUE NOT NULL,
            password varchar(255) NOT NULL,
            name varchar(255) NOT NULL,
            location varchar(255) NOT NULL,
            active boolean DEFAULT true
          );
          CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id),
            title varchar(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
          );
          CREATE TABLE tags(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL
            );
          CREATE TABLE post_tags(
            "postId" INTEGER REFERENCES posts(id),
            "tagId" INTEGER REFERENCES tags(id),
            UNIQUE ("postId", "tagId")
                    );
          `);
        console.log("Tables done. Double tapped for good measure.")
    } catch (error) {
        console.error("Made an error making tables!")
        throw error;
    }
}

/*******CREATE USERS ********/

// we are creating our first users
async function createInitialUsers() {
    try{ 
        console.log("Creating the Users");
        await createUser({ 
            username: 'albert', 
            password: 'bertie99',
            name: 'Al Bert',
            location: 'Sidney, Australia' 
          });
          await createUser({ 
            username: 'sandra', 
            password: '2sandy4me',
            name: 'Just Sandra',
            location: 'Ain\'t tellin\''
          });
          await createUser({ 
            username: 'glamgal',
            password: 'soglam',
            name: 'Joshua',
            location: 'Upper East Side'
          });
        console.log("Users are Created!")
    
    } catch(error) {
        console.error("Just kidding nothing happened...");
        throw error;
    }
}




/*******CREATE POSTS ********/

// we are getting the initial posts to put in our empty post array. we are invoking the get all users so we can get the array we are defining of our three users, then creating a post with the keys with values, authorId, title, and content.
const createInitialPosts = async () => {
    try {
        console.log("making first posts")
        const [albert, sandra, glamgal] = await getAllUsers();

        await createPost({
            authorId: albert.id,
            title: "First Post",
            content: "This is my first post..........",
            tags: ["#noideawhatimdoing", "#ilovepie"]
          });
           console.log("alberts done");

        await createPost({
            authorId: sandra.id,
            title: "First Post!",
            content: "Made blueberry Pies! ",
            tags: ["#happy", "#ilovepie"]
          });
          console.log("sandras done");

        await createPost({
            authorId: glamgal.id,
            title: "Did this post?",
            content: "I dont know technology, did it work? ",
            tags: ["#whatsatag?"]
          }); 
           console.log("glamgals done");

    } catch (error) {
        throw error;
      }
}

/*******CREATE TAGS********/
async function createInitialTags() {
  try {
    console.log("Starting to create tags...");

    const [happy, inspo, pies, confused] = await createTags([
      '#happy', 
      '#ilovepie', 
      '#noideawhatiamdoing',
      '#whatsatag'
    ]);

    const [postOne, postTwo, postThree] = await getAllPosts();

    await addTagsToPost(postOne.id, [happy, pies]);
    await addTagsToPost(postTwo.id, [sad, pies]);
    await addTagsToPost(postThree.id, [happy, confused, inspo]);

    console.log("Finished creating tags!");
  } catch (error) {
    console.log("Error creating tags!");
    throw error;
  }
}
//this is going to create the tables we need from that data
const rebuildDB = async () => {
    try {
        client.connect();

        await dropTables();
        await createTables();
        await createInitialUsers();
        await createInitialPosts();
       // await createInitialTags();
        
    } catch (error) {
       throw error;
    }
}

/******* TESTS ********/
const testDB = async () => {
    try {
      console.log("Testing, Testing 1,2...?")
  
      // queries are promises, so we can await them
      const users = await getAllUsers();
      console.log("Result:", users);

      console.log("Calling updateUser on users[0]")
    const updateUserResult = await updateUser(users[0].id, {
      name: "Newname Sogood",
      location: "Lesterville, KY"
    });
    console.log("Result:", updateUserResult);


    console.log("Calling getAllPosts");
    const posts = await getAllPosts();
    console.log("Result:", posts);

    console.log("Calling updatePost on posts[0]");
    const updatePostResult = await updatePost(posts[0].id, {
      title: "New Title",
      content: "Updated Content"
    });
    console.log("Result:", updatePostResult);

    console.log("Calling updatePost on posts[1], only updating tags");
        const updatePostTagsResult = await updatePost(posts[1].id, {
          tags: ["#youcandoanything", "#redfish", "#bluefish"]
        });

        console.log("Result:", updatePostTagsResult);
      await getUserById(1);
      
    console.log("Calling getUserById with 1");
    const albert = await getUserById(1);
    console.log("Result:", albert);


    console.log("Calling getPostsByTagName with #happy");
    const postsWithHappy = await getPostsByTagName("#happy");
    console.log("Result:", postsWithHappy);
      
      console.log("Thats it...IM DONE!");
      
      
    
    } catch (error) {
      console.error("It broke....no work...test fail");
     throw error;
    }
  }
  
  
  

rebuildDB()
  .then(testDB)
  .catch(console.error)
  .finally(() => client.end());


