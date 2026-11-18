# Urna do clube (GitHub Pages + Firebase)

O GitHub Pages só hospeda arquivos. O login e o armazenamento dos votos ficam no Firebase (plano gratuito basta).

## 1. Criar o projeto no Firebase
1. Acesse console.firebase.google.com e clique em **Adicionar projeto** (pode desativar o Google Analytics).
2. **Build → Firestore Database → Criar banco de dados**, em modo de produção, em uma região próxima.
3. **Build → Authentication → Primeiros passos → Google → Ativar** e escolha um e-mail de suporte.
4. **Configurações do projeto (engrenagem) → Seus apps → ícone `</>` (Web)**: registre o app e copie o `firebaseConfig`.

## 2. Preencher o js/config.js
No início do script, troque `COLE_AQUI` por `apiKey`, `authDomain`, `projectId` e `appId` copiados do passo 1.4, e coloque seu e-mail do Google em `ADMIN_EMAIL`. A chave do Firebase pode ficar pública: quem protege os dados são as regras.

## 3. Colar as regras de segurança
Em **Firestore → Regras**, apague o conteúdo, cole o arquivo `firestore.rules`, troque `seu-email@gmail.com` pelo mesmo e-mail (minúsculas) e clique em **Publicar**.

## 4. Subir no GitHub
1. Crie um repositório e envie o `index.html` (**Add file → Upload files**). Pode enviar os outros arquivos também.
2. **Settings → Pages → Deploy from a branch → main / (root)**. O endereço será `seuusuario.github.io/nome-do-repositorio`.
3. De volta ao Firebase, em **Authentication → Configurações → Domínios autorizados**, adicione `seuusuario.github.io`.

## 5. Usar
1. Abra o link e entre com o Google usando o e-mail de administrador.
2. Na configuração, cadastre os e-mails Google dos eleitores (um por linha), escolha as fotos e abra o 1º turno.
3. Cada eleitor entra com a conta Google do e-mail cadastrado. Quem não estiver na lista vê "E-mail não autorizado".

## Como funciona e limites
- **Administrador x eleitor:** o painel só aparece para o `ADMIN_EMAIL`, e as regras do Firestore recusam qualquer alteração de configuração feita por outra conta, mesmo mexendo no código.
- **Voto único:** o registro de quem votou fica no id da conta Google. As regras só aceitam o voto junto com esse registro e com a votação aberta.
- **Sigilo:** o voto é salvo sem nome. Porém o administrador do Firebase vê o horário de criação dos documentos e poderia cruzá-los. Não é sigilo criptográfico.
- **Fraude:** um eleitor que alterasse o código poderia enviar dois votos no mesmo envio. A conferência no resultado (votos x votantes) acusa o problema.
- **Nova votação:** no resultado, o botão "Iniciar nova votação" apaga votos, registros e configuração. A lista de e-mails é mantida.

## Arquivos do site (suba todos, mantendo as pastas)
`index.html`, `estilo.css`, `package.json`, as pastas `js` e `testes`, `manifest.webmanifest`, `sw.js`, `icon.svg`, `icon-192.png` e `icon-512.png`. O `firestore.rules` é colado no Firebase, não vai para o GitHub.

## Instalar como aplicativo
No celular, abra o site no Chrome (Android) e use **Instalar aplicativo** / **Adicionar à tela inicial**; no iPhone, use o botão de compartilhar do Safari e **Adicionar à Tela de Início**. O ícone abre a Urna do clube em tela cheia. Continua precisando de internet para votar.

## Estrutura do código
```
index.html            página (só a moldura)
estilo.css            visual: cores, tipografia, urna, painel
js/config.js          chaves do Firebase e e-mail do administrador  ← único arquivo que você edita
js/apuracao.js        regras de apuração (50%, 2º turno, vagas, proporcional, ranqueada)
js/app.js             telas, urna, painel do organizador, integração com o Firebase
testes/               testes automáticos das regras de apuração
sw.js, manifest.webmanifest, icon-*.png, icon.svg   aplicativo instalável
firestore.rules       regras do Firebase (colar no console, não vai para o GitHub)
```
Para rodar os testes (precisa do Node.js 18+): `npm test`.
No GitHub, envie as pastas `js` e `testes` junto (arraste a pasta inteira em **Add file > Upload files**).
