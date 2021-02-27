const id = typeof templateID !== 'undefined' ? templateID : 'other-id-1'

let db_gjs
const DB_NAME_GJS = 'grapesjs'
const DB_VERSION_GJS = 1
const STORE_NAME_GJS = 'templates'
const htmlTemplates = document.querySelector('#html-templates')
let editor
const selectTemplate = () => {

}
if (indexedDB) {
  const request = indexedDB.open(DB_NAME_GJS, DB_VERSION_GJS)

  request.onupgradeneeded = () => {
    request.result.createObjectStore(STORE_NAME_GJS, { keyPath: 'id' })
  }

  request.onsuccess = () => {
    db_gjs = request.result
    drawContactsDatalist(htmlTemplates)
  }

  const drawContactsDatalist = (parent) => {
    const transaction = db_gjs.transaction([STORE_NAME_GJS])
    const objectStore = transaction.objectStore(STORE_NAME_GJS)

    objectStore.getAll().onsuccess = event => {
      const cursorValue = event.target.result
      if (cursorValue.length === 0) return

      const fragment = new DocumentFragment()

      for (let index = 0; index < cursorValue.length; index++) {
        const field = cursorValue[index]
        const li = elFactory(
          'li', { class: 'template-item', id: `${field.id}` },
          elFactory('span', {}, `${field.id}`),
          elFactory('a', { class: 'btn btn--small', href: `/html-builder/${field.id}` }, 'editar'),
          elFactory('button', { type: 'submit', class: 'btn btn--danger btn--small js-delete-template' }, `Eliminar`)
        )
        fragment.appendChild(li)
        li.querySelector('.js-delete-template').addEventListener('click', event => {
          // TO-DO delete indexedDB item
          console.log('event.target :>> ', event.target);
        }, true)
      }
      parent.appendChild(fragment)
    }
  }

  editor = grapesjs.init({
    fromElement: 1,
    container : '#gjs',
    storageManager: {
      type: 'indexeddb',
      // In case of multiple editors on the same page indicate an id to
      // prevent collisions
      //id: event.target.value,
      id: id,
    },
    plugins: ['grapesjs-mjml', 'grapesjs-indexeddb'],
    pluginsOpts: {
      'grapesjs-mjml': {
        // options
      },
      'grapesjs-indexeddb': {
        dbName: DB_NAME_GJS,
        objectStoreName: STORE_NAME_GJS
      }
    }
  });

}
