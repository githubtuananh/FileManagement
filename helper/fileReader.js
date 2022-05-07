const fs = require("fs");
const { fileTypes, fileIcons } = require("./typeFile");
const Path = require("path");
exports.load = (userRoot, location) => {
    let files = fs.readdirSync(location);
    let result = [];
    files.forEach(f => {
        let name = f;
        let path = location + '/' + name;
        if (location.endsWith('/')) {
            path = location + name;
        }
        let ext = Path.extname(name);
        let stats = fs.statSync(path);
        let type = 'File';
        let icon = fileIcons[ext] || '<i class="fas fa-file"></i>';
        let subPath = path.replace(userRoot, '');
        let size = stats.size + 'Bit';
        if (stats.size > 1024 * 1024) {
            size = Math.round(stats.size / 1024 / 1024);
            size = size + 'MB';
        } else if (stats.size > 1024) {
            size = Math.round(stats.size / 1024);
            size = size + 'KB';
        }
        let dir = '';
        let temp = '';
        if (subPath.startsWith('/')) {
            dir = subPath.substring(1);
        } else {
            dir = subPath;
        }
        dir = dir.split("/")
        for(let i = 0; i< dir.length - 1; i++){
            temp+=dir[i]+'/';
        }
        dir = temp.slice(0,-1);


        if (stats.isDirectory()) {
            size = '-';
            type = 'Folder';    
            if (subPath.startsWith('/')) {
                subPath = '?dir=' + subPath.substring(1);
            } else {
                subPath = '?dir=' + subPath;
            }
        }

        result.push({
            name,
            path,
            isDirectory: stats.isDirectory(),
            size,
            lastModified: stats.mtime,
            ext,
            type,
            icon,
            subPath,
            dir,
        })
    })
    return result;
}

exports.loadOneFile = (userRoot, location, name) => { 
    let stats = fs.statSync(location);
    let ext = Path.extname(name);
    let path = location;
    let type = 'File';
    let icon = fileIcons[ext] || '<i class="fas fa-file"></i>';
    let size = stats.size + 'Bit';
    let result = [];
    let subPath = path.replace(userRoot, '');

    if (stats.size > 1024 * 1024) {
        size = Math.round(stats.size / 1024 / 1024);
        size = size + 'MB';
    } else if (stats.size > 1024) {
        size = Math.round(stats.size / 1024);
        size = size + 'KB';
    }
    let dir = '';
    let temp = '';
    if (subPath.startsWith('/')) {
        dir = subPath.substring(1);
    } else {
        dir = subPath;
    }
    dir = dir.split("/")
    for(let i = 0; i< dir.length - 1; i++){
        temp+=dir[i]+'/';
    }
    dir = temp.slice(0,-1);

    if (stats.isDirectory()) {
        size = '-';
        type = 'Folder';
        if (subPath.startsWith('/')) {
            subPath = '?dir=' + subPath.substring(1);
        } else {
            subPath = '?dir=' + subPath;
        }
    }

    result.push({
        name,
        path: location,
        isDirectory: stats.isDirectory(),
        size,
        lastModified: stats.mtime,
        ext,
        type,
        icon,
        subPath,
        dir,
    })
    return result;
}