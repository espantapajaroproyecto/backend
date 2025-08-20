const dbService = require("../services/dbService");
// import dbService from "../services/dbService"


module.exports.handler = async () => {

    try {
        const usuarios = await dbService.obtenerUsuarios()
        
        
    } catch (error) {
        console.error(error);
        
    }
}
