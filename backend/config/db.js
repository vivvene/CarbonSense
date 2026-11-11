import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("Testing MongoDB connection...");

    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 10000,
    });

    console.log("MongoDB Connected:", connection.connection.host);

    console.log("Database:", connection.connection.name);

    return connection;
  } catch (error) {
    console.error("MongoDB Connection Failed!");
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    if (error.cause) {
      console.error("Underlying cause:", error.cause.message);
    }

    throw error;
  }
};

export default connectDB;
