// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================================
// Substitua os valores abaixo pelos do SEU projeto Firebase.
// Onde encontrar: Console do Firebase > Configurações do projeto
// > "Seus apps" > app da Web > "Configuração do SDK".
//
// Veja o passo a passo completo no README.md deste projeto.
// ============================================================

export const firebaseConfig = {
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
