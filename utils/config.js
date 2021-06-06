require('dotenv').config();

const PORT = process.env.PORT;
const DB_CONNECTION_URL = process.env.NODE_ENV === 'test'
  ? process.env.TEST_DB_CONNECTION_URL
  : process.env.DB_CONNECTION_URL;

module.exports = { PORT, DB_CONNECTION_URL };