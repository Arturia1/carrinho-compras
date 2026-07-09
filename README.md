# ⚡ TechMarket - API de Carrinho de Compras

Este projeto é a implementação de um desafio técnico full-stack focado na construção de um sistema de carrinho de compras (e-commerce). A aplicação possui um back-end robusto focado em regras de negócio e um front-end dinâmico para simular a experiência do cliente.

## 🛠️ Tecnologias Utilizadas

**Back-end:**
* Node.js com Express e TypeScript
* Prisma ORM
* PostgreSQL (Supabase)

**Front-end:**
* React (com Axios para consumo da API)
* Gerenciamento de estado local com React Hooks

---

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos
* Node.js instalado (v18 ou superior)
* Acesso a um banco de dados PostgreSQL (recomenda-se Supabase)

### 2. Configurando o Back-end
1. Navegue até a pasta do servidor:
   ```cd backend```

2. Instale as dependências:
    ```npm install```

3. Crie um arquivo .env na raiz da pasta backend/ e adicione a sua string de conexão:
    ```DATABASE_URL="sua_string_de_conexao_postgresql_aqui"```

4. Sincronize o banco de dados e popule o catálogo inicial (Seed):
    ```npx prisma db push```
    ```npx tsx prisma/seed.ts```

5. Inicie o servidor:
    ```npm run dev```
    A API estará rodando em http://localhost:3000

### 3. Configurando o Front-end
1. Em um novo terminal, navegue até a pasta do cliente:
    ```cd frontend```

2. Instale as dependências:
    ```npm install```

3. Inicie a aplicação React:
   ``` npm run dev```

### 4. Decisões de Design e Arquitetura
O projeto foi construído priorizando a Separação de Responsabilidades e a Integridade dos Dados:

Isolamento de Regras de Negócio: O arquivo routes.ts atua apenas como a camada de transporte (recebendo e respondendo requisições HTTP). Toda a lógica de cálculo, aplicação de cupons e validações complexas foi extraída para o CartService.

Cálculos Dinâmicos: Subtotais, descontos e totais não são salvos em colunas estáticas no banco de dados. Eles são calculados em tempo de execução na requisição getCart, evitando dessincronização de dados.

Transação Atômica no Checkout: A rota de finalização de compra utiliza prisma.$transaction. Isso garante que a baixa no estoque de todos os itens ocorra de forma simultânea. Se um único produto não tiver estoque suficiente, toda a transação sofre rollback, prevenindo furos de estoque.

Persistência de Sessão (Radar): O front-end consulta o back-end ao carregar a página para identificar qual é o carrinho ativo (ABERTO) mais recente do usuário, garantindo persistência mesmo após o fechamento do navegador.

### 5. Decisões de Design e Arquitetura
Pensando na evolução do produto para um ambiente de produção real, os próximos passos seriam:

Módulo de PDV (Frente de Caixa): Evoluir a interface atual com um menu de administração para incluir rotinas de "Abertura e Fechamento de Caixa", permitindo a exportação de relatórios consolidados das vendas do turno.

Painel de Gestão de Estoque: Implementar rotas protegidas onde um gestor possa lançar "Entradas de Mercadoria" para reabastecer o catálogo de forma auditável.

Emissão de Nota Fiscal (NFe): Integração com um serviço de mensageria (ex: RabbitMQ/SQS) para gerar a NFe de forma assíncrona após o checkout.


### 6 🎥 Demonstração em Vídeo: [Clique aqui para assistir à apresentação do projeto funcionando](https://youtu.be/2jqjW5XH82E)




