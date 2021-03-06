const toggleClass = (el, className) => {
  if (el.classList.contains(className)) {
    el.classList.remove(className)
  } else {
    el.classList.add(className)
  }
}

const elFactory = (type, attributes, ...children) => {
  const el = document.createElement(type)

  for (key in attributes) {
    el.setAttribute(key, attributes[key])
  }

  if (el instanceof HTMLInputElement && el.type == 'checkbox') {
    // this is a Hack. Property "value" does not really exist for input type "checkbox"
    if (el.value == 'true') el.setAttribute('checked', true)
  }

  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child))
    } else {
      el.appendChild(child)
    }
  })

  return el
}

// Only cases for this possible options
const inputType = text => {
  let type
  switch (text) {
    case 'boolean':
      type = 'checkbox'
      break
    case 'number':
      type = 'number'
      break
    default:
      type = 'text'
      break
  }
  return type
}

const postData = async (url = '', data = {}) => {
  const response = await fetch(url, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json'
    },
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data)
  })
  return await response.json()
}

const toast = (el, msg) => {
  el.textContent = msg
  el.classList.add('toast--active')
  el.addEventListener("animationend", () => el.classList.remove('toast--active'), false)
}

const getSiblings = elem => {
	return Array.prototype.filter.call(elem.parentNode.children, sibling => {
		return sibling !== elem
	})
}


const indexedDB = window.indexedDB
const transporterList = document.querySelector('.transporter-list')
const transporterLists = document.querySelector('.transporter-lists')
const selectTransporter = document.querySelector('.js-select-transporter')
const contacts = document.querySelector('#contacts')
const contactsDatalist = document.querySelector('#contacts-datalist')
const htmlTemplates = document.querySelector('#html-templates')
const gjs = document.querySelector('#gjs')
const emailSelect = document.querySelector('#email-select')
const quickview = document.querySelector('.quickview')
let idsTemplates = []

let db
const DB_NAME = 'nodemailer'
const DB_VERSION = 1
const STORE_NAME_TRANSPORTER = 'transporter'
const STORE_NAME_CONTACT = 'contact'
const STORE_NAME_GJS = 'templates'

if (indexedDB) {
  const request = indexedDB.open(DB_NAME, DB_VERSION)

  request.onupgradeneeded = () => {
    request.result.createObjectStore(STORE_NAME_TRANSPORTER, { keyPath: 'authUser' })
    request.result.createObjectStore(STORE_NAME_CONTACT, { keyPath: 'email' })
    request.result.createObjectStore(STORE_NAME_GJS, { keyPath: 'id' })
  }

  request.onsuccess = () => {
    db = request.result
    if (transporterList) drawTransporters(transporterList, 1)
    if (transporterLists) drawTransporters(transporterLists)
    if (selectTransporter) drawTransportersSelect(selectTransporter)
    if (contacts) drawContacts()
    if (contactsDatalist) drawContactsDatalist(contactsDatalist)
    if (htmlTemplates) drawHtmlDatalist(htmlTemplates)
    if (emailSelect) drawEmailPreview(emailSelect)
    if (quickview) counterDatabase()
    if (gjs) initGJS()
  }

  request.onerror = error => console.log('error :>> ', error)

  const counterDatabase = () => {
    const transactionContact = db.transaction([STORE_NAME_CONTACT])
    const objectStoreContact = transactionContact.objectStore(STORE_NAME_CONTACT)
    var countRequestContact = objectStoreContact.count()
    countRequestContact.onsuccess = () => {
      document.querySelector('.js-contact-number').innerHTML = countRequestContact.result || '0'
    }
    
    const transactionTemplate = db.transaction([STORE_NAME_GJS])
    const objectStoreTemplate = transactionTemplate.objectStore(STORE_NAME_GJS)
    var countRequestTemplate = objectStoreTemplate.count()
    countRequestTemplate.onsuccess = () => {
      document.querySelector('.js-template-number').innerHTML = countRequestTemplate.result || '0'
    }
    
    const transactionTransporter = db.transaction([STORE_NAME_TRANSPORTER])
    const objectStoreTransporter = transactionTransporter.objectStore(STORE_NAME_TRANSPORTER)
    var countRequestTransporter = objectStoreTransporter.count()
    countRequestTransporter.onsuccess = () => {
      document.querySelector('.js-transporter-number').innerHTML = countRequestTransporter.result || '0'
    }

  }

  const drawContacts = () => {
    const transaction = db.transaction([STORE_NAME_CONTACT])
    const objectStore = transaction.objectStore(STORE_NAME_CONTACT)

    objectStore.getAll().onsuccess = event => {
      const cursorValue = event.target.result
      const data = Object.values(cursorValue)

      const editCell = (cell, value, data, row, col) => {
        if (col === 0 || value === 'Actions') return

        let original
        cell.setAttribute('contenteditable', true)
        cell.setAttribute('spellcheck', false)

        cell.addEventListener('focus', event => original = event.target.textContent)
        cell.addEventListener('blur', event => {
          if (original === event.target.textContent) return

          const columns = (table.settings().init().columns).map(obj => obj.data)
          data[columns[col]] = event.target.textContent

          const transaction = db.transaction([STORE_NAME_CONTACT], 'readwrite')
          const objectStore = transaction.objectStore(STORE_NAME_CONTACT)
          const request = objectStore.get(data.email)

          request.onsuccess = () => {
            objectStore.put(data)
            table.row(row).data(data).draw(true)
            toast(document.querySelector('.toast'), 'Se ha actualizado correctamente')
          }
          request.onerror = () => {
            toast(document.querySelector('.toast'), 'Se ha producido un error al actualizar el contacto')
          }
        })
      }
      const deleteRow = cell => {
        cell.addEventListener("click", () => {
          const tr = cell.closest('tr')
          const email = tr.querySelector('td:first-child').textContent
          const transaction = db.transaction([STORE_NAME_CONTACT], 'readwrite')
          const objectStore = transaction.objectStore(STORE_NAME_CONTACT)
          const request = objectStore.delete(email)

          request.onsuccess = () => {
            toast(document.querySelector('.toast'), 'Se ha eliminado correctamente')
            table.row(tr).remove().draw()
          }
          request.onerror = () => {
            toast(document.querySelector('.toast'), 'No se ha podido eliminar el contacto')
          }
        })
      }
      const table = $('#contacts').DataTable({
        data: data,
        columns: [
          { data: 'email' },
          { data: 'name' },
          { data: 'surname' },
          { data: 'enterprise' },
          { data: 'position' },
          {
            data: "delete",
            width: "80px",
            className: "text-center"
          }
        ],
        columnDefs: [{ 
          targets: [1, 2, 3, 4],
          createdCell: editCell
        },
        {
          targets: -1,
          searchable: false,
          orderable: false,
          createdCell: deleteRow
        }]
      })

    }
  }

  const initGJS = () => {
    const id = typeof templateID !== 'undefined' ? templateID : 'other-id-1'
    const editor = grapesjs.init({
      container : '#gjs',
      avoidInlineStyle: false,
      fromElement: true,
      storageManager: {
        type: 'indexeddb',
        id: id,
      },
      plugins: ['grapesjs-indexeddb', 'grapesjs-mjml'],
      pluginsOpts: {
        'grapesjs-mjml': {},
        'grapesjs-indexeddb': {
          dbName: DB_NAME,
          objectStoreName: STORE_NAME_GJS
        }
      }
    })
    editor.on('storage:start:store', objectToStore => {
      if (editor.getConfig().plugins.includes('grapesjs-mjml')) {
        objectToStore.plainHTML = editor.runCommand('mjml-get-code').html
      }
    })
  }

  const deleteHtml = event => {
    event.preventDefault()
    const id = event.target.id
    const transaction = db.transaction([STORE_NAME_GJS], 'readwrite')
    const objectStore = transaction.objectStore(STORE_NAME_GJS)
    const request = objectStore.delete(id)
  
    request.onsuccess = () => {
      toast(document.querySelector('.toast'), 'Se ha eliminado correctamente')
      idsTemplates = idsTemplates.filter(e => e !== id)
      event.target.closest('li').remove()
    }
  }

  const drawHtmlDatalist = (parent) => {
    const transaction = db.transaction([STORE_NAME_GJS])
    const objectStore = transaction.objectStore(STORE_NAME_GJS)

    objectStore.getAll().onsuccess = event => {
      const cursorValue = event.target.result
      if (cursorValue.length === 0) return
      
      for (const iterator of cursorValue) idsTemplates.push(iterator.id)
      const fragment = new DocumentFragment()

      for (let index = 0; index < cursorValue.length; index++) {
        const field = cursorValue[index]
        const li = elFactory(
          'li', { class: 'template-item', id: `${field.id}` },
          elFactory('span', {}, `${field.id}`),
          elFactory('a', { class: 'btn btn--small', href: `/html-builder/${field.id}` }, 'editar'),
          elFactory('button', { type: 'submit', id: `${field.id}`, class: 'btn btn--danger btn--small js-delete-template' }, `Eliminar`)
        )
        fragment.appendChild(li)
        li.querySelector('.js-delete-template').addEventListener('click', deleteHtml, true)
      }
      parent.appendChild(fragment)
    }
  }

  const drawEmailPreview = (parent) => {
    const transaction = db.transaction([STORE_NAME_GJS])
    const objectStore = transaction.objectStore(STORE_NAME_GJS)

    objectStore.getAll().onsuccess = event => {
      const cursorValue = event.target.result
      if (cursorValue.length === 0) return
      
      for (const iterator of cursorValue) idsTemplates.push(iterator.id)
      const fragment = new DocumentFragment()

      for (let index = 0; index < cursorValue.length; index++) {
        const field = cursorValue[index]
        if (index === 0) {
          const option = elFactory(
            'option', { value: '', disabled: 'disabled', selected: 'true' }, 'Elige un template'
          )
          fragment.appendChild(option)
        }
        const option = elFactory(
          'option', { value: `${field.id}` }, `${field.id}`
        )
        fragment.appendChild(option)
      }
      parent.appendChild(fragment)
      const iframe = document.querySelector('#html')
      const iDoc = iframe.contentWindow.document

      parent.addEventListener('change', event => {
        iDoc.open('text/html', 'replace')
        iframe.style.height = '500px'
        const target = event.target.value
        const index = parent.selectedIndex-1
        const html = cursorValue[index][`${target}plainHTML`]

        iDoc.write(html)
        iDoc.close()
        iDoc.body.contentEditable = true
      }, true)
    }
  }

  const drawTransporters = (parent, quantity = 999999) => {
    const transaction = db.transaction([STORE_NAME_TRANSPORTER])
    const objectStore = transaction.objectStore(STORE_NAME_TRANSPORTER)

    objectStore.getAll().onsuccess = event => {
      const cursorValue = event.target.result
      if (cursorValue.length === 0) return

      for (let index = 0; index < cursorValue.length; index++) {
        const field = cursorValue[index]
        const card = elFactory('div', { class: 'card'})
        const header = elFactory('div', { class: 'card__header'},
          elFactory('div', { class: 'card__header-title text-light' }, field.authUser)
        )
        const buttons = elFactory('div', { class: 'button input-field' })
        const main = elFactory('div', { class: 'card__main'})

        card.appendChild(header)
        card.appendChild(main)
        const fragment = new DocumentFragment()
        fragment.appendChild(card)

        const form = document.createElement('form')
        form.classList.add('form')

        for (let fieldChild in field) {
          const markup = elFactory(
            'div', { class: `${fieldChild} input-field` },
            elFactory('label', { class: fieldChild == 'secure' ? 'label label--checkbox' : 'label'},
              elFactory('span', {}, fieldChild),
              elFactory('input', {
                type: inputType(typeof field[fieldChild]),
                value: field[fieldChild],
                name: `${fieldChild}-${field.authUser}`,
                id: `${fieldChild}-${field.authUser}`
              })
            ),
          )
          form.appendChild(markup)
        }
        form.appendChild(buttons)
        const buttonUpdate = elFactory('button', {
          class: 'btn',
          type: 'submit'
          },
          'Actualizar'
        )
        const buttonDelete = elFactory('button', {
          class: 'btn btn--danger',
          type: 'submit'
          },
          'Eliminar'
        )
        buttonUpdate.addEventListener('click', updateTransporter.bind(null, card), true)
        buttonDelete.addEventListener('click', deleteTransporter.bind(null, card), true)
        buttons.appendChild(buttonUpdate)
        buttons.appendChild(buttonDelete)
        main.appendChild(form)

        parent.appendChild(fragment)
        if (quantity-1 == index) break
      }
    }
  }

  const drawContactsDatalist = (parent) => {
    const transaction = db.transaction([STORE_NAME_CONTACT])
    const objectStore = transaction.objectStore(STORE_NAME_CONTACT)

    objectStore.getAll().onsuccess = event => {
      const cursorValue = event.target.result
      if (cursorValue.length === 0) return

      const fragment = new DocumentFragment()

      for (let index = 0; index < cursorValue.length; index++) {
        const field = cursorValue[index]
        const option = elFactory(
          'option', { value: `${field.email}` }, `${field.name} ${field.surname}`
        )
        fragment.appendChild(option)
      }
      parent.appendChild(fragment)
    }
  }

  const drawTransportersSelect = (parent) => {
    const transaction = db.transaction([STORE_NAME_TRANSPORTER])
    const objectStore = transaction.objectStore(STORE_NAME_TRANSPORTER)

    objectStore.getAll().onsuccess = event => {
      const cursorValue = event.target.result
      if (cursorValue.length === 0) return

      const fragment = new DocumentFragment()

      for (let index = 0; index < cursorValue.length; index++) {
        const field = cursorValue[index]
        const option = elFactory(
          'option', { value: `${field.authUser}` }, field.authUser
        )
        fragment.appendChild(option)
      }
      parent.appendChild(fragment)
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  addResizeListeners()
  setSidenavListeners()
  setUserDropdownListener()
  setMenuClickListener()
  setSidenavCloseListener()

  const btnSendEmail = document.querySelector('.js-send-email')
  if (btnSendEmail) {
    btnSendEmail.addEventListener('click', sendEmail, true)
  }
  const form = document.querySelector('#form')
  if (form) {
    form.addEventListener('submit', createTransporter, true)
  }
  const formContact = document.querySelector('.form-contact')
  if (formContact) {
    formContact.addEventListener('submit', createContact, true)
  }
  const createTemplate = document.querySelector('#create-template')
  const createTemplateBtn = document.querySelector('.js-create-template')
  if (createTemplate) {
    createTemplate.addEventListener('input', checkExistHtmlTemplate.bind(null, createTemplateBtn), true)
  }

})

const checkExistHtmlTemplate = (createTemplateBtn, event) => {
  const templateName = event.target.value
  const exist = idsTemplates.includes(templateName)
  if (exist || templateName === '') createTemplateBtn.setAttribute('href', '#!')
  else createTemplateBtn.setAttribute('href', `/html-builder/${templateName}`)
}

const createContact = event => {
  event.preventDefault()
  const target = event.target
  const data = {
    email: target.email.value,
    name: target.name.value,
    surname: target.surname.value,
    enterprise: target.enterprise.value,
    position: target.position.value,
    delete: "<button class='btn btn--danger btn--small' type='button'>Eliminar</button>"
  }
  const transaction = db.transaction([STORE_NAME_CONTACT], 'readwrite')
  const objectStore = transaction.objectStore(STORE_NAME_CONTACT)
  const request = objectStore.add(data)
  target.closest('form').reset()
  toast(document.querySelector('.toast'), 'Contacto creado correctamente')
}

const deleteTransporter = (card, event) => {
  event.preventDefault()
  const email = card.querySelector('.authUser input').value
  const transaction = db.transaction([STORE_NAME_TRANSPORTER], 'readwrite')
  const objectStore = transaction.objectStore(STORE_NAME_TRANSPORTER)
  const request = objectStore.delete(email)

  request.onsuccess = () => {
    toast(document.querySelector('.toast'), 'Se ha eliminado correctamente')
    card.remove()
  }
}

const updateTransporter = (card, event) => {
  event.preventDefault()

  const email = card.querySelector('.authUser input').value
  
  event.target.setAttribute('disabled', true)
  const transaction = db.transaction([STORE_NAME_TRANSPORTER], 'readwrite')
  const objectStore = transaction.objectStore(STORE_NAME_TRANSPORTER)
  const request = objectStore.get(email)

  request.onsuccess = () => {
    if (request.result !== undefined) {
      const data = {}
      for (const key in request.result) {
        const el = card.querySelector(`.${key} input`)
        if (el.type == 'number') data[key] = +el.value
        if (el.type == 'checkbox') data[key] = el.checked
        else data[key] = el.value
      }
      objectStore.put(data)
      toast(document.querySelector('.toast'), 'Se ha actualizado correctamente')
      event.target.removeAttribute('disabled')
    } else {
      toast(document.querySelector('.toast'), 'Se ha producido un error al Actualizar')
    }
  }
}

const createTransporter = event => {
  event.preventDefault()
  const target = event.target
  const data = {
    host: target.host.value,
    port: +target.port.value,
    service: target.service.value,
    authUser: target.authUser.value,
    authPass: target.authPass.value,
    secure: target.secure.checked
  }
  event.target.closest('form').reset()
  const transaction = db.transaction([STORE_NAME_TRANSPORTER], 'readwrite')
  const objectStore = transaction.objectStore(STORE_NAME_TRANSPORTER)
  const request = objectStore.add(data)
  toast(document.querySelector('.toast'), 'Transporter creado correctamente')
}
const sendEmail = event => {
  const target = event.target
  const selectedTransporter = document.querySelector('.js-select-transporter').value
  target.setAttribute('disabled', true)
  const transaction = db.transaction([STORE_NAME_TRANSPORTER])
  const objectStore = transaction.objectStore(STORE_NAME_TRANSPORTER)
  const request = objectStore.get(selectedTransporter)

  const addressee = document.querySelector('[name="addressee"]').value
  const subject = document.querySelector('[name="subject"]').value
  const html = (document.querySelector('#html').contentWindow.document.documentElement).outerHTML;

  target.closest('form').reset()
  request.onsuccess = async () => {
    if (request.result !== undefined) {
      let response
      try {
        const data = { ...request.result, ...{ html, subject, addressee } }
        response = await postData('email', data)
        if (response.error) toast(document.querySelector('.toast'), 'Error enviando el email')
        else toast(document.querySelector('.toast'), 'Email enviado correctamente')
        target.removeAttribute('disabled')
      } catch (error) {
        toast(document.querySelector('.toast'), `Error en el envío: ${error}`)
        console.error(error)
      }
    } else {
      toast(document.querySelector('.toast'), 'No tienes ningún Transporter para hacer envío de Emails')
      console.log('No find results')
    }
  }
}


// Set constants and grab needed elements
const sidenavEl = document.querySelector('.sidenav')
const gridEl = document.querySelector('.grid')
const SIDENAV_ACTIVE_CLASS = 'sidenav--active'
const GRID_NO_SCROLL_CLASS = 'grid--noscroll'


// User avatar dropdown functionality
const setUserDropdownListener = () => {
  const userAvatar = document.querySelector('.header__avatar')

  userAvatar.addEventListener('click', () => {
    const dropdown = userAvatar.querySelector('.dropdown')
    toggleClass(dropdown, 'dropdown--active')
  })
}

// Sidenav list sliding functionality
const setSidenavListeners = () => {
  const subHeadings = document.querySelectorAll('.navList__subheading')
  const SUBHEADING_OPEN_CLASS = 'navList__subheading--open'
  const SUBLIST_HIDDEN_CLASS = 'subList--hidden'

  subHeadings.forEach(subHeadingEl => {
    subHeadingEl.addEventListener('click', () => {
      const subListEl = getSiblings(subHeadingEl)

      // Add/remove selected styles to list category heading
      if (subHeadingEl) {
        toggleClass(subHeadingEl, SUBHEADING_OPEN_CLASS)
      }

      // Reveal/hide the sublist
      if (subListEl && subListEl.length === 1) {
        toggleClass(subListEl[0], SUBLIST_HIDDEN_CLASS)
      }

    })
  })
}

const addResizeListeners = () => {
  window.addEventListener('resize', () => {
    const width = window.innerWidth

    if (width > 750) {
      sidenavEl.classList.remove(SIDENAV_ACTIVE_CLASS)
      gridEl.classList.remove(GRID_NO_SCROLL_CLASS)
    }
  })
}

// Menu open sidenav icon, shown only on mobile
const setMenuClickListener = () => {
  document.querySelector('.header__menu').addEventListener('click', () => {
    toggleClass(sidenavEl, SIDENAV_ACTIVE_CLASS)
    toggleClass(gridEl, GRID_NO_SCROLL_CLASS)
  })
}

// Sidenav close icon
const setSidenavCloseListener = () => {
  document.querySelector('.sidenav__brand-close').addEventListener('click', () => {
    toggleClass(sidenavEl, SIDENAV_ACTIVE_CLASS)
    toggleClass(gridEl, GRID_NO_SCROLL_CLASS)
  })
}
