const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const helmet = require("helmet")

const dotenv = require("dotenv")
dotenv.config()

const Router = require("./routes/routes")

const app = express()

app.use(helmet())
app.use(bodyParser.json())
app.use(cors())

app.use(Router)

app.listen(process.env.port, console.log('Running', process.env.port))