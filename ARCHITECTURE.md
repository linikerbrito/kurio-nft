# Arquitetura

Este documento descreve como o Kurio está organizado, os contratos REST e de eventos, as políticas de sessão, carrinho, cache e tempo real, e as decisões de UX e desvios do layout. Setup e comandos estão no [README](README.md).

## Visão geral

SPA em React 19 com TypeScript strict, organizada por feature:

| Camada                                      | Responsabilidade                                                                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/routes`                                | Rotas por arquivo (TanStack Router, code splitting automático). Validação dos search params com zod; guard das rotas privadas em `_authenticated.tsx`. |
| `src/features/<feature>/types`              | Contratos com zod: cada resposta é validada (`parseResponse`) antes de entrar no cache.                                                                |
| `src/features/<feature>/api`                | Funções REST sobre a instância única do Axios e chaves de cache.                                                                                       |
| `src/features/<feature>/hooks`              | Queries e mutations do TanStack Query (otimismo, invalidação).                                                                                         |
| `src/features/<feature>/{components,pages}` | Interface.                                                                                                                                             |
| `src/shared`                                | Layout (header, footer, barra inferior), campos de formulário, componentes shadcn/ui adaptados.                                                        |
| `src/lib`                                   | `http.ts` (Axios, `ApiError`), sessão, `network-ready.ts`, ETH com decimal.js.                                                                         |
| `src/mocks`                                 | MSW: handlers REST, servidor Socket.IO, banco simulado, fixtures e cenários. Nenhum componente, hook ou cliente HTTP contém dado fictício.             |

Valores em ETH trafegam e são calculados como strings decimais (decimal.js); quantidades são inteiras.

### Estado na URL

| Rota                  | Estado                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `/`                   | `q`, `category[]`, `network[]`, `minPrice`, `maxPrice`, `tab`, `sort`, `page` (mudar filtro volta à página 1). |
| `/nft/$nftId`         | `edicao`.                                                                                                      |
| `/login`, `/cadastro` | `redirect` (só caminhos internos) e `sessao=expirada`.                                                         |
| `/pagamento`          | `etapa=carteira` (segunda etapa no mobile).                                                                    |

Tudo sobrevive a refresh e ao histórico.

## Contratos REST

Base `/api` (`VITE_API_URL`). Autenticação por `Authorization: Bearer <token>`; o carrinho do visitante é identificado por `X-Cart-Id` (UUID gerado no navegador).

### Erros

Todas as falhas respondem `{ error: { code, message, fieldErrors? } }`:

| `code`         | HTTP | Uso                                                                  |
| -------------- | ---- | -------------------------------------------------------------------- |
| `validation`   | 422  | Dados inválidos; `fieldErrors` por campo.                            |
| `unauthorized` | 401  | Sem sessão ou sessão expirada.                                       |
| `forbidden`    | 403  | Ação recusada (ex.: carteira recusou a conexão).                     |
| `not_found`    | 404  | Recurso inexistente.                                                 |
| `conflict`     | 409  | Estoque, e-mail/usuário em uso, cotação desatualizada, idempotência. |
| `transient`    | 503  | Falha temporária (repetível).                                        |

No cliente, `ApiError` ainda distingue `timeout`, `network` (sem resposta) e `contract` (resposta fora do schema). Só `transient`, `timeout` e `network` são repetíveis.

### Recursos

| Recurso   | Endpoint                              | Notas                                                                                                                                                                                                                           |
| --------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sessão    | `POST /auth/register`                 | `{name, email, password}` → 201 `{token, expiresAt, user}`; 409 `fieldErrors.email`.                                                                                                                                            |
|           | `POST /auth/login`                    | `{email, password}` → `{token, expiresAt, user}`; 401 credenciais. Mescla o carrinho do visitante.                                                                                                                              |
|           | `GET /auth/session`                   | `{user, expiresAt}`; 401 se expirada.                                                                                                                                                                                           |
|           | `POST /auth/logout`                   | 204.                                                                                                                                                                                                                            |
| NFTs      | `GET /nfts`                           | Busca, filtros, ordenação e paginação pelos parâmetros da URL; `{items, page, pageSize, total, totalPages, facets}`.                                                                                                            |
|           | `GET /nfts/featured`                  | `{slides, spotlight}`.                                                                                                                                                                                                          |
|           | `GET /nfts/:id`                       | Detalhe com galeria, edições (`available` por edição) e `version`; 404 inexistente.                                                                                                                                             |
| Favoritos | `GET /favorites`                      | `{nftIds}`, mais recente primeiro (exige sessão).                                                                                                                                                                               |
|           | `PUT/DELETE /favorites/:nftId`        | Idempotentes; devolvem a lista.                                                                                                                                                                                                 |
| Carrinho  | `GET /cart`                           | `{id, items[], coupon, summary{itemCount, subtotal, discount, networkFee, total}}`; cada item traz `issue` (`insufficient_stock`/`sold_out`).                                                                                   |
|           | `POST /cart/items`                    | `{nftId, editionId, quantity}`; 409 acima do estoque.                                                                                                                                                                           |
|           | `PATCH/DELETE /cart/items/:id`        | Quantidade e remoção.                                                                                                                                                                                                           |
|           | `PUT/DELETE /cart/coupon`             | `{code}`; 422 inválido ou expirado.                                                                                                                                                                                             |
| Cotação   | `POST /checkout/quote`                | Carrinho precificado agora: itens, cupom, resumo e `id` (impressão digital de preços, quantidades, estoque, cupom e taxas). 409 se há item indisponível.                                                                        |
| Carteiras | `GET /wallets`                        | Principal e secundária.                                                                                                                                                                                                         |
|           | `POST /wallets`, `PATCH /wallets/:id` | Campos do formulário; uma por tipo; 409 `fieldErrors.address` se o endereço já está na outra.                                                                                                                                   |
|           | `POST /wallet-connections`            | `{walletId \| address, network, provider}` → conexão simulada; 403 se a carteira recusa.                                                                                                                                        |
|           | `DELETE /wallet-connections/:id`      | Desconecta.                                                                                                                                                                                                                     |
| Pedidos   | `POST /orders`                        | Header `Idempotency-Key`; `{quoteId, connectionId, collector}`. A mesma chave com o mesmo corpo devolve o mesmo pedido; com outro corpo, 409. Cotação diferente da atual → 409; conexão encerrada → 422 `fieldErrors.provider`. |
|           | `GET /orders/:id`                     | Estado e recibo: `status` (`pending`/`confirmed`/`rejected`), `version`, transação simulada, carteira, itens e totais congelados no momento do pedido.                                                                          |
| Perfil    | `GET/PATCH /profile`                  | `{displayName, username, email, ensName, walletNickname, avatarUrl}`; 409 com `fieldErrors` para e-mail/usuário em uso.                                                                                                         |
|           | `PUT/DELETE /profile/avatar`          | `{dataUrl}` (imagem cortada e reduzida no navegador).                                                                                                                                                                           |
|           | `POST /profile/password`              | `{currentPassword, newPassword}`; 422 `fieldErrors.currentPassword`.                                                                                                                                                            |

## Eventos Socket.IO

Transporte: `socket.io-client` contra um servidor simulado pelo MSW com `@mswjs/socket.io-binding` (protocolo Engine.IO/Socket.IO real, só transporte WebSocket). Cada evento tem o envelope:

```ts
{ id: string, type, resource: { type, id }, version: number, occurredAt: string, data }
```

| Evento          | `data`                                              | Efeito no cliente                                                                                                                                                                  |
| --------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nft.updated`   | `{id, price, available, editions[{id, available}]}` | Corrige preço e estoque no catálogo, destaques e detalhe (só se `version` for maior que a do cache). Se o NFT está no carrinho, busca o carrinho de novo na API e avisa a mudança. |
| `order.updated` | Pedido completo                                     | Substitui o pedido em cache se a versão for maior e mostra confirmação ou recusa.                                                                                                  |

Regras:

- **Duplicatas:** ids já vistos são ignorados (janela dos últimos 200).
- **Fora de ordem:** versão menor ou igual à do cache é ignorada; nada regride.
- **Sessão:** um socket por usuário ou visitante. Na conexão o cliente envia `session.join` com o token, e o servidor só entrega `order.updated` ao dono do pedido. Entrar, sair ou trocar de usuário fecha o socket anterior com todos os listeners.
- **Reconexão:** ao reconectar, catálogo, carrinho e pedidos ativos são invalidados e refeitos via REST, o que recupera eventos perdidos durante a queda.

Limitações do transporte simulado:

- só WebSocket (sem long-polling), um namespace, sem rooms;
- o binding declara MSW 2 como dependência e roda sobre o MSW 3 do projeto via `overrides` no `package.json`;
- o MSW 3 remove o prefixo `/socket.io/` antes de casar a URL, então o link do servidor simulado é a própria origem;
- o `engine.io-client` captura `globalThis.WebSocket` ao carregar, então o `socket.io-client` é importado sob demanda, depois que o MSW está ativo (de quebra, fica fora do bundle inicial);
- uma conexão recusada pelo servidor simulado fecha sem evento de erro; por isso o cliente usa `timeout: 3000` para tentar de novo em 3 s.

Controles do lado do servidor, para demonstração e testes, ficam em `window.kurioMocks.realtime`: `updateNft`, `replayLast`, `emitStale`, `disconnect`, `connectionCount`.

## Sessão

- **Token:**
  - token opaco no `localStorage`, enviado como Bearer pelo Axios;
  - a sessão vem de `GET /auth/session` e sobrevive a refresh;
  - TTL de 30 minutos no servidor simulado.
- **Expiração:** qualquer 401 em uma requisição que levou token encerra a sessão local, inclusive um refetch em segundo plano.
  - Em rota privada, leva ao login com `redirect` e `sessao=expirada`.
  - Fora dela, mostra um aviso.
  - A marca de expiração fica no `sessionStorage`, para o aviso aparecer mesmo após recarregar.
- **Contexto preservado:** o rascunho do pagamento fica no `sessionStorage` por usuário e é recuperado ao entrar de novo.
- **Rotas privadas:** `/pagamento`, `/pedidos/:id`, `/perfil` e `/perfil/carteiras` são verificadas no `beforeLoad`.
- **Logout e troca de usuário:**
  - removem do cache sessão, carrinho, favoritos, carteiras, pedidos e perfil;
  - apagam os rascunhos de pagamento;
  - criam um novo id de carrinho de visitante;
  - fecham o socket anterior.
- **Login sem resposta:** quando o login não recebe resposta (erro `network`), é repetido uma vez automaticamente; repetir login é inofensivo. O cadastro não repete, porque cairia no próprio conflito de e-mail.

## Carrinho

- **Visitante:** o carrinho do visitante vive na API, identificado por `X-Cart-Id`. Ao entrar ou cadastrar, a API mescla as linhas do visitante no carrinho da conta, somando as quantidades da mesma edição.
- **Quantidade e remoção:** são otimistas, com rollback e aviso quando a API recusa (por estoque ou falha). Adicionar e aplicar cupom gravam a resposta da API no cache.
- **Resumo:** subtotal, desconto, taxa de rede (0,004 ETH mais 0,004 ETH por rede distinta) e total vêm sempre da API.
- **Itens com problema:** um item com `issue` bloqueia "Conectar e finalizar" até ser ajustado.
- **Mudanças em tempo real:** um `nft.updated` de algo que está no carrinho busca o carrinho de novo e avisa a mudança.

## Pagamento e pedidos

1. **"Confirmar compra"** valida o formulário e então:
   - pede a cotação (`POST /checkout/quote`);
   - conecta a carteira (`POST /wallet-connections`), que o servidor pode recusar.
2. **Revisão** (diálogo) mostra itens, totais, carteira conectada (com "Desconectar") e o colecionador.
   - Se o carrinho muda enquanto ela está aberta (por evento), a revisão é recotada e exige "Confirmar com os novos valores".
3. **"Confirmar pagamento"** envia o pedido com `Idempotency-Key`.
   - A tentativa (chave e corpo) fica no `sessionStorage`; reenviar o mesmo corpo usa a mesma chave.
   - Clique repetido, "Tentar novamente" após timeout e "Retomar compra" após recarregar recuperam o mesmo pedido.
   - Se o servidor responde que a cotação mudou, a revisão mostra o que mudou e pede nova confirmação.
4. **Pedido:** nasce `pending` e assenta em 3 s (`confirmed` ou `rejected`, ambos terminais), avisado por `order.updated`.
   - **Recibo:** só aparece para pedido confirmado.
   - **Confirmado:** baixa o estoque e tira do carrinho só os itens e quantidades comprados.
   - **Recusado:** não mexe em nada.
   - O recibo reproduz o snapshot do pedido; mudanças posteriores no catálogo não o alteram.

## Cache, retries e invalidação

| Item             | Política                                                                                                                                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Queries (padrão) | `staleTime` 30 s; repetem até 2 vezes só erros repetíveis; sem refetch ao focar a janela.                                                                                                                               |
| Catálogo         | Chaves por parâmetros normalizados (filtros ordenados); `keepPreviousData` na paginação; o sinal do `AbortController` cancela requisições obsoletas, e o cache isolado por parâmetros descarta respostas fora de ordem. |
| Sessão           | `staleTime` 30 s; sem token não há requisição.                                                                                                                                                                          |
| Carrinho         | `staleTime` 10 s; mutations gravam a resposta da API no cache.                                                                                                                                                          |
| Favoritos        | Exigem sessão; alternância otimista com rollback.                                                                                                                                                                       |
| Pedido           | `staleTime: Infinity`: muda por `order.updated`; refetch em reload e reconexão. Ao confirmar, invalida carrinho e catálogo.                                                                                             |
| Mutations        | Sem retry, exceto o login (uma vez em erro `network`).                                                                                                                                                                  |
| Logout/troca     | Remove todas as consultas privadas.                                                                                                                                                                                     |

## Mocks (MSW)

- **Ativação:** MSW ligado por `VITE_ENABLE_MOCKS`, também no build publicado.
- **Primeira pintura:** a interface renderiza sem esperar o MSW. As requisições e o socket aguardam a camada de rede (`network-ready.ts`), que no build de demo é o MSW.
- **Persistência:** o banco simulado (`src/mocks/db.ts`) persiste no `localStorage` carrinhos, contas, sessões, favoritos, carteiras e pedidos. O catálogo recomeça dos fixtures, descontado o vendido.
- **Reset:** `kurioMocks.reset()` restaura o estado inicial conhecido.
- **Fixtures:** 40 NFTs (variedade para filtros e paginação), 2 usuários e as carteiras deles.
- **Cenários:** determinísticos (lista no README), com latência variável em ciclo fixo.
- **Coerência:** REST e eventos leem o mesmo banco. Uma mudança feita pelos controles aparece tanto na resposta REST quanto no evento.

## Acessibilidade

- **Teclado e foco:** operação completa por teclado, foco visível e foco controlado em diálogos e drawers (abre no primeiro campo).
- **Formulários:** labels associados, com o asterisco de obrigatório fora do `<label>` e `aria-required`. Erros ligados por `aria-describedby` e `aria-invalid`.
- **Seleções:** abas e filtros são botões `aria-pressed`. A seleção também muda o peso da fonte, não só a cor. Edição esgotada fica riscada e é anunciada.
- **Feedback de mutações e tempo real:** toasts (`aria-live`) e regiões de status. O pedido pendente anuncia a mudança de estado.
- **Toque:** alvos de pelo menos 24 px. Os pontos dos carrosséis têm 24 px clicáveis, com o ponto visual do Figma dentro.
- **Carregamento:** skeletons com shimmer respeitam `prefers-reduced-motion` e preservam as dimensões, para não haver deslocamento de layout.
- **Indisponível na demo:** ações fora do escopo usam `aria-disabled` e um aviso, e nunca simulam sucesso.

## Performance e Lighthouse

Auditoria do build de demo servido com compressão (ver README), medianas de 3 execuções:

| Página  | Perfil  | Perf. | A11y |  BP | SEO |    LCP |   CLS |   TBT |
| ------- | ------- | ----: | ---: | --: | --: | -----: | ----: | ----: |
| Início  | mobile  |    77 |  100 | 100 | 100 | 4,45 s | 0,003 | 34 ms |
| Início  | desktop |    98 |  100 | 100 | 100 | 1,03 s | 0,004 |  0 ms |
| Detalhe | mobile  |    75 |  100 | 100 | 100 | 4,64 s | 0,000 | 72 ms |
| Detalhe | desktop |    98 |  100 | 100 | 100 | 1,07 s | 0,000 |  0 ms |

**Abaixo da meta: performance mobile (75–77).** O perfil mobile do Lighthouse simula 4G lento (1,6 Mbps, 150 ms de latência) e CPU 4× mais lenta.

- **Primeira pintura:** antes dela, o cliente precisa baixar e executar cerca de 200 KB gzip de JavaScript da aplicação: React DOM, TanStack Router e Query, zod, Axios e decimal.js.
- **Mocks na mesma banda:** a camada de mocks (MSW, handlers e fixtures, 162 KB gzip) faz parte da entrega e disputa a mesma banda.
- **Dados:** as imagens do detalhe e do catálogo dependem da resposta da API simulada, que tem latência de 180–400 ms no cenário padrão.
- **Medido no Chrome:** sem throttling, o FCP medido é de cerca de 0,3 s. É o modelo de rede e CPU do Lighthouse que leva o FCP simulado a cerca de 3,5 s.

Já feito:

- build minificado com code splitting por rota;
- `socket.io-client` e o menu da conta carregados sob demanda;
- primeira pintura sem esperar o MSW;
- compressão;
- skeleton com a altura do detalhe (CLS zero);
- imagens com `width`/`height`, lazy fora da primeira dobra e `fetchpriority` na principal.

O próximo passo seria renderizar o shell no servidor (SSR/prerender), fora da stack definida. Desktop, acessibilidade, boas práticas e SEO atingem as metas.

## Testes

- **E2E:** Playwright sobre o build de demo, nos projetos desktop (1440) e mobile (390).
  - Os testes observam a interface e os resultados das operações.
  - O REST passa pelos handlers MSW; os eventos passam pelo `socket.io-client`, disparados pelos controles do servidor simulado.
  - Cenários e estado começam limpos a cada teste.
- **Regressão visual** (`e2e/visual.spec.ts`): Início, Detalhe, Carrinho, Login e Pagamento.
  - **Estabilidade:** relógio congelado, imagens e fontes carregadas, animações desligadas e toasts mascarados.
  - **Recorte:** desktop captura a página inteira; mobile e diálogos capturam a tela.
  - **Referências:** são por sistema operacional (as versionadas são de Windows), com tolerância de 0,2% dos pixels.

## Decisões de UX e desvios do Figma

- **Login e cadastro:** diálogo sobre a Início em telas largas, página inteira no mobile. Google e Facebook aparecem, mas avisam que estão indisponíveis.
- **Pagamento no mobile:** em duas etapas, primeiro os dados do colecionador e depois a carteira (frame "Pagamento com carteira"). A revisão antes do envio é um diálogo (não existe no Figma).
- **Recibo:** fica em `/pedidos/:id`, no estilo do modal do Figma, e funciona por acesso direto e no mobile. Pedidos pendentes e recusados têm estados próprios.
- **Perfil e carteiras no mobile (sem frame):** o menu lateral vira uma faixa horizontal. Itens fora do escopo (Atividade, Lista de interesse, Ofertas, Arquivos baixados, Suporte) avisam que estão indisponíveis.
- **Carrinho:**
  - a tabela do desktop é um grid com papéis ARIA de tabela e mostra a edição de cada linha;
  - no mobile, a lixeira fica no canto do card (no Figma ela sobrepõe o "+").
- **Detalhe:**
  - os rótulos "Contrato" e "Direitos autorais" estão trocados no Figma e foram corrigidos;
  - a edição padrão é a primeira disponível;
  - a aba "Avaliações" mostra só o resumo.
- **Banner:** o texto do segundo banner foi encurtado para caber nas 3 linhas do card.
- **Pontos dos carrosséis:** espaçamento maior que no Figma, para dar 24 px de área de toque.
- **Pagamento:**
  - "Nome ENS" é um campo de texto com `.eth` fixo (o frame mostra só o seletor);
  - a primeira opção de "Carteira e rede" é WalletConnect, com o selo de carteiras compatíveis;
  - no mobile, a Coinbase usa a inicial "C", como as demais.
- **Ícones refeitos:** o ícone "THANK YOU" do recibo foi redesenhado em SVG e os ícones do menu do perfil vêm do `lucide-react`, porque esses assets não puderam ser exportados do arquivo de design.
- **Dados e imagens:** os nomes, IDs de token e edições dos fixtures foram tornados consistentes. As imagens de NFT são as quatro ilustrações do Figma, servidas localmente.

## Limitações conhecidas

- **Performance mobile** abaixo de 90 no Lighthouse (ver acima).
- **Sem integração real:** não há blockchain, extensão de carteira nem gateway. Transações e links de exploração (Etherscan e similares) são simulados.
- **Testes paralelos:** sob a suíte inteira em paralelo, raramente o `POST /api/auth/login` de uma página falha no service worker do MSW antes de chegar ao handler (`net::ERR_FAILED`, inclusive na repetição automática). Não se reproduziu isolado (40 execuções sob carga); a causa não foi isolada. O Playwright repete uma vez os testes que falham e os marca como _flaky_ no relatório, com o trace da falha.
- **Regressão visual em outro sistema:** exige gerar as referências daquele sistema (ver README).
