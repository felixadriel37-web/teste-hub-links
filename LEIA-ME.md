# Hub da Biblioteca UNIFACISA — guia rápido

## Estrutura da pasta
```
index.html            app dos alunos (sem nenhum link para a área de colaboradores)
colaboradores.html    painel "Acesso Colaboradores" (abra digitando /colaboradores.html)
sw.js  manifest.json  avisos.json (reserva, caso o backend esteja fora)
icon-192.png  icon-512.png
images/               logo.webp, pergamum.webp, mb.webp, uptodate.webp, gedweb.webp, rtonline.webp,
                      capes.webp, scielo.webp, comut.webp, bvs.webp, tutoriais.webp, bib1.webp, bib2.webp,
                      biblioteca-1.webp, biblioteca-2.webp, biblioteca-3.webp, bibli-1.webp, bibli-3.webp,
                      bibliotecas-5.webp, footer-mec-badge.webp
netlify.toml  package.json  netlify/functions/*.mjs   (backend)
```

## Configuração (uma única vez)
O backend usa Netlify Functions + Netlify Blobs. **Importante:** arrastar a pasta no "Netlify Drop" NÃO publica funções.
Publique por Git (GitHub conectado ao Netlify) ou pelo Netlify CLI (`npm i -g netlify-cli` → `netlify deploy --prod`).

1. **Senha do painel:** Netlify → Site configuration → Environment variables → `ADMIN_TOKEN` = a senha dos colaboradores
   (você pediu `biblioteca@123`; recomendo trocar por algo mais longo, pois é uma senha curta e previsível).
   A senha fica só no servidor — não aparece no código do site.
2. **Notificações:** gere as chaves uma vez com `npx web-push generate-vapid-keys` e crie as variáveis
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT` (ex.: `mailto:biblioteca@unifacisa.edu.br`).
3. Faça um novo deploy para as variáveis valerem.

## Rotina do dia a dia (sem novo deploy)
- Abra `https://SEU-SITE/colaboradores.html`, entre com a senha, crie/edite avisos e clique em **Publicar**.
  O aviso aparece na faixa do hub em até 1 minuto. O botão **🔔 Notificar usuários** envia push com o texto do aviso.
- Aviso com "Biblioteca fechada neste período" também muda o selo do topo para "Fechado hoje".
- Abas **Uso do hub** (cliques e buscas sem resultado) e **Mensagens** (sugestões enviadas pelo rodapé).

## Notificações — o que saber
- Android/Chrome: funciona direto no navegador. **iPhone:** só funciona com o app instalado na tela inicial (iOS 16.4+).
  Por isso o manifest agora usa `display: standalone`.
- Quem se inscreve escolhe as categorias (feriados, horário especial, sistema fora do ar, prazo de TCC, outros).

## A cada publicação de código
Aumente o número em `CACHE_NAME` no `sw.js` (ex.: `v6` → `v7`) para os celulares pegarem a versão nova.
