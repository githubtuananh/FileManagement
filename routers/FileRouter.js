const express = require("express");
const router = express.Router();
const userService = require("../service/userService");
const fs = require("fs");
const FileReader = require('../helper/fileReader');
const formidable = require("formidable");
const path = require("path");

const getCurrentDir = async (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    const { userRoot } = req.session.user;
    let { dir } = req.query;
    if (dir == undefined) {
        dir = '';
    }
    let currentDir = `${userRoot}/${dir}`;
    if (!fs.existsSync(currentDir)) {
        currentDir = userRoot;
    }
    req.vars.currentDir = currentDir;
    req.vars.userRoot = userRoot;
    next()
}

router.get("/", getCurrentDir, async (req, res) => {
    let { userRoot, currentDir } = req.vars;
    const user = req.session.user;
    try {
        const files = FileReader.load(userRoot, currentDir);
        return res.render("index", { csrfToken: req.csrfToken(), files, email: user.username, name: user.name });
    } catch (error) {
        return res.status(400).json({ code: 400, error });
    }
});

router.post("/upload", async (req, res) => {
    const form = formidable({ multiples: true });
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({ code: 400, message: err.message });
        }
        const { username, path } = fields;
        let { root } = req.vars;
        const { userRoot } = req.session.user;
        let currentPath = '';
        let subPath = '';
        const name = files.file.originalFilename;
        if (name == '') {
            return res.json({ code: 400, message: "Không được bỏ trống" });
        }
        if (path == 'null') {
            currentPath = `${userRoot}`;
            subPath = '\\' + name;
        } else {
            currentPath = `${userRoot}${path}`;
            subPath = '\\' + path + '\\' + name;
        }
        if (!username || !files) {
            return res.json({ code: 400, message: "Thông tin không hợp lệ" });
        }
        if (!fs.existsSync(currentPath)) {
            return res.json({ code: 400, message: "Sai đường dẫn" });
        } else {
            try {
                let filePath = currentPath + '/' + name;
                let message = 'Upload thành công';
                let code = 200;
                if (fs.existsSync(filePath)) {
                    message = 'Cập nhật thành công';
                    code = 201;
                }
                fs.copyFileSync(files.file.filepath, filePath);
                const data = FileReader.loadOneFile(userRoot, filePath, name);
                return res.status(200).json({ code, message, files: data, subPath });
            } catch (err) {
                return res.status(500).json({ code: 500, message: "Lỗi upload file", error: err });
            }
        }
    })
})

router.post("/rename", async (req, res) => {
    const { userRoot } = req.session.user;
    const { namefilenew, namefileold, dir } = req.body;
    if (namefilenew == '') {
        return res.json({ code: 400, message: "Không được bỏ trống" });
    }
    let newRootPath = '';
    let currentRootPath = '';
    let newPath = '';
    let ext = path.extname(namefileold);
    if (dir == null) {
        newRootPath = userRoot + namefilenew + ext;
        newPath = '/' + namefilenew + ext;
    } else {
        newRootPath = userRoot + dir + '/' + namefilenew + ext;
        newPath = '/' + dir + '/' + namefilenew + ext;
    }
    if (dir == null) {
        currentRootPath = userRoot + namefileold;
    } else {
        currentRootPath = userRoot + dir + '/' + namefileold;
    }

    let stats = fs.statSync(currentRootPath);
    if (stats.isDirectory()) {
        if (dir == null) {
            newPath = `?dir=${namefilenew}`;
        } else {
            newPath = `?dir=${dir}/${namefilenew}`;
        }
    }

    if (fs.existsSync(newRootPath)) {
        return res.json({ code: 500, message: "Tên này đã tồn tại" });
    }
    fs.rename(currentRootPath, newRootPath, (err) => {

        if(err) return res.json({ code: 400, message: "Đổi tên thất bại" });
        const data = FileReader.loadOneFile(userRoot, newRootPath, namefilenew+ext);
        return res.json({
            code: 200, message: "Đổi tên thành công", files: data,
        });

        // if (!err) return res.json({
        //     code: 200, message: "Đổi tên thành công", newfile: {
        //         newPath,
        //         name: namefilenew + ext,
        //     }
        // });
        // return res.json({ code: 400, message: "Đổi tên thất bại" });
    })
})

router.post("/new-folder", (req, res) => {
    let { name, dir } = req.body;
    const { userRoot } = req.session.user;
    let path = '';

    if (dir == null) {
        path = `${userRoot}${name}`
        dir = `?dir=${name}`
    } else {
        path = `${userRoot}${dir}/${name}`
        dir = `?dir=${dir}/${name}`
    }
    if (fs.existsSync(path)) {
        return res.json({ code: 400, message: "Thư mục này đã tồn tại" });
    }
    try {
        fs.mkdirSync(path);
        const data = FileReader.loadOneFile(userRoot, path, name);
        return res.json({
            code: 200, message: "Tạo thư mục thành công", folder: {
                name,
                dir,
                data,
            }
        });
    } catch (error) {
        return res.json({ code: 400, message: "Tạo thư mục thất bại" });
    }
})

router.post("/delete", (req, res) => {
    const { userRoot } = req.session.user;
    let { name, dir } = req.body;
    let path = '';
    if (dir == null) {
        path = `${userRoot}${name}`
    } else {
        path = `${userRoot}${dir}/${name}`
    }
    try {
        let stats = fs.statSync(path);
        if (stats.isDirectory()) {
            fs.rmSync(path, { recursive: true })
        } else {
            fs.unlinkSync(path);
        }
        return res.json({ code: 200, message: "Xóa thành công", data: { name, dir } });
    } catch (error) {
        return res.json({ code: 400, message: "Xóa thất bại" })
    }
});

router.post("/new-file", (req, res) => {
    let { name, content, dir } = req.body;
    const { userRoot } = req.session.user;
    let path = '';
    name = name + '.txt'

    if (dir == null) {
        path = `${userRoot}${name}`
        dir = `${name}`
    } else {
        path = `${userRoot}${dir}/${name}`
        dir = `${dir}/${name}`
    }

    if (fs.existsSync(path)) {
        return res.json({ code: 500, message: "File này đã tồn tại" });
    }

    fs.appendFile(path, content, function (err) {
        if (err) return res.json({ code: 400, message: "Thêm thất bại" });
        const data = FileReader.loadOneFile(userRoot, path, name);
        return res.json({
            code: 200, message: "Thêm thành công", files: data, data: {
                name: name,
                dir,
            }
        });
    });
})

router.post("/download-file", (req, res) => {
    let { name, dir } = req.body;
    const { userRoot } = req.session.user;

    let path = '';
    if (dir == null) {
        path = `${userRoot}${name}`
        dir = `${name}`
    } else {
        path = `${userRoot}${dir}/${name}`
        dir = `${dir}/${name}`
    }
    return res.json({ code: 200, path });
})

const admz = require('adm-zip');
const { log } = require("console");
router.get('/download/:path', (req, res) => {
    const path = req.params.path;
    let stats = fs.statSync(path);
    const arr = path.split("\\");
    let name = arr[arr.length - 1] + '.zip';
    if (stats.isDirectory()) {
        // C1: Download folder not contain folder
        var to_zip = fs.readdirSync(path);
        var zp = new admz();
        for (var k = 0; k < to_zip.length; k++) {
            zp.addLocalFile(path + '/' + to_zip[k])
        }
        const data = zp.toBuffer();

        res.set('Content-Disposition', `attachment; filename=file_zip.zip`);
        return res.send(data);

        //C2: Download all

    }
    return res.download(path);
})

router.get('/download-zip', (req, res) => {

})

router.post('/search', (req, res) => {
    const { keySearch, dir } = req.body;
    const { userRoot } = req.session.user;
    let currentDir = userRoot;
    let subPath = '';
    if (dir == null) {
        currentDir = userRoot;
        subPath = '';
    } else {
        currentDir = userRoot + dir + '/';
        subPath = dir + '/';
    }
    const listPath = keySearch.split('/');
    const name = listPath[listPath.length - 1];

    if (keySearch.charAt(keySearch.length - 1) == "/") {
        const pathSplit = keySearch.split('/');
        pathSplit.forEach(e => {
            currentDir += `${e}/`;
            subPath += `${e}/`;
        });
        currentDir = currentDir.slice(0, -1);
        subPath = subPath.slice(0, -2);


        if (fs.existsSync(currentDir)) {
            let stats = fs.statSync(currentDir);
            if (stats.isDirectory()) {
                const file = FileReader.load(userRoot, currentDir);
                return res.json({ code: 200, message: "Thư mục /", file, dir: subPath });
            } else {
                if (keySearch.charAt(keySearch.length - 1) == "/") {
                    return res.json({ code: 200, message: "Không có /" });
                } else {
                    const file = FileReader.loadOneFile(userRoot, currentDir, name);
                    return res.json({ code: 200, message: "File /", file, dir: currentDir });
                }
            }
        }
        return res.json({ code: 400, message: "Không có /" });
    }
    else {
        currentDir = currentDir + keySearch;
        if (fs.existsSync(currentDir)) {
            const file = FileReader.loadOneFile(userRoot, currentDir, name);
            let stats = fs.statSync(currentDir);
            if (stats.isDirectory()) {
                if (keySearch == '') {
                    const files = FileReader.load(userRoot, currentDir);
                    return res.json({ code: 200, message: "Thư mục", file: files, dir: currentDir });
                }
                return res.json({ code: 200, message: "Thư mục", file, dir: currentDir });
            } else {
                return res.json({ code: 200, message: "File", file, dir: currentDir });
            }
        }
        return res.json({ code: 400, message: "Không có" });
    }
})

module.exports = router;