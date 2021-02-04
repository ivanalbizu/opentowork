const express = require('express')
const app = express()
const nodemailer = require("nodemailer")

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
      pass: 'fake!'
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
  })

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
}
app.get('/mail', (req, res) => {
  main().catch(console.error)
  res.render('home')
})

module.exports = app
