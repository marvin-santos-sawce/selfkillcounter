# Contador — Dias sem acidentes

Contador compartilhado entre todos os visitantes do site (casa, trabalho, colegas — todos veem o mesmo tempo, sincronizado em tempo real). Usa **Firebase Realtime Database** (gratuito) para guardar o dado em um só lugar na nuvem.

## Arquivos

- `index.html` — estrutura da página
- `style.css` — visual
- `script.js` — lógica do contador e sincronização
- `firebase-config.js` — **você precisa editar este arquivo** com a config do seu projeto Firebase

## Passo a passo (10 minutos, sem custo)

### 1. Criar o projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"**, dê um nome (ex: `contador-time`) e siga o assistente (pode desativar o Google Analytics, não é necessário)

### 2. Criar o Realtime Database

1. No menu lateral, vá em **Build > Realtime Database**
2. Clique em **"Criar banco de dados"**
3. Escolha a localização (qualquer uma serve)
4. Selecione **"Iniciar no modo de teste"** (permite leitura/escrita sem login — simples, mas sem senha nenhuma pessoa com o link do banco poderia editar diretamente; para o uso do dia a dia do time isso é aceitável)

### 3. Criar o app Web e pegar a configuração

1. No painel do projeto, clique no ícone **`</>`** (Adicionar app > Web)
2. Dê um apelido ao app e clique em **"Registrar app"**
3. Copie o objeto `firebaseConfig` que aparece — algo assim:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "contador-time.firebaseapp.com",
  databaseURL: "https://contador-time-default-rtdb.firebaseio.com",
  projectId: "contador-time",
  storageBucket: "contador-time.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

4. Cole esses valores no arquivo **`firebase-config.js`** deste projeto, substituindo os valores de exemplo

### 4. Ajustar as regras do banco (recomendado)

Por padrão, o "modo de teste" expira o acesso livre em 30 dias. Para manter funcionando, vá em **Realtime Database > Regras** e use:

```json
{
  "rules": {
    "accidentCounter": {
      ".read": true,
      ".write": true
    }
  }
}
```

Isso libera leitura/escrita apenas no caminho usado pelo contador, indefinidamente.

### 5. Subir para o GitHub / GitHub Pages

1. Suba os 4 arquivos (`index.html`, `style.css`, `script.js`, `firebase-config.js`) para o repositório
2. Em **Settings > Pages**, ative o GitHub Pages apontando para a branch/pasta onde estão os arquivos
3. Pronto — o link gerado já mostra o contador sincronizado para qualquer pessoa que acessar

## Como funciona a sincronização

- O horário de início fica salvo no banco (`resetEpoch`), gravado com o **relógio do servidor do Firebase** — não o relógio do computador de quem reinicia. Isso evita que um PC com hora errada bagunce a contagem de todo mundo.
- Todos os navegadores abertos escutam esse valor em tempo real: quando alguém reinicia, a tela de todo mundo atualiza sozinha, sem precisar recarregar a página.
- Cada reinício grava também um registro exato no histórico (data e hora, fuso de Brasília, com segundos), visível em **"Ver histórico de reinícios"**.
- O recorde (maior sequência já alcançada) e o total de reinícios também ficam salvos no banco, não no navegador.

## Segurança (opcional, para depois)

As regras acima deixam o banco aberto para qualquer pessoa com o link do projeto escrever nele diretamente (não só pelo botão do site). Para um time pequeno isso costuma ser aceitável, mas se quiser travar mais, o Firebase permite exigir login (ex: só e-mails do domínio da empresa) — é um passo a mais que posso te ajudar a montar se precisar.
