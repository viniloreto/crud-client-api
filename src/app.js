const express = require('express');
const bodyParser = require('body-parser');
let cors = require('cors')

const corsOptions = {
    origin: '*'
}

const app = express();

app.use(cors(corsOptions))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

require('./controllers/index')(app);


app.listen(process.env.PORT || 8082);