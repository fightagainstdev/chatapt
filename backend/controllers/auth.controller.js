import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";

export const signup = async (req, res) => {
	try {
		const { fullName, username, password, confirmPassword, gender } = req.body;

		console.log("Received signup data:", { fullName, username, password: password ? "[HIDDEN]" : "UNDEFINED", confirmPassword: confirmPassword ? "[HIDDEN]" : "UNDEFINED", gender });

		if (password !== confirmPassword) {
			return res.status(400).json({ error: "密码不匹配" });
		}

		const user = await User.findOne({ username });

		if (user) {
			return res.status(400).json({ error: "用户名已存在" });
		}

		// HASH PASSWORD HERE
		console.log("Generating salt...");
		const salt = await bcrypt.genSalt(10);
		console.log("Salt generated, hashing password...");
		const hashedPassword = await bcrypt.hash(password, salt);
		console.log("Password hashed successfully");

		// https://avatar-placeholder.iran.liara.run/

		const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
		const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

		const newUser = new User({
			fullName,
			username,
			password: hashedPassword,
			gender,
			profilePic: gender === "male" ? boyProfilePic : girlProfilePic,
		});

		if (newUser) {
			// Generate JWT token here
			generateTokenAndSetCookie(newUser._id, res);
			await newUser.save();

			res.status(201).json({
				_id: newUser._id,
				fullName: newUser.fullName,
				username: newUser.username,
				profilePic: newUser.profilePic,
			});
		} else {
			res.status(400).json({ error: "无效的用户数据" });
		}
	} catch (error) {
		console.log("注册控制器错误", error.message);
		res.status(500).json({ error: "内部服务器错误" });
	}
};

export const login = async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ username });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) {
			return res.status(400).json({ error: "无效的用户名或密码" });
		}

		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			username: user.username,
			profilePic: user.profilePic,
		});
	} catch (error) {
		console.log("登录控制器错误", error.message);
		res.status(500).json({ error: "内部服务器错误" });
	}
};

export const logout = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "成功登出" });
	} catch (error) {
		console.log("登出控制器错误", error.message);
		res.status(500).json({ error: "网络错误" });
	}
};
