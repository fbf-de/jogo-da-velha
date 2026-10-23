# 🕹️ Jogo da Velha Online (Tic-Tac-Toe)

Um jogo da velha moderno, elegante, responsivo e 100% estático — pronto para ser hospedado gratuitamente no **GitHub Pages** sem necessidade de configurar nenhum servidor de backend!

---

## ✨ Funcionalidades

1. **🌐 Multiplayer Online em Tempo Real (P2P)**:
   - Funciona via WebRTC e **PeerJS** (conexão direta entre os navegadores).
   - Gere uma sala com 1 clique e envie o link para o seu amigo.
   - Ao abrir o link com `?sala=codigo`, o amigo conecta automaticamente!
   - Zero custo e sem necessidade de banco de dados ou servidor Node.js/Python.

2. **🤖 Contra a Máquina (Inteligência Artificial)**:
   - **Modo Fácil**: para partidas descontraídas com jogadas casuais.
   - **Modo Imbatível**: baseado no algoritmo **Minimax**, calcula a melhor resposta possível e nunca perde!

3. **👥 Modo Local (2 Jogadores)**:
   - Jogue com alguém no mesmo computador ou celular alternando as jogadas.

4. **🔊 Efeitos Sonoros Nativos**:
   - Desenvolvido com **Web Audio API** (não precisa carregar arquivos `.mp3` externos pesados).
   - Sons para cliques, vitórias, empates e conexão de jogadores.
   - Botão para silenciar o áudio quando quiser.

5. **📱 Design Moderno & Responsivo**:
   - Visual escuro minimalista, neon suave para `X` e `O`.
   - Compatível com celulares, tablets e computadores.

---

## 🚀 Como Hospedar no GitHub Pages (Passo a Passo)

Siga os passos abaixo para colocar o jogo no ar em menos de 2 minutos:

### Opção 1: Pelo Terminal (Git)

1. **Crie um repositório no seu GitHub**:
   - Acesse [github.com/new](https://github.com/new).
   - Escolha o nome do repositório (exemplo: `jogo-da-velha`).
   - Marque como **Public** e clique em **Create repository**.

2. **Envie os arquivos do projeto**:
   ```bash
   cd /caminho/para/jogo-da-velha
   git init
   git add .
   git commit -m "feat: lancamento do jogo da velha online"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/jogo-da-velha.git
   git push -u origin main
   ```

3. **Ative o GitHub Pages**:
   - No seu repositório no GitHub, clique na aba **Settings** (Configurações).
   - No menu lateral esquerdo, clique em **Pages**.
   - Em **Build and deployment** > **Source**, selecione:
     - Branch: `main`
     - Pasta: `/(root)`
   - Clique em **Save**.
   - Aguarde cerca de 1 minuto e seu site estará no ar na URL:  
     `https://SEU-USUARIO.github.io/jogo-da-velha/`

---

### Opção 2: Pelo Navegador (Sem usar terminal)

1. Acesse [github.com/new](https://github.com/new) e crie um repositório chamado `jogo-da-velha` (Público).
2. Na página do repositório criado, clique em **"uploading an existing file"**.
3. Arraste os arquivos da pasta:
   - `index.html`
   - `style.css`
   - `script.js`
   - `README.md`
4. Clique no botão verde **Commit changes**.
5. Vá em **Settings** > **Pages** > Selecione a branch `main` e salve!

---

## 💻 Como Testar Localmente no seu Computador

Você pode abrir o arquivo `index.html` diretamente em qualquer navegador dando duplo clique nele, ou rodar um servidor local simples:

```bash
# Com Python 3:
python3 -m http.server 8000
```
Depois acesse `http://localhost:8000` no seu navegador.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5** & **CSS3**: Layout moderno com CSS Grid e Flexbox.
- **JavaScript (ES6+)**: Lógica pura, algoritmo Minimax e manipulação de DOM.
- **Web Audio API**: Geração procedural de áudio em tempo real.
- **PeerJS**: Comunicação Peer-to-Peer (WebRTC) para o multiplayer online gratuito.
