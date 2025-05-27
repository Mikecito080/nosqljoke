// js/main.js

// Importar las instancias de Firebase desde firebaseConfig.js
import { auth, db } from './firebase.js'; // Asegúrate de la ruta correcta

// --- Elementos del DOM ---
// Secciones
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const dashboardSection = document.getElementById('dashboard-section');
const profileSection = document.getElementById('profile-section');

// Login
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const loginButton = document.getElementById('loginButton');
const showRegisterLink = document.getElementById('showRegister');
const loginError = document.getElementById('loginError');

// Registro
const registerEmailInput = document.getElementById('registerEmail');
const registerPasswordInput = document.getElementById('registerPassword');
const registerButton = document.getElementById('registerButton');
const showLoginLink = document.getElementById('showLogin');
const registerError = document.getElementById('registerError');

// Dashboard
const userEmailSpan = document.getElementById('userEmail');
const logoutButton = document.getElementById('logoutButton');
const profileButton = document.getElementById('profileButton');
const jokeDisplay = document.getElementById('jokeDisplay');
const newJokeButton = document.getElementById('newJokeButton');
const saveJokeButton = document.getElementById('saveJokeButton');
const saveMessage = document.getElementById('saveMessage');

// Perfil
const backToDashboardButton = document.getElementById('backToDashboard');
const savedJokesList = document.getElementById('savedJokesList');
const profileMessage = document.getElementById('profileMessage');

let currentJoke = ''; // Para almacenar el chiste actual y poder guardarlo.

// --- Funciones de Utilidad de UI ---
function showSection(sectionToShow) {
    loginSection.classList.add('hidden');
    registerSection.classList.add('hidden');
    dashboardSection.classList.add('hidden');
    profileSection.classList.add('hidden');
    sectionToShow.classList.remove('hidden');
}

function clearMessages() {
    loginError.textContent = '';
    registerError.textContent = '';
    saveMessage.textContent = '';
    profileMessage.textContent = '';
}

// --- Autenticación Firebase ---

// Observador del estado de autenticación
auth.onAuthStateChanged((user) => {
    clearMessages();
    if (user) {
        // Usuario logueado
        userEmailSpan.textContent = user.email;
        showSection(dashboardSection);
        fetchNewJoke(); // Cargar un chiste al iniciar sesión
    } else {
        // Usuario no logueado
        showSection(loginSection);
    }
});

// Evento de Registro
registerButton.addEventListener('click', async () => {
    const email = registerEmailInput.value;
    const password = registerPasswordInput.value;
    clearMessages();
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
        showSection(loginSection); // Volver al login después del registro
        registerEmailInput.value = '';
        registerPasswordInput.value = '';
    } catch (error) {
        registerError.textContent = `Error al registrar: ${error.message}`;
        console.error('Error de registro:', error);
    }
});

// Evento de Login
loginButton.addEventListener('click', async () => {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    clearMessages();
    try {
        await auth.signInWithEmailAndPassword(email, password);
        // La redirección a dashboard es manejada por el observador onAuthStateChanged
        loginEmailInput.value = '';
        loginPasswordInput.value = '';
    } catch (error) {
        loginError.textContent = `Error al iniciar sesión: ${error.message}`;
        console.error('Error de inicio de sesión:', error);
    }
});

// Evento de Logout
logoutButton.addEventListener('click', async () => {
    try {
        await auth.signOut();
        // La redirección a login es manejada por el observador onAuthStateChanged
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
});

// --- Navegación entre secciones ---
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    clearMessages();
    showSection(registerSection);
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    clearMessages();
    showSection(loginSection);
});

profileButton.addEventListener('click', (e) => {
    e.preventDefault();
    clearMessages();
    showSection(profileSection);
    const user = auth.currentUser;
    if (user) {
        loadSavedJokes(user.uid);
    }
});

backToDashboardButton.addEventListener('click', (e) => {
    e.preventDefault();
    clearMessages();
    showSection(dashboardSection);
    fetchNewJoke(); // Opcional: cargar un nuevo chiste al volver
});

// --- Funciones de Chistes (JokeAPI) ---

async function fetchNewJoke() {
    jokeDisplay.textContent = 'Cargando chiste...';
    saveMessage.textContent = '';
    currentJoke = ''; // Limpiar el chiste actual
    try {
        const response = await fetch('https://v2.jokeapi.dev/joke/Any?type=single');
        const data = await response.json();
        if (data.joke) {
            currentJoke = data.joke;
            jokeDisplay.textContent = currentJoke;
        } else {
            jokeDisplay.textContent = 'No se pudo cargar un chiste.';
        }
    } catch (error) {
        console.error('Error al obtener chiste:', error);
        jokeDisplay.textContent = 'Error al cargar chiste.';
    }
}

newJokeButton.addEventListener('click', fetchNewJoke);

// --- Guardar Chistes (Firestore) ---

saveJokeButton.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (user && currentJoke) {
        try {
            await db.collection('users').doc(user.uid).collection('savedJokes').add({
                joke: currentJoke,
                timestamp: firebase.firestore.FieldValue.serverTimestamp() // Para ordenar por fecha
            });
            saveMessage.textContent = '¡Chiste guardado exitosamente!';
        } catch (error) {
            console.error('Error al guardar chiste:', error);
            saveMessage.textContent = 'Error al guardar chiste.';
        }
    } else {
        saveMessage.textContent = 'No hay chiste para guardar o no has iniciado sesión.';
    }
});

// --- Cargar y Eliminar Chistes del Perfil (Firestore) ---

async function loadSavedJokes(userId) {
    savedJokesList.innerHTML = ''; // Limpiar chistes anteriores
    profileMessage.textContent = 'Cargando tus chistes...';

    try {
        const snapshot = await db.collection('users').doc(userId).collection('savedJokes').orderBy('timestamp', 'desc').get();
        if (snapshot.empty) {
            profileMessage.textContent = 'Aún no tienes chistes guardados.';
            return;
        }
        profileMessage.textContent = ''; // Limpiar mensaje de carga/vacío
        snapshot.forEach(doc => {
            const jokeData = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${jokeData.joke}</span>
                <button data-id="${doc.id}">Eliminar</button>
            `;
            const deleteButton = li.querySelector('button');
            deleteButton.addEventListener('click', () => deleteJoke(userId, doc.id));
            savedJokesList.appendChild(li);
        });
    } catch (error) {
        console.error('Error al cargar chistes guardados:', error);
        profileMessage.textContent = 'Error al cargar tus chistes.';
    }
}

async function deleteJoke(userId, jokeId) {
    try {
        await db.collection('users').doc(userId).collection('savedJokes').doc(jokeId).delete();
        alert('¡Chiste eliminado exitosamente!');
        loadSavedJokes(userId); // Recargar la lista de chistes después de eliminar
    } catch (error) {
        console.error('Error al eliminar chiste:', error);
        alert('Error al eliminar chiste.');
    }
}
loginButton.addEventListener('click', async () => {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    console.log('Intentando iniciar sesión con:', { email, password }); // <-- Añade esta línea
    clearMessages();
    try {
        await auth.signInWithEmailAndPassword(email, password);
        // ... resto del código
    } catch (error) {
        loginError.textContent = `Error al iniciar sesión: ${error.message}`;
        console.error('Error de inicio de sesión:', error);
    }
});