const id = typeof templateID !== 'undefined' ? templateID : 'other-id-1'

//let db
//const DB_NAME = 'nodemailer'
//const DB_VERSION = 1
//const STORE_NAME_GJS = 'templates'
//const htmlTemplates = document.querySelector('#html-templates')
let editor

if (indexedDB) {



  editor = grapesjs.init({
    fromElement: 1,
    container : '#gjs',
    storageManager: {
      type: 'indexeddb',
      id: id,
    },
    plugins: ['grapesjs-mjml', 'grapesjs-indexeddb'],
    pluginsOpts: {
      'grapesjs-mjml': {},
      'grapesjs-indexeddb': {
        dbName: DB_NAME,
        objectStoreName: 'templates'
      }
    }
  });

}
