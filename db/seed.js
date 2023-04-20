// grab our client with destructuring from the export in index.js
const { 
    client,
    getAllUsers,
    createUser
 } = require('./index');

//now we are going to create some users
async function createInitialUsers() {
    try{
        console.log("Creating the Users");
        const albert = await createUser({ username: 'albert', password: 'bertie99'});
        const sandra = await createUser({ username: 'sandra', password: '2sandy4me'});
        const glamgal = await createUser({ username: 'glamgal', password: 'soglam'});
        
        console.log("Users are Created!")
    
    } catch(error) {
        console.error("Just kidding nothing happened...");
        throw error;
    }
}

//this is bringing all of the table data from our database to where we can use it
//its searching for the table and if it exists we are pulling all of its data
async function dropTables() {
    try {
        console.log("Starting to drop tables!")
        await client.query(`
        DROP TABLE IF EXISTS users;
        `);
      console.log("Thy table has been dropped!")
    } catch (error) {
        console.error("Well, that didnt work....")
        throw error;
    }
}
// this is going to move that data to a format to read in the code
async function createTables() {
    try {
        console.log("Found my hammer, table on the way!")
        await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username varchar(255) UNIQUE NOT NULL,
        password varchar(255) NOT NULL
      );
    `);
        console.log("Tables done. Double tapped for good measure.")
    } catch (error) {
        console.error("Made an error making tables!")
        throw error;
    }
}
//this is going to create the tables we need from that data
async function rebuildDB() {
    try {
        client.connect();

        await dropTables();
        await createTables();
        await createInitialUsers();
    } catch (error) {
       throw error;
    }
}
async function testDB() {
    try {
      console.log("Testing, Testing 1,2...?")
  
      // queries are promises, so we can await them
      const users = await getAllUsers();
      console.log("getAllUsers:", users);
  
      //We are logging to keep track of the processes for now
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

