const indexedDB = window.indexedDB
const dataList = document.querySelector('.data-list')
const dataLists = document.querySelector('.data-lists')
const selectTransporter = document.querySelector('.js-select-transporter')
const contacts = document.querySelector('#contacts')

let db
const DB_NAME = 'nodemailer'
const DB_VERSION = 1
const STORE_NAME_TRANSPORTER = 'transporter'
const STORE_NAME_CONTACT = 'contact'

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

if (indexedDB) {
  const request = indexedDB.open(DB_NAME, DB_VERSION)

  request.onupgradeneeded = () => {
    request.result.createObjectStore(STORE_NAME_TRANSPORTER, { keyPath: 'authUser' })
    request.result.createObjectStore(STORE_NAME_CONTACT, { keyPath: 'email' })
  }

  request.onsuccess = () => {
    db = request.result
    if (dataList) drawTransporters(dataList, 1)
    if (dataLists) drawTransporters(dataLists)
    if (selectTransporter) drawSelectTransporter(selectTransporter)
    if (contacts) drawContact()
  }

  request.onerror = error => console.log('error :>> ', error)

  const drawContact = () => {
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

  const drawSelectTransporter = (parent) => {
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

})

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
  console.log('data :>> ', data)
  const transaction = db.transaction([STORE_NAME_CONTACT], 'readwrite')
  const objectStore = transaction.objectStore(STORE_NAME_CONTACT)
  const request = objectStore.add(data)
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
  const request = objectStore.get(selectedTransporter) //TO-DO
  console.log('selectedTransporter :>> ', selectedTransporter);

  const addressee = document.querySelector('[name="addressee"]').value
  const subject = document.querySelector('[name="subject"]').value
  const html = document.querySelector('[name="html"]').value
  target.closest('form').reset()
  request.onsuccess = async () => {
    if (request.result !== undefined) {
      let response
      try {
        const data = { ...request.result, ...{html, subject, addressee} }
        response = await postData('email', data)
        if (response.error) toast(document.querySelector('.toast'), 'Error enviando el email')
        else toast(document.querySelector('.toast'), 'Email enviado correctamente')
        target.removeAttribute('disabled')
      } catch (error) {
        toast(document.querySelector('.toast'), `Error en el envío: ${error}`)
        console.error(error)
      }
      console.log(response)
    } else {
      toast(document.querySelector('.toast'), 'No tienes ningún Transporter para hacer envío de Emails')
      console.log('No find results')
    }
  }
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
// Set constants and grab needed elements
const sidenavEl = document.querySelector('.sidenav')
const gridEl = document.querySelector('.grid')
const SIDENAV_ACTIVE_CLASS = 'sidenav--active'
const GRID_NO_SCROLL_CLASS = 'grid--noscroll'

const getSiblings = elem => {
	return Array.prototype.filter.call(elem.parentNode.children, sibling => {
		return sibling !== elem
	})
}

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


const toggleClass = (el, className) => {
  if (el.classList.contains(className)) {
    el.classList.remove(className)
  } else {
    el.classList.add(className)
  }
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
