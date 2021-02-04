const express = require('express')
const port = process.env.PORT || 3000
const app = express()

app.use(express.static(__dirname + '/public'))

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.set('views', './views')

app.set('view engine', 'pug')

app.use(require('./routes/index'))

app.listen(port, () => console.log(`Server listening on port ${port}`))