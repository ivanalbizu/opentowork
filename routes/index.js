const express = require('express')
const app = express()
const nodemailer = require("nodemailer")

app.get('/', (req, res) => {
  res.render('home')
})

app.get('/transporters/listar', (req, res) => {
  res.render('transporters/listar')
})
app.get('/transporters/crear', (req, res) => {
  res.render('transporters/crear')
})

app.get('/email', (req, res) => {
  res.render('email')
})
app.post('/email', async(req, res) => {
  try {
    await main(req.body)
    res.json(req.body)
  } catch (error) {
    res.status(401).json(error);
  }
})


const main = async data => {
  const transporter = nodemailer.createTransport({
    host: data.host,
    port: +data.port,
    service: data.service,
    secure: data.secure,
    auth: {
      user: data.authUser,
      pass: data.authPass
    },
    debug: false,
    logger: true
  })

  const info = await transporter.sendMail({
    from: `"Fred Foo 👻" <${data.authUser}>`,
    to: data.addressee,
    subject: data.subject,
    text: "Hello world?",
    html: data.html,
  })

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
}


module.exports = app
