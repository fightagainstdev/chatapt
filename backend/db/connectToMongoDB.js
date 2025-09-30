import mongoose from "mongoose";

const connectToMongoDB = async () => {
	try {
		await mongoose.connect(process.env.MONGO_DB_URI, {
			serverSelectionTimeoutMS: 30000, // 30 seconds timeout
			socketTimeoutMS: 45000, // 45 seconds socket timeout
		});
		console.log("已连接到MongoDB");
	} catch (error) {
		console.log("连接MongoDB错误", error.message);
		process.exit(1); // Exit if cannot connect to database
	}
};

export default connectToMongoDB;
