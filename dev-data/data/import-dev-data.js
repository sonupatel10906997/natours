/*README : 
to delete all data : node dev-data/data/import-dev-data.js --delete
to import fresh data: node dev-data/data/import-dev-data.js --import
*/
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
//load the config file to process
dotenv.config({ path: './config.env' });

const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`));

//database
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Db connection successful');
  });

// tours.map(async (el) => {
//   try {
//     await Tour.create(el);
//   } catch (err) {
//     console.log(err);
//   }
// });

//IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data is loaded successfully!!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

//DELETE DATA FROM DB
const deleteAllData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data Successfully Deleted!!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

//COMMAND LINE ARGUMENT CHECK
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteAllData();
}

//only during development to check how the arguments appear
//console.log(process.argv);
