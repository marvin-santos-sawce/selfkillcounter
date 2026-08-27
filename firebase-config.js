// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================================
// Substitua os valores abaixo pelos do SEU projeto Firebase.
// Onde encontrar: Console do Firebase > Configurações do projeto
// > "Seus apps" > app da Web > "Configuração do SDK".
//
// Veja o passo a passo completo no README.md deste projeto.
// ============================================================

<script type="module">
  // Import the functions you need from the SDKs you need
  import {initializeApp} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
  import {getAnalytics} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDZDEJza82gJpPYXrEI1xJVozmOTfuJMz0",
  authDomain: "selfkill-counter.firebaseapp.com",
  databaseURL: "https://selfkill-counter-default-rtdb.firebaseio.com",
  projectId: "selfkill-counter",
  storageBucket: "selfkill-counter.firebasestorage.app",
  messagingSenderId: "964953874916",
  appId: "1:964953874916:web:12c4aca29635022c7927f1",
  measurementId: "G-0F6SC68ZZ5"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
