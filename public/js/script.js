const indexedDB = window.indexedDB
const form = document.querySelector('#form')
const dataList = document.querySelector('#data-list')

if (indexedDB && form) {
  let db
  const DB_NAME = 'nodemailer'
  const DB_VERSION = 1
  const STORE_NAME = 'transporter'
  const request = indexedDB.open(DB_NAME, DB_VERSION)

  request.onupgradeneeded = () => {
    request.result.createObjectStore(STORE_NAME, { keyPath: 'authUser' })
  }

  request.onsuccess = () => {
    db = request.result
    readData()
  }

  request.onerror = error => console.log('error :>> ', error)

  const addData = data => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const objectStore = transaction.objectStore(STORE_NAME)
    const request = objectStore.add(data)
  }

  const drawTransporters = cursorValue => {
    for (let field in cursorValue) {
      const obj = cursorValue[field]
      const fragment = new DocumentFragment()
      const card = document.createElement('div')
      const cardContent = document.createElement('div')
      card.classList.add('card', 'indigo')
      for (let fieldChild in obj) {
        cardContent.classList.add('card-content', 'white-text')
        const p = document.createElement('p')
        p.textContent = obj[fieldChild]
        cardContent.appendChild(p)
      }
      card.appendChild(cardContent)
      fragment.appendChild(card)

      dataList.appendChild(fragment)
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

document.addEventListener("DOMContentLoaded", () => {
  addResizeListeners()
  setSidenavListeners()
  setUserDropdownListener()
  setMenuClickListener()
  setSidenavCloseListener()
})
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
    console.log('width: ', width)

    if (width > 750) {
      sidenavEl.classList.remove(SIDENAV_ACTIVE_CLASS)
      gridEl.classList.remove(GRID_NO_SCROLL_CLASS)
    }
  })
}

// Menu open sidenav icon, shown only on mobile
const setMenuClickListener = () => {
  document.querySelector('.header__menu').addEventListener('click', () => {
    console.log('clicked menu icon')
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
