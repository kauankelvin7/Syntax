/**
 * 📋 SNIPPETS RÁPIDOS - Dados de Referência para Engenharia de Software (Syntax Theme)
 * * Arquivo separado para manter o componente limpo.
 * Contém: Códigos HTTP, Comandos Git, Portas Comuns, Linux CLI e Big O Notation.
 */

export const httpCodesData = [
  {
    categoria: '2xx - Sucesso',
    codigos: [
      { codigo: '200 OK', descricao: 'A requisição foi bem sucedida.' },
      { codigo: '201 Created', descricao: 'Requisição bem sucedida e um novo recurso foi criado.' },
      { codigo: '204 No Content', descricao: 'Requisição bem sucedida, mas não há conteúdo para retornar.' }
    ]
  },
  {
    categoria: '3xx - Redirecionamento',
    codigos: [
      { codigo: '301 Moved Permanently', descricao: 'A URL do recurso mudou permanentemente.' },
      { codigo: '304 Not Modified', descricao: 'O recurso não foi modificado desde a última requisição (uso de cache).' }
    ]
  },
  {
    categoria: '4xx - Erro do Cliente',
    codigos: [
      { codigo: '400 Bad Request', descricao: 'O servidor não entendeu a requisição (sintaxe inválida).' },
      { codigo: '401 Unauthorized', descricao: 'Requer autenticação do usuário (falta de token).' },
      { codigo: '403 Forbidden', descricao: 'O cliente não tem direitos de acesso ao conteúdo.' },
      { codigo: '404 Not Found', descricao: 'O servidor não pode encontrar o recurso solicitado.' },
      { codigo: '429 Too Many Requests', descricao: 'O usuário enviou muitas requisições em um dado tempo (Rate Limiting).' }
    ]
  },
  {
    categoria: '5xx - Erro do Servidor',
    codigos: [
      { codigo: '500 Internal Server Error', descricao: 'O servidor encontrou uma situação com a qual não sabe lidar.' },
      { codigo: '502 Bad Gateway', descricao: 'O servidor obteve uma resposta inválida de outro servidor (proxy).' },
      { codigo: '503 Service Unavailable', descricao: 'O servidor não está pronto para manipular a requisição (sobrecarga ou down).' }
    ]
  }
];

export const gitCommandsData = [
  {
    categoria: 'Essenciais',
    comandos: [
      { comando: 'git init', descricao: 'Inicializa um novo repositório local.' },
      { comando: 'git clone [url]', descricao: 'Baixa um projeto e seu histórico de versão inteiro.' },
      { comando: 'git status', descricao: 'Lista todos os arquivos novos ou modificados para serem commitados.' }
    ]
  },
  {
    categoria: 'Branches & Merges',
    comandos: [
      { comando: 'git branch', descricao: 'Lista todas as branches locais no repositório atual.' },
      { comando: 'git checkout -b [nome]', descricao: 'Cria uma nova branch e muda para ela.' },
      { comando: 'git merge [branch]', descricao: 'Combina o histórico da branch especificada com a atual.' },
      { comando: 'git rebase [branch]', descricao: 'Aplica os commits da branch atual sobre a base da branch especificada.' }
    ]
  },
  {
    categoria: 'Desfazendo Alterações',
    comandos: [
      { comando: 'git reset [commit]', descricao: 'Desfaz todos os commits depois do [commit], preservando mudanças no disco.' },
      { comando: 'git reset --hard [commit]', descricao: 'Descarta todo histórico e mudanças após o commit especificado (Cuidado!).' },
      { comando: 'git revert [commit]', descricao: 'Cria um novo commit que desfaz as alterações de um commit anterior.' }
    ]
  }
];

export const commonPortsData = [
  { porta: '21', servico: 'FTP', protocolo: 'TCP', uso: 'Transferência de arquivos.' },
  { porta: '22', servico: 'SSH', protocolo: 'TCP', uso: 'Login remoto seguro e SFTP.' },
  { porta: '53', servico: 'DNS', protocolo: 'TCP/UDP', uso: 'Resolução de nomes de domínio.' },
  { porta: '80', servico: 'HTTP', protocolo: 'TCP', uso: 'Tráfego web não criptografado.' },
  { porta: '443', servico: 'HTTPS', protocolo: 'TCP', uso: 'Tráfego web criptografado (SSL/TLS).' },
  { porta: '3306', servico: 'MySQL', protocolo: 'TCP', uso: 'Banco de dados relacional (MySQL / MariaDB).' },
  { porta: '5432', servico: 'PostgreSQL', protocolo: 'TCP', uso: 'Banco de dados relacional avançado.' },
  { porta: '6379', servico: 'Redis', protocolo: 'TCP', uso: 'Banco de dados em memória (Cache).' },
  { porta: '27017', servico: 'MongoDB', protocolo: 'TCP', uso: 'Banco de dados NoSQL orientado a documentos.' }
];

export const linuxCliData = [
  { comando: 'ls -la', uso: 'Lista arquivos em formato longo, incluindo os ocultos.' },
  { comando: 'cd /caminho', uso: 'Muda o diretório atual para o caminho especificado.' },
  { comando: 'pwd', uso: 'Exibe o caminho completo do diretório atual.' },
  { comando: 'mkdir [nome]', uso: 'Cria um novo diretório.' },
  { comando: 'rm -rf [dir]', uso: 'Remove um diretório e seu conteúdo forçadamente (Cuidado!).' },
  { comando: 'grep "texto" arquivo', uso: 'Busca por um texto específico dentro de um arquivo.' },
  { comando: 'chmod 755 [arquivo]', uso: 'Altera as permissões (Dono lê/escreve/executa, outros leem/executam).' },
  { comando: 'top / htop', uso: 'Exibe os processos em execução e o uso de CPU/RAM em tempo real.' },
  { comando: 'tail -f [log]', uso: 'Mostra as últimas linhas de um arquivo em tempo real (útil para logs).' }
];

export const bigOData = [
  { 
    complexidade: 'O(1)', 
    nome: 'Constante', 
    exemplo: 'Acesso a um array por índice ou Hash Map.', 
    classificacao: 'Excelente' 
  },
  { 
    complexidade: 'O(log n)', 
    nome: 'Logarítmica', 
    exemplo: 'Busca Binária (Binary Search).', 
    classificacao: 'Boa' 
  },
  { 
    complexidade: 'O(n)', 
    nome: 'Linear', 
    exemplo: 'Loop simples iterando por um array (for loop).', 
    classificacao: 'Justa' 
  },
  { 
    complexidade: 'O(n log n)', 
    nome: 'Linearítmica', 
    exemplo: 'Algoritmos de ordenação eficientes (Merge Sort, Quick Sort).', 
    classificacao: 'Ruim' 
  },
  { 
    complexidade: 'O(n²)', 
    nome: 'Quadrática', 
    exemplo: 'Loops aninhados (Bubble Sort ruim, matrizes 2D).', 
    classificacao: 'Péssima' 
  },
  { 
    complexidade: 'O(2^n)', 
    nome: 'Exponencial', 
    exemplo: 'Cálculo recursivo de Fibonacci sem Memoization.', 
    classificacao: 'Terrível' 
  }
];