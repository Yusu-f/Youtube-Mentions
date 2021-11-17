const express = require("express")
const router = express.Router();

const controller = require("../controller/controller")

router.get('/', controller.getHomePage)

router.get('/getData', controller.getData)

module.exports = router