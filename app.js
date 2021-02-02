const express = require('express')
const port = process.env.PORT || 3000
const app = express()
const nodemailer = require("nodemailer")

app.use(express.static(__dirname + '/public'));

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.set('views', './views')

app.set('view engine', 'pug')

app.get('/', (req, res) => {
  res.render('home')
})


async function main() {
  const sender = "unai_albizu@yahoo.com"
  const transporter = nodemailer.createTransport({
    host: 'smtp.mail.yahoo.com',
    port: 465,
    service:'yahoo',
    secure: true,
    auth: {
      user: sender,
      pass: 'cpzqywvoydslggeq'
    },
    debug: false,
    logger: true
  })

  let info = await transporter.sendMail({
    from: `"Fred Foo 👻" <${sender}>`,
    to: "ivan.gonzalez@redegal.com",
    subject: "Hello ✔",
    text: "Hello world?",
    html: "<b>Hello world?</b>",
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}
app.get('/mail', (req, res) => {
  main().catch(console.error);
  res.render('home')
})

app.listen(port, () => console.log(`Server listening on port ${port}`))