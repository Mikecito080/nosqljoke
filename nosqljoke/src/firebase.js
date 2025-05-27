// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDG3tbthHGbHqw3YDTKFil49hXc3RLqkJE",
    authDomain: "nosqljoke-a3f8e.firebaseapp.com",
    projectId: "nosqljoke-a3f8e",
    storageBucket: "nosqljoke-a3f8e.firebasestorage.app",
    messagingSenderId: "990562561297",
    appId: "1:990562561297:web:5d0c6a287abebb0ea530b0"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Exportar las instancias. Ahora SÍ usamos 'const'.
export const auth = firebase.auth();
export const db = firebase.firestore();