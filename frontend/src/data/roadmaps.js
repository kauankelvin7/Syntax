export const ROADMAPS = [
  {
    id: 'frontend-developer',
    title: 'Frontend Developer',
    description: 'Domine a arte de criar interfaces modernas, performáticas e acessíveis.',
    icon: '🎨',
    color: '#06b6d4',
    estimatedMonths: 6,
    phases: [
      {
        id: 'fe-phase-1',
        title: 'Fundamentos da Web',
        order: 1,
        nodes: [
          {
            id: 'fe-node-1',
            title: 'HTML5 & CSS3',
            description: 'Semântica, Box Model, Flexbox e Grid.',
            type: 'required',
            conceptId: 'html-css',
            resources: ['https://developer.mozilla.org/pt-BR/docs/Learn/HTML', 'https://web.dev/learn/css/'],
            estimatedWeeks: 4,
            children: ['fe-node-2']
          },
          {
            id: 'fe-node-2',
            title: 'JavaScript Básico',
            description: 'Lógica, DOM e manipulação de eventos.',
            type: 'required',
            conceptId: 'javascript-basics',
            resources: ['https://javascript.info/'],
            estimatedWeeks: 4,
            children: ['fe-node-3']
          }
        ]
      },
      {
        id: 'fe-phase-2',
        title: 'Ecossistema Moderno',
        order: 2,
        nodes: [
          {
            id: 'fe-node-3',
            title: 'React.js Essentials',
            description: 'Componentização, Hooks e Ciclo de Vida.',
            type: 'required',
            conceptId: 'react-basics',
            resources: ['https://react.dev/'],
            estimatedWeeks: 6,
            children: ['fe-node-4', 'fe-node-5']
          },
          {
            id: 'fe-node-4',
            title: 'TypeScript',
            description: 'Segurança e tipagem para aplicações JS.',
            type: 'required',
            conceptId: 'typescript',
            resources: ['https://www.typescriptlang.org/docs/'],
            estimatedWeeks: 3,
            children: []
          },
          {
            id: 'fe-node-5',
            title: 'Tailwind CSS',
            description: 'Estilização utilitária e design responsivo.',
            type: 'alternative',
            conceptId: null,
            resources: ['https://tailwindcss.com/docs'],
            estimatedWeeks: 2,
            children: []
          }
        ]
      }
    ]
  },
  {
    id: 'backend-developer',
    title: 'Backend Developer',
    description: 'Construa sistemas escaláveis, APIs robustas e gerencie dados.',
    icon: '⚙️',
    color: '#6366f1',
    estimatedMonths: 8,
    phases: [
      {
        id: 'be-phase-1',
        title: 'Lógica & Servidores',
        order: 1,
        nodes: [
          {
            id: 'be-node-1',
            title: 'Node.js & Express',
            description: 'Criação de servidores e rotas.',
            type: 'required',
            conceptId: 'node-basics',
            resources: ['https://nodejs.org/en/docs/'],
            estimatedWeeks: 5,
            children: ['be-node-2']
          },
          {
            id: 'be-node-2',
            title: 'SQL & Bancos Relacionais',
            description: 'Modelagem de dados e queries.',
            type: 'required',
            conceptId: 'sql-basics',
            resources: ['https://www.postgresql.org/docs/'],
            estimatedWeeks: 4,
            children: ['be-node-3']
          }
        ]
      }
    ]
  },
  {
    id: 'fullstack-developer',
    title: 'Fullstack Developer',
    description: 'O engenheiro completo: do banco de dados à interface do usuário.',
    icon: '🚀',
    color: '#8b5cf6',
    estimatedMonths: 12,
    phases: []
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    description: 'Foco em automação, infraestrutura e confiabilidade de sistemas.',
    icon: '☁️',
    color: '#10b981',
    estimatedMonths: 10,
    phases: []
  },
  {
    id: 'data-engineer',
    title: 'Data Engineer',
    description: 'Arquitetura de dados, pipelines e processamento em larga escala.',
    icon: '📊',
    color: '#f59e0b',
    estimatedMonths: 10,
    phases: []
  },
  {
    id: 'mobile-developer',
    title: 'Mobile Developer',
    description: 'Crie aplicativos nativos e híbridos para iOS e Android.',
    icon: '📱',
    color: '#ec4899',
    estimatedMonths: 8,
    phases: []
  }
];
