const indexedDB = window.indexedDB
const form = document.querySelector('#form')
const dataList = document.querySelector('.data-list')

let db
const DB_NAME = 'nodemailer'
const DB_VERSION = 1
const STORE_NAME = 'transporter'

const elFactory = (type, attributes, ...children) => {
  const el = document.createElement(type)

  for (key in attributes) {
    el.setAttribute(key, attributes[key])
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
      break;
  }
  return type
}

if (indexedDB) {
  const request = indexedDB.open(DB_NAME, DB_VERSION)

  request.onupgradeneeded = () => {
    request.result.createObjectStore(STORE_NAME, { keyPath: 'authUser' })
  }

  request.onsuccess = () => {
    db = request.result
    if (dataList) readData()
  }

  request.onerror = error => console.log('error :>> ', error)

  const addData = data => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const objectStore = transaction.objectStore(STORE_NAME)
    const request = objectStore.add(data)
  }

  const drawTransporters = (cursorValue, stop = false) => {
    if (cursorValue.length === 0) {
      dataList.innerHTML = 'No tienes ningún transporter'
      return
    }
    let i = 0;
    for (let field in cursorValue) {
      i++
      const obj = cursorValue[field]
      const fragment = new DocumentFragment()
      const form = document.createElement('form')
      form.classList.add('form', 'disabled')
      for (let fieldChild in obj) {
        const markup = elFactory(
          'div', { class: `${fieldChild} input-field` },
          elFactory('label', { class: fieldChild == 'secure' ? 'label label--checkbox' : 'label'},
            elFactory('span', {}, fieldChild),
            elFactory('input', {
              type: inputType(typeof obj[fieldChild]),
              value: obj[fieldChild],
              name: fieldChild+i,
              id: fieldChild+i
            })
          ),
        )
        form.appendChild(markup)
      }
      const button = elFactory(
        'div', { class: 'button input-field' },
        elFactory('button', {
            class: 'btn',
            type: 'submit'
          },
          'Actualizar'
        ),
      )
      form.appendChild(button)
      fragment.appendChild(form)

      dataList.appendChild(fragment)
      if (stop == i) break
    }
  }

  const readData = () => {
    const transaction = db.transaction([STORE_NAME])
    const objectStore = transaction.objectStore(STORE_NAME)
    if ('getAll' in objectStore) {
      objectStore.getAll().onsuccess = event => {
        drawTransporters(event.target.result)
      }
    } else {
      const transporters = []
      const request = objectStore.openCursor()
      request.onsuccess = event => {
        const cursor = event.target.result
        if (cursor) {
          transporters.push(cursor.value)
          cursor.continue()
        } else {
          drawTransporters(transporters)
        }
      }
    }
  }



  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault()
      const target = event.target
      const data = {
        host: target.host.value,
        port: +target.port.value,
        service: target.service.value,
        secure: target.secure.checked,
        authUser: target.authUser.value,
        authPass: target.authPass.value
      }
      addData(data)
    })
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
})

const sendEmail = event => {
  const target = event.target
  target.setAttribute('disabled', true)
  const transaction = db.transaction([STORE_NAME])
  const objectStore = transaction.objectStore(STORE_NAME)
  const request = objectStore.get('unai_albizu@yahoo.com')
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
        target.removeAttribute('disabled')
      } catch (error) {
        console.error(error);
      }
      console.log(response)
    } else {
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
