# Guia do Usuário — Cantina Universitária

Bem-vindo ao sistema da Cantina Universitária! Este guia explica como usar o sistema de acordo com o seu perfil de acesso.

---

## Acessando o Sistema

Abra o navegador e acesse:

```
http://localhost:5173
```

Na tela de login, informe seu **e-mail** e **senha** e clique em **Entrar**.

Se ainda não tem conta, clique em **Cadastre-se** para criar uma conta de cliente.

> Contas de funcionário e gerente são criadas pelo administrador do sistema.

---

## Perfil: Cliente

### Tela de Cardápio

Após o login, você é direcionado automaticamente para o **Cardápio**.

**O que você pode fazer:**

- **Buscar produtos** pelo nome usando a barra de pesquisa
- **Filtrar por categoria** usando o menu suspenso ao lado da busca
- Ver o **status** de cada produto (Disponível / Em falta)
- Ver a **foto**, **descrição** e **preço** de cada item

**Adicionando itens ao carrinho:**

1. Clique no botão **Adicionar** no produto desejado
2. O produto entra no carrinho com quantidade 1
3. Use os botões **+** e **−** que aparecem no card para ajustar a quantidade
4. O botão **−** remove o item do carrinho quando a quantidade chega a zero
5. Um botão flutuante no canto inferior direito mostra quantos itens estão no carrinho

> Produtos marcados como **Em falta** não podem ser adicionados ao carrinho.

---

### Tela do Carrinho

Acesse o carrinho clicando em **Carrinho** no menu superior ou no botão flutuante.

**O que você pode fazer:**

- Ver todos os itens adicionados com quantidade e subtotal
- Ajustar a quantidade de cada item com os botões **+** e **−**
- Remover um item clicando no ícone de lixeira
- Adicionar uma **observação** ao pedido (ex: "sem cebola", "bem passado")
- Ver o **resumo** com o valor total
- Clicar em **Limpar carrinho** para remover tudo
- Clicar em **Fazer Pedido** para confirmar o pedido

Após confirmar, você é redirecionado para a tela de **Meus Pedidos**.

---

### Tela de Meus Pedidos

Acesse clicando em **Meus Pedidos** no menu superior.

**O que você vê:**

- **Pedidos Ativos** — pedidos que ainda estão em andamento
- **Histórico** — pedidos já concluídos ou cancelados

Cada pedido mostra:
- Número do pedido (primeiros 8 caracteres do ID)
- Data e hora do pedido
- Status atual com ícone visual
- Valor total

**Clique em um pedido** para expandir e ver:
- Lista de itens com quantidades e subtotais
- Observações do pedido (se houver)
- Motivo do cancelamento (se cancelado)
- Botão para cancelar (apenas pedidos com status **Pendente**)

#### Status dos Pedidos

| Status | Significado |
|---|---|
| ⏳ Pendente | Pedido recebido, aguardando confirmação da cantina |
| 👍 Aceito | Pedido confirmado pela cantina |
| 👨‍🍳 Em Preparo | Seu pedido está sendo preparado |
| ✅ Pronto para Retirada | Vá buscar seu pedido no balcão! |
| 🎉 Retirado | Pedido entregue com sucesso |
| ❌ Cancelado | Pedido cancelado |

#### Cancelando um Pedido

Você só pode cancelar pedidos com status **Pendente**.

1. Clique no pedido para expandir
2. Clique em **Cancelar pedido**
3. Confirme clicando em **Confirmar cancelamento**

> Atenção: cancelamentos frequentes podem resultar no bloqueio da sua conta.

---

### Notificações

O sistema envia alertas automáticos quando:

- Seu pedido é **aceito** pela cantina
- Seu pedido está **pronto para retirada**
- Seu pedido é **cancelado**

As notificações aparecem como mensagens no canto superior direito da tela. O ícone de **Meus Pedidos** no menu mostra um contador vermelho com o número de notificações não lidas.

---

### Saindo do Sistema

Clique no ícone de **sair** (→) no canto superior direito do cabeçalho.

---

## Perfil: Funcionário

Após o login, você é direcionado para a tela de **Pedidos**.

A navegação fica na barra lateral esquerda com as seções: **Pedidos** e **Produtos**.

---

### Tela de Pedidos

Esta é a tela principal do funcionário. Ela atualiza automaticamente a cada 10 segundos.

**Painel de resumo:**

No topo da tela há 4 cards clicáveis mostrando a contagem de pedidos por status:
- Pendente
- Aceito
- Em Preparo
- Pronto

Clique em um card para filtrar a lista por aquele status.

**Filtros rápidos:**

Use os botões de filtro abaixo do painel para ver pedidos por status específico. Clique em **Todos** para remover o filtro.

**Atualizando manualmente:**

Clique no botão **Atualizar** no canto superior direito para forçar uma atualização imediata.

**Gerenciando um pedido:**

1. Clique no pedido para expandir os detalhes
2. Veja os itens, quantidades e observações do cliente
3. Use os botões de ação:

| Botão | Ação |
|---|---|
| **Aceitar** | Confirma o pedido (Pendente → Aceito) |
| **Iniciar Preparo** | Inicia o preparo (Aceito → Em Preparo) |
| **Marcar Pronto** | Avisa o cliente que está pronto (Em Preparo → Pronto) |
| **Confirmar Retirada** | Finaliza o pedido (Pronto → Retirado) |
| **Cancelar** | Cancela o pedido em qualquer etapa antes de Pronto |

**Cancelando um pedido:**

1. Clique em **Cancelar**
2. Digite o motivo do cancelamento no campo que aparece
3. Clique em **Confirmar Cancelamento**

> O estoque dos produtos é devolvido automaticamente ao cancelar.

**Notificações de novos pedidos:**

Quando um cliente faz um pedido, você recebe:
- Um alerta sonoro (bipe)
- Uma notificação visual no canto da tela
- O contador vermelho no menu lateral de Pedidos é atualizado

---

### Tela de Produtos

Acesse clicando em **Produtos** na barra lateral.

#### Criando um Novo Produto

1. Clique no botão **Novo Produto** no canto superior direito
2. Preencha o formulário:
   - **Foto** — clique para selecionar uma imagem (JPEG, PNG ou WebP, máx. 5MB)
   - **Nome** — obrigatório
   - **Descrição** — opcional
   - **Preço** — valor em reais (ex: 12.50)
   - **Quantidade** — estoque disponível
   - **Categoria** — selecione uma categoria existente
   - **Status** — Disponível, Em falta ou Inativo
3. Clique em **Criar Produto**

> Se a quantidade for 0, o status é definido automaticamente como **Em falta**.

#### Editando um Produto

1. Clique no botão **Editar** (ícone de lápis) no card do produto
2. Altere os campos desejados
3. Para trocar a foto, selecione uma nova imagem
4. Clique em **Salvar**

#### Alterando o Status de um Produto

Clique no ícone de **toggle** (interruptor) no card do produto:
- Verde (ligado) = Disponível
- Cinza (desligado) = Em falta

Isso alterna rapidamente entre **Disponível** e **Em falta** sem abrir o formulário de edição.

#### Excluindo um Produto

1. Clique no ícone de **lixeira** no card do produto
2. Confirme a exclusão na janela de confirmação

> Se o produto estiver em pedidos ativos, ele será **inativado** em vez de excluído, para preservar o histórico.

#### Buscando Produtos

Use a barra de busca no topo da tela para filtrar produtos pelo nome.

---

## Perfil: Gerente

O gerente tem acesso a tudo que o funcionário tem, mais as seções **Relatórios** e **Usuários** na barra lateral.

---

### Tela de Relatórios

Acesse clicando em **Relatórios** na barra lateral.

A tela é dividida em 4 abas:

#### Aba: Resumo

Visão geral do sistema com:
- Total de pedidos e distribuição por status
- Receita de hoje, do mês atual e total geral
- Quantidade de produtos ativos
- Total de clientes cadastrados

#### Aba: Mais Vendidos

Gráfico de barras com os 10 produtos mais vendidos (por quantidade).

A tabela abaixo do gráfico mostra para cada produto:
- Posição no ranking
- Nome do produto
- Total de unidades vendidas
- Número de pedidos em que apareceu
- Receita gerada

#### Aba: Horários de Pico

Gráfico de barras mostrando em quais horários do dia ocorre mais retirada de pedidos (das 0h às 23h).

Use este relatório para planejar a escala de funcionários nos horários de maior movimento.

#### Aba: Cancelamentos

Gráfico de pizza e tabela com os produtos que aparecem em mais pedidos cancelados.

Mostra para cada produto:
- Número de cancelamentos
- Valor total perdido com cancelamentos

---

### Tela de Usuários

Acesse clicando em **Usuários** na barra lateral.

#### Visualizando Usuários

A tabela mostra todos os usuários cadastrados com:
- Nome e e-mail
- Perfil (cliente, funcionário, gerente)
- Número de cancelamentos realizados
- Status da conta (Ativo / Banido)

Use a barra de busca para filtrar por nome ou e-mail.

#### Identificando Usuários Problemáticos

O número de cancelamentos é destacado em cores:
- **Preto** — normal (menos de 3 cancelamentos)
- **Amarelo** — atenção (3 a 4 cancelamentos)
- **Vermelho com ⚠️** — alto risco (5 ou mais cancelamentos)

#### Visualizando o Histórico de Pedidos

1. Clique no ícone de **olho** na linha do usuário
2. Uma janela abre com todos os pedidos daquele usuário
3. Cada pedido mostra data, status e valor
4. Pedidos cancelados mostram o motivo do cancelamento

#### Banindo um Usuário

Para banir um usuário que abusa de cancelamentos:

1. Clique no ícone de **olho** para abrir o histórico
2. Clique em **Banir usuário** no rodapé da janela
3. Confirme a ação

Ou diretamente na tabela:
1. Clique no ícone de **ban** (círculo com traço) na linha do usuário

> Usuários banidos não conseguem fazer login. Eles recebem a mensagem: *"Sua conta foi banida. Entre em contato com a cantina."*

#### Desbanindo um Usuário

1. Localize o usuário banido (aparece com badge **Banido** em vermelho)
2. Clique no ícone de **check verde** para desbanir
3. Ou abra o histórico e clique em **Desbanir usuário**

---

## Perguntas Frequentes

**Não consigo adicionar um produto ao carrinho.**
O produto pode estar marcado como **Em falta**. Aguarde a cantina repor o estoque.

**Meu pedido sumiu da lista de ativos.**
Pedidos com status **Retirado** ou **Cancelado** são movidos para o **Histórico** na parte inferior da tela.

**Não estou recebendo notificações.**
Verifique se o backend está rodando. As notificações dependem de conexão com o servidor. Recarregue a página para reconectar.

**Esqueci minha senha.**
No momento o sistema não possui recuperação de senha por e-mail. Entre em contato com o administrador da cantina para redefinição manual.

**Não consigo fazer login.**
- Verifique se o e-mail e senha estão corretos
- Sua conta pode estar banida — entre em contato com a cantina
- Verifique se o servidor está rodando em `localhost:3001`

**Como criar uma conta de funcionário ou gerente?**
Contas com esses perfis precisam ser criadas diretamente no banco de dados pelo administrador, ou via seed. O cadastro pela tela de registro cria apenas contas de **cliente**.
