const mongoose = require("mongoose")
const Counter = require('../models/counter');


const initializeCounter = async () => {
    const existingCounter = await Counter.findOne({ name: 'orderId' });
    if (!existingCounter) {
      await Counter.create({ name: 'orderId', seq: 0 });
      console.log('Counter initialized');
    } else {
      console.log('Counter already exists');
    }
  };

const connectDB =async()=>{
    try{
        const databaseName = process.env.MONGO_DATABASENAME;
        const options = {
        dbName: databaseName,
        };
        const conn =  await mongoose.connect(process.env.MONGO_URI,options)
        console.log(`MongoDB Connected:${conn.connection.host}`.magenta.bold.underline) 
        await initializeCounter();
    }
    catch(error){ 
        console.log(error)
        process.exit(1)
    }
}

// // Remove a field from a document
// async function removeField() {
//     try {
//       await hospital.updateOne(
//         {}, // Filter to find the document
//         { $unset: { user: "" } } // Unset the field 'age'
//       );
//       console.log("Field removed successfully.");
//       mongoose.connection.close();
//     } catch (error) {
//       console.error("Error removing field:", error);
//     }
//   }

//   removeField()
module.exports = connectDB