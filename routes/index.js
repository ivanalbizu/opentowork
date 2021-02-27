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
app.get('/contacts/listar', (req, res) => {
  res.render('contacts/listar')
})
app.get('/contacts/crear', (req, res) => {
  res.render('contacts/crear')
})
app.get('/html-builder', (req, res) => {
  res.render('mjml/html-builder')
})
app.get('/html-builder/:id', (req, res) => {
  const id = req.params.id
  console.log('id :>> ', id);
  res.render('mjml/html-builder-template-ID', {
    id
  })
})

app.get('/email', (req, res) => {
  res.render('email')
})
app.post('/email', async(req, res) => {
  try {
    await main(req.body)
    res.json(req.body)
  } catch (err) {
    res.status(401).json({
      error: true,
      err
    })
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
    from: `"Iván Albizu" <${data.authUser}>`,
    to: data.addressee,
    subject: data.subject,
    text: data.html.replace(/<[^>]+>|&nbsp;/g, ''),
    html: data.html,
  })

  console.log("Message sent: %s", info.messageId)
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
}


module.exports = app
