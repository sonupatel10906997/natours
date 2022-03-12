const mongoose = require('mongoose');
const dotenv = require('dotenv');

//handle unCaught exception, this should be start of all code
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception !! . Shutting down System .....');
  console.log(err.name, err.message);
  process.exit(1);
});

//load the config file to process
dotenv.config({ path: './config.env' });
const app = require('./app');
//const Tour = require('./models/tourModel');

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

//creating documents
// const testTour = new Tour({
//   name: 'The Park Camper',
//   price: 997,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('ERROR: ', err);
//   });

// 7. start server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port} ...`);
});

//Unhandled Rejected Promises and shutting down server
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Shutting down System .....');
  server.close(() => {
    process.exit(1);
  });
});
