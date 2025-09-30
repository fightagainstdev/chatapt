import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const protectRoute = async (req, res, next) => {
	try {
		const token = req.cookies.jwt;

		if (!token) {
			return res.status(401).json({ error: "未经授权 - 未提供令牌" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		if (!decoded) {
			return res.status(401).json({ error: "未经授权 - 无效令牌" });
		}

		const user = await User.findById(decoded.userId).select("-password");

		if (!user) {
			return res.status(404).json({ error: "用户未找到" });
		}

		req.user = user;

		next();
	} catch (error) {
		console.log("保护路由中间件错误：", error.message);
		res.status(500).json({ error: "内部服务器错误" });
	}
};

export default protectRoute;
