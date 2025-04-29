import mongoose from 'mongoose';

export const dbConnection = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      dbName: 'svpnew',
    })
    .then(() => {
      console.log('Connected to HJ database MONGO atlas NEW EDITED !');
    })
    .catch((err) => {
      console.log(
        `Some error occured while connecting to HJ database MONGO atlas NEW EDITED : ${err}`
      );
    });
};
