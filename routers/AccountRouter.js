const express = require("express");
const router = express.Router();
const userService = require("../service/userService");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

router.get("/login", async (req, res) => {
    res.render("login", { csrfToken: req.csrfToken() });
});
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    let user = await userService.getUserByUsername(username);

    if (user.length == 0) {
        return res.json({ code: 400, message: "Tài khoản không tồn tại" });
    }
    const vaildPass = await bcrypt.compare(password, user[0].password);
    if (!vaildPass) return res.json({ code: 400, message: "Mật khẩu sai" });

    res.cookie("user", username);
    user[0].userRoot = `${req.vars.root}\\users\\${user[0].username}\\`;
    req.session.user = user[0];
    req.app.use(express.static(user[0].userRoot));
    return res.json({ code: 200, message: "Đăng nhập thành công" });
});

router.get("/register", async (req, res) => {
    res.render("register", { csrfToken: req.csrfToken() });
});
router.post("/register", async (req, res) => {
    const { name, username, password } = req.body;

    if (name == '' || username == '' || password == '') {
        return res.json({ code: 400, message: "Vui lòng điền đầy đủ" });
    } else {
        const user = await userService.checkExistUser(username);
        if (user) {
            return res.json({ code: 400, message: "Tài khoản đã tồn tại" });
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(password, salt);
            const result = userService.register(name, username, hashPassword);
            if (result) {
                //Tạo thư mục chứa file của user
                const { root } = req.vars;
                const userDir = `${root}/users/${username}`;
                fs.mkdirSync(userDir);

                return res.json({ code: 200, message: "Đăng ký thành công" });
            } else {
                return res.json({ code: 500, message: "Đăng ký thất bại" });
            }
        }
    }
});

router.get("/logout", (req, res) => {
    res.clearCookie("user");
    delete req.session.user;
    res.redirect("/login");
})

module.exports = router;