const { getQuery } = require("../db");
const dbQuery = getQuery();

const getUser = async() => {
    const user  = await dbQuery("select * from user");
    return user;
}

const checkExistUser =  async(username) => {
    const user  = await dbQuery(`select * from user where username = '${username}'`);
    return user.length > 0;
}

const getUserByUsername =  async(username) => {
    const user  = await dbQuery(`select * from user where username = '${username}'`);
    return user;
}

const register = async(name, username, password) => {
    try{
        const user  = await dbQuery(`insert into user values('${name}','${username}','${password}')`);
        return true;
    }catch(err){
        return false;
    }
    
}

module.exports = {getUser, checkExistUser, register, getUserByUsername};