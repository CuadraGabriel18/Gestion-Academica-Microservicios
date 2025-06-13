const mongoose = require("mongoose");

const connectDB = async () => {
    const URL = process.env.MONGO_URI || "mongodb://Gabriel:123@localhost:27018/auth-api?authSource=admin";

    try {
        await mongoose.connect(URL);
        console.log("✅ Database connected successfully");
    } catch (error) {
        console.error("❌ Could not connect to the database");
        console.error(error);
        process.exit(1);
    }
};

module.exports = { connectDB };
