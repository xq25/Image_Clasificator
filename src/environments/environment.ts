// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  url_backend: 'http://127.0.0.1:8080',
  url_backend_clasificator: 'http://127.0.0.1:8081',
  securityRoles: {
    fullAccessRoleId: '69b06a2cb182c24e02435d7c',
    securityAccessRoleId: '6a0a9c11dd10e0339de643eb',
    patientRole: '6a0b6a301041bc61dc39cbf5',
    doctorRole: '6a0b69f11041bc61dc39cbf4'
  },
  firebase : {
    apiKey: "AIzaSyBtHeRhUXsgaeP0IzRba0N2M45l5XOw3nI",
    authDomain: "securityproyect-fd487.firebaseapp.com",
    projectId: "securityproyect-fd487",
    storageBucket: "securityproyect-fd487.firebasestorage.app",
    messagingSenderId: "799759297239",
    appId: "1:799759297239:web:57ced6fa0d138b308ede92"
  },
  agentIA_apy_key:'',
  captchatkey:'6LcykpEsAAAAAHdxM1Ln5lBuyAfyke1L8qWfzReP'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.