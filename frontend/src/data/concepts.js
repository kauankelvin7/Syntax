export const CONCEPTS = [
  // CS Fundamentals
  {
    id: 'logic-gates',
    label: 'Portas Lógicas',
    area: 'cs-fundamentals',
    level: 'iniciante',
    description: 'Fundamentos de eletrônica digital: AND, OR, NOT, XOR e como elas formam processadores.',
    prerequisites: [],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 4
  },
  {
    id: 'binary',
    label: 'Sistema Binário',
    area: 'cs-fundamentals',
    level: 'iniciante',
    description: 'Representação de dados em base 2, conversão decimal e operações bitwise.',
    prerequisites: ['logic-gates'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 3
  },
  {
    id: 'memory-management',
    label: 'Gestão de Memória',
    area: 'cs-fundamentals',
    level: 'intermediário',
    description: 'Stack vs Heap, ponteiros, garbage collection e segmentação de memória.',
    prerequisites: ['binary'],
    resources: { flashcards: true, resumos: true, simulados: false },
    estimatedHours: 8
  },
  {
    id: 'operating-systems',
    label: 'Sistemas Operacionais',
    area: 'cs-fundamentals',
    level: 'intermediário',
    description: 'Kernel, processos, threads, scheduling e sistemas de arquivos.',
    prerequisites: ['memory-management'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 12
  },
  {
    id: 'networking-basics',
    label: 'Redes: Básico',
    area: 'cs-fundamentals',
    level: 'iniciante',
    description: 'Como computadores se comunicam: IPs, portas, roteamento básico.',
    prerequisites: [],
    resources: { flashcards: true, resumos: false, simulados: true },
    estimatedHours: 6
  },
  {
    id: 'tcp-ip',
    label: 'Modelo TCP/IP',
    area: 'cs-fundamentals',
    level: 'intermediário',
    description: 'Camadas de rede, handshake TCP, pacotes e endereçamento.',
    prerequisites: ['networking-basics'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 10
  },
  {
    id: 'http-protocol',
    label: 'Protocolo HTTP',
    area: 'cs-fundamentals',
    level: 'iniciante',
    description: 'Requests, responses, status codes, headers e verbos HTTP.',
    prerequisites: ['tcp-ip'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 5
  },
  {
    id: 'dns',
    label: 'DNS',
    area: 'cs-fundamentals',
    level: 'iniciante',
    description: 'Sistema de nomes de domínio, propagação e tipos de registros.',
    prerequisites: ['networking-basics'],
    resources: { flashcards: true, resumos: true, simulados: false },
    estimatedHours: 4
  },

  // Algorithms
  {
    id: 'big-o',
    label: 'Notação Big O',
    area: 'algorithms',
    level: 'iniciante',
    description: 'Análise de complexidade de tempo e espaço de algoritmos.',
    prerequisites: [],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 6
  },
  {
    id: 'arrays',
    label: 'Arrays & Strings',
    area: 'algorithms',
    level: 'iniciante',
    description: 'Manipulação básica, busca linear e ordenação simples.',
    prerequisites: ['big-o'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 5
  },
  {
    id: 'linked-lists',
    label: 'Linked Lists',
    area: 'algorithms',
    level: 'iniciante',
    description: 'Listas ligadas simples, duplas e circulares.',
    prerequisites: ['arrays'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 6
  },
  {
    id: 'stacks-queues',
    label: 'Stacks & Queues',
    area: 'algorithms',
    level: 'iniciante',
    description: 'Pilhas (LIFO) e Filas (FIFO) e suas aplicações.',
    prerequisites: ['linked-lists'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 4
  },
  {
    id: 'recursion',
    label: 'Recursão',
    area: 'algorithms',
    level: 'intermediário',
    description: 'Funções recursivas, caso base e stack overflow.',
    prerequisites: ['stacks-queues'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 8
  },
  {
    id: 'trees',
    label: 'Árvores (Trees)',
    area: 'algorithms',
    level: 'intermediário',
    description: 'Binary Trees, BST, AVL e algoritmos de travessia (DFS, BFS).',
    prerequisites: ['recursion'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 12
  },
  {
    id: 'graphs',
    label: 'Grafos (Graphs)',
    area: 'algorithms',
    level: 'avançado',
    description: 'Representação, Dijkstra, A* e busca em largura/profundidade.',
    prerequisites: ['trees'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 15
  },
  {
    id: 'sorting',
    label: 'Ordenação',
    area: 'algorithms',
    level: 'intermediário',
    description: 'QuickSort, MergeSort, HeapSort e estabilidade.',
    prerequisites: ['recursion'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 10
  },

  // Frontend
  {
    id: 'html-css',
    label: 'HTML & CSS',
    area: 'frontend',
    level: 'iniciante',
    description: 'Estrutura semântica, Box Model, Flexbox e Grid Layout.',
    prerequisites: [],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 20
  },
  {
    id: 'javascript-basics',
    label: 'JS Básico',
    area: 'frontend',
    level: 'iniciante',
    description: 'Variáveis, tipos, funções, DOM API e eventos.',
    prerequisites: ['html-css'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 25
  },
  {
    id: 'javascript-advanced',
    label: 'JS Avançado',
    area: 'frontend',
    level: 'intermediário',
    description: 'Closures, Prototypes, Async/Await, Event Loop.',
    prerequisites: ['javascript-basics'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 30
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    area: 'frontend',
    level: 'intermediário',
    description: 'Tipagem estática, Interfaces, Generics e Decorators.',
    prerequisites: ['javascript-advanced'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 20
  },
  {
    id: 'react-basics',
    label: 'React Básico',
    area: 'frontend',
    level: 'intermediário',
    description: 'JSX, Components, Props e State.',
    prerequisites: ['javascript-advanced'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 20
  },
  {
    id: 'react-hooks',
    label: 'React Hooks',
    area: 'frontend',
    level: 'intermediário',
    description: 'useState, useEffect, useContext, useMemo, useCallback.',
    prerequisites: ['react-basics'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 15
  },
  {
    id: 'state-management',
    label: 'Gestão de Estado',
    area: 'frontend',
    level: 'avançado',
    description: 'Redux, Zustand, Context API e padrões de fluxo de dados.',
    prerequisites: ['react-hooks'],
    resources: { flashcards: true, resumos: true, simulados: false },
    estimatedHours: 15
  },
  {
    id: 'web-performance',
    label: 'Performance Web',
    area: 'frontend',
    level: 'avançado',
    description: 'Core Web Vitals, Lazy Loading, Caching e Bundling.',
    prerequisites: ['react-hooks'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 12
  },

  // Backend
  {
    id: 'node-basics',
    label: 'Node.js Básico',
    area: 'backend',
    level: 'iniciante',
    description: 'Runtime, NPM, módulos CommonJS/ESM e FS API.',
    prerequisites: ['javascript-basics'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 15
  },
  {
    id: 'rest-api',
    label: 'REST APIs',
    area: 'backend',
    level: 'intermediário',
    description: 'Design de endpoints, JSON, status codes e statelessness.',
    prerequisites: ['node-basics', 'http-protocol'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 10
  },
  {
    id: 'sql-basics',
    label: 'SQL Básico',
    area: 'database',
    level: 'iniciante',
    description: 'SELECT, INSERT, UPDATE, DELETE e JOINS simples.',
    prerequisites: [],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 12
  },
  {
    id: 'sql-advanced',
    label: 'SQL Avançado',
    area: 'database',
    level: 'intermediário',
    description: 'Indexes, Transactions, ACID e normalização.',
    prerequisites: ['sql-basics'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 15
  },
  {
    id: 'nosql',
    label: 'NoSQL',
    area: 'database',
    level: 'intermediário',
    description: 'MongoDB, Redis, Documentos vs Key-Value.',
    prerequisites: [],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 10
  },
  {
    id: 'authentication',
    label: 'Autenticação',
    area: 'backend',
    level: 'intermediário',
    description: 'JWT, OAuth2, Cookies e Sessions.',
    prerequisites: ['rest-api'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 12
  },
  {
    id: 'message-queues',
    label: 'Mensageria',
    area: 'backend',
    level: 'avançado',
    description: 'RabbitMQ, Kafka, Pub/Sub e processamento assíncrono.',
    prerequisites: ['authentication'],
    resources: { flashcards: true, resumos: true, simulados: false },
    estimatedHours: 15
  },
  {
    id: 'microservices',
    label: 'Microserviços',
    area: 'backend',
    level: 'avançado',
    description: 'Decomposição, API Gateway, Service Discovery.',
    prerequisites: ['message-queues', 'docker'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 20
  },

  // Architecture
  {
    id: 'solid',
    label: 'SOLID',
    area: 'architecture',
    level: 'intermediário',
    description: 'Os 5 princípios para design de software orientado a objetos.',
    prerequisites: ['javascript-basics'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 10
  },
  {
    id: 'design-patterns',
    label: 'Design Patterns',
    area: 'architecture',
    level: 'intermediário',
    description: 'Singleton, Factory, Observer, Strategy e mais.',
    prerequisites: ['solid'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 15
  },
  {
    id: 'clean-architecture',
    label: 'Clean Architecture',
    area: 'architecture',
    level: 'avançado',
    description: 'Separação de preocupações e independência de frameworks.',
    prerequisites: ['design-patterns'],
    resources: { flashcards: true, resumos: true, simulados: false },
    estimatedHours: 12
  },
  {
    id: 'ddd',
    label: 'DDD',
    area: 'architecture',
    level: 'avançado',
    description: 'Domain-Driven Design: Bounded Contexts e Linguagem Ubíqua.',
    prerequisites: ['clean-architecture'],
    resources: { flashcards: true, resumos: true, simulados: false },
    estimatedHours: 15
  },
  {
    id: 'system-design',
    label: 'System Design',
    area: 'architecture',
    level: 'avançado',
    description: 'Escalabilidade, Load Balancing e disponibilidade.',
    prerequisites: ['ddd', 'microservices'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 25
  },

  // DevOps
  {
    id: 'git-basics',
    label: 'Git Básico',
    area: 'devops',
    level: 'iniciante',
    description: 'Clone, commit, push, pull e branches.',
    prerequisites: [],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 5
  },
  {
    id: 'docker',
    label: 'Docker',
    area: 'devops',
    level: 'intermediário',
    description: 'Containers, Imagens, Dockerfile e Compose.',
    prerequisites: ['operating-systems'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 12
  },
  {
    id: 'ci-cd',
    label: 'CI/CD',
    area: 'devops',
    level: 'intermediário',
    description: 'Automação de testes e deploy (GitHub Actions, Jenkins).',
    prerequisites: ['git-basics', 'docker'],
    resources: { flashcards: true, resumos: true, simulados: false },
    estimatedHours: 10
  },
  {
    id: 'cloud-basics',
    label: 'Cloud Básico',
    area: 'devops',
    level: 'intermediário',
    description: 'AWS, Azure, GCP, instâncias EC2 e Buckets.',
    prerequisites: ['networking-basics'],
    resources: { flashcards: true, resumos: true, simulados: true },
    estimatedHours: 15
  },
  {
    id: 'kubernetes',
    label: 'Kubernetes',
    area: 'devops',
    level: 'avançado',
    description: 'Orquestração de containers, Pods, Deployments.',
    prerequisites: ['docker', 'cloud-basics'],
    resources: { flashcards: true, resumos: true, simulados: false },
    estimatedHours: 25
  }
];
