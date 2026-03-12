/**
 * 🛰️ SYSTEM ARCHITECT 3D — FULL PREMIUM — Syntax Theme
 * * Topology Dashboard: Inspeção 3D de infraestrutura e microsserviços.
 * - Engine: Three.js + React Three Fiber
 * - Visual: Cyber-Terminal (Glow Neon & Layered Architecture)
 * - Interação: Telemetria em tempo real, Busca Indexada e Mapeamento de Dependências.
 */

import React, {
  useState, useRef, useCallback, useMemo, useEffect, Suspense
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line, Sparkles as DreiSparkles } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import {
  X, RotateCcw, Search, Layers, ChevronRight, ChevronLeft,
  ChevronDown, Filter, Activity, Zap, Database, Server,
  Globe, Shield, Box, GitBranch, Radio, Cpu, HardDrive,
  ArrowUpRight, ArrowDownLeft, AlertTriangle, CheckCircle2,
  TrendingUp, Clock, Hash, Wifi
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   SYNTAX THEME — DESIGN TOKENS
═══════════════════════════════════════════════════════ */

const TOKEN = {
  bg: '#020617', // slate-950
  bgPanel: 'rgba(2, 6, 23, 0.95)',
  bgCard: 'rgba(15, 23, 42, 0.92)',
  border: 'rgba(30, 41, 59, 0.7)',
  borderAccent: 'rgba(99, 102, 241, 0.4)',
  cyan: '#06B6D4',
  cyanDim: '#0891B2',
  indigo: '#6366F1',
  indigoDim: '#4F46E5',
  emerald: '#10B981',
  rose: '#F43F5E',
  amber: '#F59E0B',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  fontMono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  fontSans: "'DM Sans', 'Inter', system-ui, sans-serif",
};

/* ═══════════════════════════════════════════════════════
   CATEGORIAS DE MÓDULOS
═══════════════════════════════════════════════════════ */

const LAYER_CONFIG = {
  'Client Layer':     { color: '#06B6D4', hexColor: 0x06B6D4, icon: Globe,    glyph: '◈' },
  'Edge / CDN':       { color: '#8B5CF6', hexColor: 0x8B5CF6, icon: Radio,    glyph: '⬡' },
  'API Gateway':      { color: '#6366F1', hexColor: 0x6366F1, icon: Shield,   glyph: '◆' },
  'Microservices':    { color: '#10B981', hexColor: 0x10B981, icon: Server,   glyph: '▣' },
  'Message Broker':   { color: '#F59E0B', hexColor: 0xF59E0B, icon: Zap,      glyph: '⬟' },
  'Data Layer':       { color: '#F43F5E', hexColor: 0xF43F5E, icon: Database, glyph: '⬢' },
  'Observability':    { color: '#64748B', hexColor: 0x64748B, icon: Activity, glyph: '◉' },
  'Infrastructure':   { color: '#0EA5E9', hexColor: 0x0EA5E9, icon: HardDrive,glyph: '⬛' },
};

/* ═══════════════════════════════════════════════════════
   DATABASE DE MÓDULOS
═══════════════════════════════════════════════════════ */

const MODULES = [
  /* ── CLIENT LAYER ── */
  {
    id: 'web-app', name: 'Web App (Next.js)', layer: 'Client Layer',
    position: [-3.5, 6.0, 1.5], shape: 'squircle', scale: [1.0, 0.6, 1.0],
    description: 'Frontend SPA/SSR em Next.js 14 com App Router. Renderização híbrida (SSG + ISR). Stale-while-revalidate para dados dinâmicos.',
    metrics: { latency: '38ms', uptime: '99.97%', rps: '4.2k', errors: '0.02%', deployments: '12/day', bundle: '182kb gzip' },
    telemetry: { cpu: 12, mem: 34, traffic: 87 },
    connections: ['cdn-edge', 'api-gateway'],
    tags: ['Next.js 14', 'TypeScript', 'TailwindCSS', 'Turbopack'],
    status: 'healthy',
    details: {
      'Stack': 'Next.js 14, React 18, TypeScript 5.3, Tailwind 3.4',
      'Renderização': 'App Router + Server Components + ISR (revalidate: 60s)',
      'Auth': 'NextAuth.js v5 → JWT RS256 + Refresh Token Rotation',
      'Build': 'Turbopack dev / SWC prod — bundle: 182kb gzip',
      'Testes': 'Vitest + Testing Library + Playwright E2E',
      'Deploy': 'Vercel Edge Network — 12 deploys/dia via GitHub Actions',
    }
  },
  {
    id: 'mobile-app', name: 'Mobile App (RN)', layer: 'Client Layer',
    position: [3.5, 6.0, 1.5], shape: 'squircle', scale: [0.9, 0.55, 0.9],
    description: 'React Native + Expo SDK 51. Suporte iOS/Android. OTA updates via EAS Update.',
    metrics: { latency: '52ms', uptime: '99.92%', rps: '1.8k', errors: '0.08%', version: '4.2.1', dau: '120k' },
    telemetry: { cpu: 8, mem: 28, traffic: 62 },
    connections: ['cdn-edge', 'api-gateway'],
    tags: ['React Native', 'Expo', 'TypeScript', 'EAS'],
    status: 'healthy',
    details: {
      'Stack': 'React Native 0.74, Expo SDK 51, TypeScript',
      'Navegação': 'React Navigation 6 (Stack + Bottom Tabs)',
      'Estado': 'Zustand + React Query v5 (offline-first)',
      'OTA Updates': 'EAS Update — hot patching em produção',
      'Push': 'Expo Notifications → APNS + FCM',
      'Analytics': 'Amplitude + Sentry (crash rate: 0.01%)',
    }
  },

  /* ── EDGE / CDN ── */
  {
    id: 'cdn-edge', name: 'CDN / Edge Network', layer: 'Edge / CDN',
    position: [0, 4.5, 2.0], shape: 'ring', scale: [1.4, 0.3, 1.4],
    description: 'Cloudflare Workers + KV + R2. Edge runtime para geo-routing, WAF e cache de assets estáticos. 300+ PoPs globais.',
    metrics: { cacheHit: '94.7%', bandwidth: '2.4TB/day', nodes: '310', p99: '12ms', threats: '1.2k/h blocked', ddos: 'mitigated' },
    telemetry: { cpu: 5, mem: 18, traffic: 95 },
    connections: ['api-gateway'],
    tags: ['Cloudflare', 'Workers', 'KV', 'WAF', 'R2'],
    status: 'healthy',
    details: {
      'Runtime': 'Cloudflare Workers (V8 Isolates) — cold start < 0ms',
      'Cache': 'KV Store + Browser cache + Cache-Control headers',
      'WAF': 'OWASP Top 10 + Custom rules (1.2k threats/h bloqueadas)',
      'Geo-routing':'Latency-based routing → 310 PoPs',
      'Storage': 'R2 (S3-compatible) — sem egress fees',
      'DDoS': 'Cloudflare Magic Transit — L3/L4 mitigation automático',
    }
  },

  /* ── API GATEWAY ── */
  {
    id: 'api-gateway', name: 'API Gateway', layer: 'API Gateway',
    position: [0, 3.0, 0.5], shape: 'squircle', scale: [1.2, 0.7, 1.2],
    description: 'Kong Gateway OSS. Roteamento, autenticação JWT, rate limiting, circuit breaker e observabilidade centralizada.',
    metrics: { latency: '4ms overhead', rps: '28k', rateLimited: '0.3%', uptime: '99.999%', plugins: '18 active', routes: '247' },
    telemetry: { cpu: 45, mem: 62, traffic: 92 },
    connections: ['auth-service', 'user-service', 'order-service', 'payment-service', 'notification-svc', 'search-service'],
    tags: ['Kong', 'JWT', 'Rate Limit', 'Circuit Breaker', 'OpenAPI'],
    status: 'healthy',
    details: {
      'Engine': 'Kong Gateway 3.6 (NGINX + Lua) — 247 rotas ativas',
      'Auth': 'JWT RS256 + OIDC (Keycloak) + mTLS entre serviços',
      'Rate Limit': 'Sliding window: 1000 req/min por user, 10k por IP',
      'Circuit Breaker': 'Kong Circuit Breaker — threshold: 50% errors em 10s',
      'Observability':'Plugin Datadog + Prometheus /metrics endpoint',
      'Load Balance': 'Round-robin + health checks a cada 5s',
    }
  },

  /* ── MICROSERVICES ── */
  {
    id: 'auth-service', name: 'Auth Service', layer: 'Microservices',
    position: [-4.5, 1.2, 0.8], shape: 'squircle', scale: [0.8, 0.8, 0.8],
    description: 'Keycloak + Spring Security. OpenID Connect, SSO, MFA TOTP e gestão de sessões distribuídas.',
    metrics: { latency: '22ms p95', rps: '3.5k', tokens: '890k active', mfa: '67%', loginRate: '98.9% success', sessions: '45k' },
    telemetry: { cpu: 38, mem: 55, traffic: 78 },
    connections: ['redis-cluster', 'user-postgres'],
    tags: ['Keycloak', 'OIDC', 'JWT', 'MFA', 'RBAC'],
    status: 'healthy',
    details: {
      'Runtime': 'Spring Boot 3.2 + Spring Security 6 — JVM GraalVM',
      'IdP': 'Keycloak 23 (HA cluster, 3 nodes)',
      'Tokens': 'Access: 15min / Refresh: 7d / Rotation automático',
      'MFA': 'TOTP (Google Auth) + WebAuthn (passkeys) — 67% habilitado',
      'Sessions': 'Sessões no Redis Cluster com TTL adaptativo',
      'Auditoria': 'Keycloak Events → Kafka → Elasticsearch (90d retention)',
    }
  },
  {
    id: 'user-service', name: 'User Service', layer: 'Microservices',
    position: [-2.2, 1.2, -0.8], shape: 'squircle', scale: [0.75, 0.75, 0.75],
    description: 'CRUD de usuários, perfis e preferências. Domain-driven design com eventos de domínio via Kafka.',
    metrics: { latency: '18ms p95', rps: '6.1k', users: '2.4M', growth: '+4.2%/mo', cacheHit: '88%', writes: '120/s' },
    telemetry: { cpu: 28, mem: 42, traffic: 65 },
    connections: ['user-postgres', 'redis-cluster', 'kafka-broker'],
    tags: ['NestJS', 'TypeORM', 'DDD', 'CQRS'],
    status: 'healthy',
    details: {
      'Runtime': 'NestJS 10 + TypeScript — Docker (512MB RAM limit)',
      'Arquitetura':'DDD + CQRS + Event Sourcing (domínio de usuários)',
      'Cache': 'Redis Write-through — cache hit: 88% (TTL: 5min)',
      'DB': 'PostgreSQL 16 — read replicas, connection pool: 20',
      'Eventos': 'UserCreated, UserUpdated, UserDeleted → Kafka',
      'Search': 'ElasticSearch sync via Kafka consumer (near real-time)',
    }
  },
  {
    id: 'order-service', name: 'Order Service', layer: 'Microservices',
    position: [0.5, 1.2, -1.5], shape: 'squircle', scale: [0.85, 0.85, 0.85],
    description: 'Gestão de pedidos com Saga pattern para transações distribuídas. Idempotência garantida via chave de idempotência.',
    metrics: { latency: '45ms p95', rps: '2.8k', ordersDay: '48k', successRate: '99.7%', sagaSuccess: '99.94%', pending: '127' },
    telemetry: { cpu: 52, mem: 68, traffic: 71 },
    connections: ['order-postgres', 'kafka-broker', 'payment-service'],
    tags: ['Go', 'Saga Pattern', 'Idempotency', 'gRPC'],
    status: 'warning',
    details: {
      'Runtime': 'Go 1.22 — goroutines, compilado nativamente',
      'Saga': 'Choreography-based Saga via Kafka (compensações automáticas)',
      'Idempotência':'Idempotency key no Redis (TTL: 24h) — duplicate prevention',
      'gRPC': 'Proto3 — comunicação interna com Payment e Inventory',
      'DB': 'PostgreSQL + particionamento por created_at (mensal)',
      'Alerta': '⚠ Latência p99 elevada (220ms) — investigando query N+1',
    }
  },
  {
    id: 'payment-service', name: 'Payment Service', layer: 'Microservices',
    position: [2.8, 1.2, 0.2], shape: 'squircle', scale: [0.85, 0.85, 0.85],
    description: 'Processamento de pagamentos PCI-DSS Level 1. Integração Stripe + PIX + Boleto. Tokenização de cartões.',
    metrics: { latency: '380ms p95', rps: '450', txDay: '22k', chargeback: '0.08%', pciLevel: '1', uptime: '99.999%' },
    telemetry: { cpu: 22, mem: 38, traffic: 44 },
    connections: ['payment-postgres', 'kafka-broker', 'redis-cluster'],
    tags: ['PCI-DSS', 'Stripe', 'PIX', 'Tokenization'],
    status: 'healthy',
    details: {
      'Runtime': 'Python 3.12 + FastAPI — async everywhere',
      'PCI-DSS': 'Level 1 — auditoria anual, tokenização via Stripe Vault',
      'Gateways': 'Stripe (cartão) + Pagar.me (PIX/Boleto) + Fallback automático',
      'Idempotência':'Chave de idempotência Stripe (retry-safe)',
      'Criptografia':'AES-256-GCM para dados em repouso, TLS 1.3 em trânsito',
      'Alertas': 'Webhook Stripe → SQS → Lambda (processamento assíncrono)',
    }
  },
  {
    id: 'notification-svc', name: 'Notification Service', layer: 'Microservices',
    position: [4.5, 1.2, -0.5], shape: 'squircle', scale: [0.7, 0.7, 0.7],
    description: 'Roteador multi-canal: Email (SES), Push (FCM/APNS), SMS (Twilio), In-App (WebSocket). Preferências por usuário.',
    metrics: { latency: '< 500ms', sent: '850k/day', deliveryRate: '98.3%', channels: '4', templates: '47', optOut: '2.1%' },
    telemetry: { cpu: 18, mem: 32, traffic: 55 },
    connections: ['kafka-broker', 'redis-cluster'],
    tags: ['SES', 'FCM', 'Twilio', 'WebSocket', 'Templates'],
    status: 'healthy',
    details: {
      'Runtime': 'Node.js 20 LTS + BullMQ (filas de jobs)',
      'Email': 'AWS SES — DKIM + SPF + DMARC, 98.3% deliverability',
      'Push': 'FCM (Android) + APNS (iOS) via Firebase Admin SDK',
      'SMS': 'Twilio — fallback Zenvia (custo BR)',
      'Templates': '47 templates Handlebars + A/B testing',
      'Preferências':'User preference store no Redis — opt-out granular',
    }
  },
  {
    id: 'search-service', name: 'Search Service', layer: 'Microservices',
    position: [-1.0, 1.2, 1.8], shape: 'squircle', scale: [0.7, 0.7, 0.7],
    description: 'ElasticSearch 8 com full-text search, faceted filters e relevância por ML (Learning to Rank).',
    metrics: { latency: '28ms p95', rps: '5.2k', indexed: '18M docs', queries: '420k/day', cacheHit: '71%', ltrModel: 'v3' },
    telemetry: { cpu: 65, mem: 78, traffic: 80 },
    connections: ['elastic-cluster', 'kafka-broker'],
    tags: ['Elasticsearch', 'LTR', 'Full-text', 'Faceted'],
    status: 'healthy',
    details: {
      'Engine': 'Elasticsearch 8.13 — 3 nodes, 1 replica shard',
      'Índices': '6 índices de produto + 4 de log + 2 de analytics',
      'LTR': 'Learning to Rank (XGBoost) — CTR melhorou 23%',
      'Ingestão': 'Kafka consumer → Logstash → ES (near real-time)',
      'Cache': 'Redis (query cache) — hit rate 71%, TTL adaptativo',
      'Alertas': 'JVM heap > 80% → alerta PagerDuty',
    }
  },

  /* ── MESSAGE BROKER ── */
  {
    id: 'kafka-broker', name: 'Apache Kafka', layer: 'Message Broker',
    position: [0, -0.5, 0], shape: 'cylinder', scale: [1.5, 0.5, 1.5],
    description: 'Apache Kafka 3.6 com 6 brokers em HA. Centro nervoso do event-driven architecture. 40+ topics.',
    metrics: { throughput: '280k msg/s', topics: '43', partitions: '360', lag: '< 500ms', retention: '7 days', brokers: '6' },
    telemetry: { cpu: 58, mem: 72, traffic: 98 },
    connections: ['user-postgres', 'order-postgres', 'elastic-cluster', 'mongo-db', 'clickhouse'],
    tags: ['Kafka', 'Event Streaming', 'Avro', 'Schema Registry', 'KSQL'],
    status: 'healthy',
    details: {
      'Cluster': '6 brokers KRaft mode (sem ZooKeeper) — replication factor: 3',
      'Throughput': '280k mensagens/s — peak 450k (Black Friday)',
      'Schema': 'Confluent Schema Registry — Avro / Protobuf / JSON Schema',
      'Topics': '43 topics | 360 partições | retenção 7 dias',
      'Consumers': 'Consumer groups por serviço — offset commit automático',
      'Observabilidade': 'Kafka UI + Prometheus JMX exporter + Grafana dashboards',
    }
  },

  /* ── DATA LAYER ── */
  {
    id: 'user-postgres', name: 'PostgreSQL (Users)', layer: 'Data Layer',
    position: [-4.0, -2.2, -1.0], shape: 'database', scale: [0.8, 0.9, 0.8],
    description: 'PostgreSQL 16 — banco primário de usuários e autenticação. Primary + 2 read replicas com streaming replication.',
    metrics: { size: '84 GB', qps: '12k', p99: '8ms', replication: '0ms lag', connections: '45/100', uptime: '99.998%' },
    telemetry: { cpu: 42, mem: 65, traffic: 60 },
    connections: [],
    tags: ['PostgreSQL', 'Read Replicas', 'pgBouncer', 'TimescaleDB'],
    status: 'healthy',
    details: {
      'Versão': 'PostgreSQL 16 — Primary + 2 Read Replicas (streaming)',
      'Connection Pool':'pgBouncer (transaction mode) — max 100 conexões',
      'Backup': 'pg_basebackup diário + WAL archiving (S3) — PITR 30d',
      'Extensions': 'pgvector (embeddings), pg_stat_statements, uuid-ossp',
      'Vacuum': 'autovacuum tuned — bloat < 5% em todas as tabelas',
      'Tamanho': '84 GB | maior tabela: sessions (28 GB, particionada)',
    }
  },
  {
    id: 'order-postgres', name: 'PostgreSQL (Orders)', layer: 'Data Layer',
    position: [0, -2.2, -2.0], shape: 'database', scale: [0.85, 0.9, 0.85],
    description: 'PostgreSQL particionado por data para alta ingestão de pedidos. Tabelas particionadas por mês (range partitioning).',
    metrics: { size: '312 GB', qps: '8.5k', p99: '12ms', partitions: '36 active', rows: '480M', archivePolicy: '2yr' },
    telemetry: { cpu: 55, mem: 70, traffic: 68 },
    connections: [],
    tags: ['PostgreSQL', 'Partitioning', 'Hot/Cold', 'Archive'],
    status: 'healthy',
    details: {
      'Particionamento': 'RANGE por created_at — 36 partições ativas (mensal)',
      'Hot/Cold': 'Dados > 90d → tablespace em storage frio (S3)',
      'Índices': 'B-tree em (user_id, status, created_at) — partial indexes',
      'Replicação': 'Logical replication → ClickHouse (analytics)',
      'Tamanho': '312 GB | 480M linhas | crescimento: +12M/mês',
      'Backup': 'Barman + WAL-G (S3) — recovery time: < 4h',
    }
  },
  {
    id: 'payment-postgres', name: 'PostgreSQL (Payments)', layer: 'Data Layer',
    position: [3.5, -2.2, -0.5], shape: 'database', scale: [0.75, 0.85, 0.75],
    description: 'PostgreSQL em ambiente PCI-DSS isolado. Criptografia TDE + auditoria de acesso completa.',
    metrics: { size: '56 GB', qps: '1.2k', p99: '5ms', encryption: 'AES-256', auditLog: 'enabled', compliance: 'PCI-L1' },
    telemetry: { cpu: 22, mem: 40, traffic: 35 },
    connections: [],
    tags: ['PostgreSQL', 'PCI-DSS', 'TDE', 'Audit', 'Isolated VPC'],
    status: 'healthy',
    details: {
      'Segurança': 'VPC isolado — acesso exclusivo via Payment Service',
      'Criptografia': 'TDE (Transparent Data Encryption) — AES-256',
      'Auditoria': 'pgAudit — todos os SELECTs/DMLs logados (90d)',
      'Acesso': 'IAM roles — sem acesso humano direto em prod',
      'Tokens': 'PAN armazenados como tokens Stripe Vault (não raw)',
      'Compliance': 'PCI-DSS Level 1 — SAQ D, auditoria Verizon anual',
    }
  },
  {
    id: 'redis-cluster', name: 'Redis Cluster', layer: 'Data Layer',
    position: [-1.5, -2.2, 1.5], shape: 'sphere', scale: [0.8, 0.8, 0.8],
    description: 'Redis 7.2 Cluster — 6 shards (3 masters + 3 replicas). Cache distribuído, filas BullMQ e sessões.',
    metrics: { size: '42 GB RAM', ops: '380k/s', hitRate: '91%', evictions: '0', latency: '0.3ms', keys: '28M' },
    telemetry: { cpu: 35, mem: 85, traffic: 90 },
    connections: [],
    tags: ['Redis', 'Cluster', 'BullMQ', 'Sessions', 'Cache'],
    status: 'healthy',
    details: {
      'Cluster': 'Redis 7.2 — 6 shards (3 masters + 3 replicas)',
      'Persistência': 'AOF + RDB snapshot (1h) — durabilidade garantida',
      'Eviction': 'allkeys-lru — 0 evictions (capacidade adequada)',
      'BullMQ': 'Filas de jobs — Notification, Export, Sync (total: 12 filas)',
      'Sessões': 'Express-session + Redis — TTL: 7d (sliding window)',
      'Monitoramento':'RedisInsight + Prometheus redis-exporter',
    }
  },
  {
    id: 'elastic-cluster', name: 'Elasticsearch', layer: 'Data Layer',
    position: [2.0, -2.2, 1.8], shape: 'sphere', scale: [0.78, 0.78, 0.78],
    description: 'Elasticsearch 8.13 para busca full-text, logs de aplicação e analytics de comportamento.',
    metrics: { size: '1.2 TB', docs: '18M', searchPs: '5.2k', indexRate: '12k/s', jvmHeap: '68%', shards: '84' },
    telemetry: { cpu: 65, mem: 78, traffic: 80 },
    connections: [],
    tags: ['Elasticsearch', 'Kibana', 'Logstash', 'APM'],
    status: 'healthy',
    details: {
      'Cluster': '3 nós data + 1 master-eligible + 1 coordinating',
      'Indices': '6 índices de produto + 4 de log + 2 de analytics',
      'ILM': 'Index Lifecycle Management — hot (7d) → warm → delete',
      'APM': 'Elastic APM integrado — distributed tracing',
      'KNN': 'k-NN (pgvector sync) — busca semântica em beta',
      'Monitoramento':'Stack Monitoring + alertas JVM heap > 80%',
    }
  },
  {
    id: 'mongo-db', name: 'MongoDB (Events)', layer: 'Data Layer',
    position: [-3.0, -2.2, 0.2], shape: 'database', scale: [0.72, 0.82, 0.72],
    description: 'MongoDB 7 para event store e dados de analytics comportamental. Schema flexível para eventos heterogêneos.',
    metrics: { size: '680 GB', docs: '2.1B', ops: '45k/s', replicas: '3 node RS', sharding: 'enabled', retention: '90d' },
    telemetry: { cpu: 48, mem: 60, traffic: 58 },
    connections: [],
    tags: ['MongoDB', 'Event Store', 'Change Streams', 'Sharding'],
    status: 'healthy',
    details: {
      'Versão': 'MongoDB 7.0 — Replica Set (1P + 2S) + Sharding',
      'Event Store': 'Append-only collections — event sourcing do Order Service',
      'Change Streams':'Change streams → Kafka (sincronização em tempo real)',
      'TTL Index': 'Eventos de comportamento — TTL 90 dias (auto-expire)',
      'Compressão': 'Snappy (dados) + zstd (backup) — 68% compressão',
      'Backup': 'Ops Manager — Point-in-Time Recovery (PITR)',
    }
  },
  {
    id: 'clickhouse', name: 'ClickHouse (Analytics)', layer: 'Data Layer',
    position: [1.0, -2.2, -0.8], shape: 'database', scale: [0.78, 0.82, 0.78],
    description: 'ClickHouse para analytics OLAP em tempo real. Ingestão via Kafka. Sub-segundo em queries de bilhões de linhas.',
    metrics: { size: '4.8 TB', rows: '12B', queryTime: '180ms avg', ingest: '800k rows/s', compression: '12:1', dashboards: '34' },
    telemetry: { cpu: 45, mem: 55, traffic: 70 },
    connections: [],
    tags: ['ClickHouse', 'OLAP', 'Real-time Analytics', 'Kafka Ingest'],
    status: 'healthy',
    details: {
      'Versão': 'ClickHouse 24.3 LTS — cluster de 4 shards, 2 réplicas',
      'Ingestão': 'Kafka Engine tables — 800k rows/s pico',
      'Compressão': 'LZ4 + ZSTD — ratio 12:1 (4.8 TB físico ≈ 57 TB raw)',
      'Queries': 'ReplicatedMergeTree + MaterializedViews pré-agregadas',
      'Dashboards': '34 dashboards Grafana — Business + Technical KPIs',
      'Retenção': 'Particionamento por mês — cold storage após 1 ano',
    }
  },

  /* ── OBSERVABILITY ── */
  {
    id: 'observability', name: 'Observability Stack', layer: 'Observability',
    position: [0, -4.0, 0], shape: 'ring', scale: [2.0, 0.2, 2.0],
    description: 'OpenTelemetry + Prometheus + Grafana + Loki + Jaeger. Pillar: Metrics, Logs, Traces.',
    metrics: { dashboards: '68', alerts: '142 active', slos: '28 defined', mttr: '12min', tracesDay: '18M', logRate: '4GB/h' },
    telemetry: { cpu: 30, mem: 50, traffic: 45 },
    connections: [],
    tags: ['OpenTelemetry', 'Prometheus', 'Grafana', 'Jaeger', 'Loki'],
    status: 'healthy',
    details: {
      'Traces': 'Jaeger (Distributed Tracing) — 18M traces/day, 7d retention',
      'Metrics': 'Prometheus + Thanos (long-term) — 90d retention',
      'Logs': 'Loki + Promtail — structured logging (JSON), 4GB/h',
      'Dashboards': '68 dashboards Grafana (técnico + business)',
      'Alertas': '142 alertas → PagerDuty (P1-P4 SLAs definidos)',
      'SLOs': '28 SLOs defined — Error Budget tracking por serviço',
    }
  },

  /* ── INFRASTRUCTURE ── */
  {
    id: 'k8s-infra', name: 'Kubernetes (EKS)', layer: 'Infrastructure',
    position: [0, -5.5, 0], shape: 'grid', scale: [2.5, 0.15, 2.5],
    description: 'Amazon EKS 1.29. Cluster de 24 nós (spot + on-demand mix). Karpenter para autoscaling inteligente.',
    metrics: { nodes: '24', pods: '284', cpuUtil: '62%', memUtil: '71%', cost: '$8.4k/mo', uptime: '99.99%' },
    telemetry: { cpu: 62, mem: 71, traffic: 75 },
    connections: [],
    tags: ['Kubernetes', 'EKS', 'Karpenter', 'Helm', 'ArgoCD'],
    status: 'healthy',
    details: {
      'Versão': 'Amazon EKS 1.29 — upgrade automático com PodDisruptionBudgets',
      'Nós': '24 nós: 16 Spot (t3.xlarge) + 8 On-demand (c6i.2xlarge)',
      'Autoscaling': 'Karpenter — provisionamento em < 60s baseado em workload',
      'GitOps': 'ArgoCD — deploy declarativo, sync automático do GitHub',
      'Networking': 'Cilium CNI + eBPF — NetworkPolicies por namespace',
      'Cost': '$8.4k/mês — 43% economia vs on-demand puro (Spot mix)',
    }
  },
];

const LAYERS = [...new Set(MODULES.map(m => m.layer))];

/* ═══════════════════════════════════════════════════════
   STATUS COLORS
═══════════════════════════════════════════════════════ */

const STATUS_COLOR = {
  healthy: '#10B981',
  warning: '#F59E0B',
  error:   '#F43F5E',
  unknown: '#64748B',
};

/* ═══════════════════════════════════════════════════════
   GEOMETRIAS DOS MÓDULOS 3D
═══════════════════════════════════════════════════════ */

function buildModuleGeo(shape, scale) {
  const [sx, sy, sz] = scale;
  switch (shape) {
    case 'squircle': {
      const g = new THREE.BoxGeometry(sx, sy, sz, 2, 2, 2);
      return g;
    }
    case 'sphere': {
      return new THREE.SphereGeometry(sx * 0.6, 32, 24);
    }
    case 'cylinder': {
      return new THREE.CylinderGeometry(sx * 0.55, sx * 0.55, sy * 1.8, 32);
    }
    case 'ring': {
      const outer = sx * 0.65;
      const inner = outer * 0.72;
      return new THREE.TorusGeometry(outer, (outer - inner) * 0.35, 8, 48);
    }
    case 'database': {
      return new THREE.CylinderGeometry(sx * 0.52, sx * 0.52, sy * 0.9, 20);
    }
    case 'grid': {
      return new THREE.BoxGeometry(sx, sy * 0.3, sz);
    }
    default:
      return new THREE.BoxGeometry(sx, sy, sz);
  }
}

/* ═══════════════════════════════════════════════════════
   MATERIAL COM GLOW (Emissivo)
═══════════════════════════════════════════════════════ */

function getModuleMaterial(layer, isSelected, isHovered, status) {
  const cfg = LAYER_CONFIG[layer];
  const hexColor = cfg?.hexColor ?? 0x6366F1;
  const statusCol = STATUS_COLOR[status] ?? STATUS_COLOR.unknown;

  let emissiveColor = hexColor;
  let emissiveIntensity = isSelected ? 0.8 : isHovered ? 0.4 : 0.15;
  let opacity = isSelected ? 0.95 : isHovered ? 0.88 : 0.75;

  if (status === 'warning') emissiveColor = 0xF59E0B;
  if (status === 'error')   emissiveColor = 0xF43F5E;

  return {
    color: hexColor,
    emissive: emissiveColor,
    emissiveIntensity,
    transparent: true,
    opacity,
    roughness: 0.15,
    metalness: 0.75,
    side: THREE.DoubleSide,
  };
}

/* ═══════════════════════════════════════════════════════
   CONEXÕES (Data Flow Lines)
═══════════════════════════════════════════════════════ */

function DataFlowLine({ from, to, color, animated = true }) {
  const ref = useRef();
  const [progress, setProgress] = useState(0);

  const points = useMemo(() => {
    const mid = new THREE.Vector3(
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 0.5,
      (from[2] + to[2]) / 2
    );
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      mid,
      new THREE.Vector3(...to)
    );
    return curve.getPoints(40);
  }, [from, to]);

  useFrame(({ clock }) => {
    if (!animated || !ref.current) return;
    const t = (clock.elapsedTime * 0.4) % 1;
    setProgress(t);
  });

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={0.8}
        transparent
        opacity={0.25}
      />
      <mesh position={points[Math.floor(progress * (points.length - 1))]} ref={ref}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   PARTÍCULAS DE DADOS FLUTUANTES
═══════════════════════════════════════════════════════ */

function DataParticles({ position, color, count = 8 }) {
  const ref = useRef();
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      offset: Math.random() * Math.PI * 2,
      radius: 0.4 + Math.random() * 0.5,
      speed: 0.3 + Math.random() * 0.4,
      y: (Math.random() - 0.5) * 0.8,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      if (!particles[i]) return;
      const p = particles[i];
      const t = clock.elapsedTime * p.speed + p.offset;
      child.position.x = Math.cos(t) * p.radius;
      child.position.y = p.y + Math.sin(t * 0.5) * 0.1;
      child.position.z = Math.sin(t) * p.radius;
      child.material.opacity = 0.3 + Math.abs(Math.sin(t)) * 0.5;
    });
  });

  return (
    <group ref={ref} position={position}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   GRADE DO GRID (Piso estético)
═══════════════════════════════════════════════════════ */

function TechGrid() {
  const lines = useMemo(() => {
    const pts = [];
    const size = 12;
    const step = 1.5;
    for (let i = -size; i <= size; i += step) {
      pts.push([[-size, -7.0, i], [size, -7.0, i]]);
      pts.push([[i, -7.0, -size], [i, -7.0, size]]);
    }
    return pts;
  }, []);

  return (
    <group>
      {lines.map((pts, i) => (
        <Line
          key={i}
          points={pts.map(p => new THREE.Vector3(...p))}
          color="#1E293B"
          lineWidth={0.5}
          transparent
          opacity={0.6}
        />
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   MÓDULO 3D PRINCIPAL
═══════════════════════════════════════════════════════ */

const geoCache = new Map();

function ModuleMesh({ mod, isSelected, isHovered, onSelect, onHover }) {
  const meshRef = useRef();
  const cfg = LAYER_CONFIG[mod.layer];
  const hexColor = cfg?.hexColor ?? 0x6366F1;

  const geo = useMemo(() => {
    const key = `${mod.shape}_${mod.scale.join('_')}`;
    if (geoCache.has(key)) return geoCache.get(key);
    const g = buildModuleGeo(mod.shape, mod.scale);
    geoCache.set(key, g);
    return g;
  }, [mod.shape, mod.scale]);

  const matProps = useMemo(
    () => getModuleMaterial(mod.layer, isSelected, isHovered, mod.status),
    [mod.layer, isSelected, isHovered, mod.status]
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const pulse = Math.sin(clock.elapsedTime * 2 + mod.position[0]) * 0.08;

    if (isSelected) {
      meshRef.current.material.emissiveIntensity = 0.6 + Math.sin(clock.elapsedTime * 4) * 0.25;
      meshRef.current.rotation.y = clock.elapsedTime * 0.4;
    } else {
      meshRef.current.material.emissiveIntensity = isHovered ? 0.4 : 0.12 + pulse * 0.05;
      if (mod.shape === 'ring') {
        meshRef.current.rotation.y = clock.elapsedTime * 0.2;
      }
    }
  });

  return (
    <group position={mod.position}>
      <mesh scale={[1.18, 1.18, 1.18]}>
        <primitive object={geo} />
        <meshBasicMaterial
          color={hexColor}
          transparent
          opacity={isSelected ? 0.12 : isHovered ? 0.08 : 0.04}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh
        ref={meshRef}
        geometry={geo}
        onClick={e => { e.stopPropagation(); onSelect(mod.id); }}
        onPointerOver={e => { e.stopPropagation(); onHover(mod.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial {...matProps} />
      </mesh>

      <mesh position={[0, (mod.scale[1] ?? 1) * 0.6 + 0.15, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color={STATUS_COLOR[mod.status]} />
      </mesh>

      {(isSelected || isHovered) && (
        <DataParticles position={[0, 0, 0]} color={`#${hexColor.toString(16).padStart(6,'0')}`} count={6} />
      )}

      {(isSelected || isHovered) && (
        <Html
          position={[0, (mod.scale[1] ?? 1) * 0.8 + 0.4, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(2,6,23,0.92)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${cfg?.color ?? '#6366F1'}50`,
            borderRadius: 10,
            padding: '5px 12px',
            color: '#F1F5F9',
            fontSize: 12,
            fontFamily: TOKEN.fontMono,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            boxShadow: `0 0 20px ${cfg?.color ?? '#6366F1'}30`,
            letterSpacing: '0.02em',
          }}>
            {cfg?.glyph} {mod.name}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   CENA 3D COMPLETA
═══════════════════════════════════════════════════════ */

function Scene({ selectedId, hoveredId, onSelect, onHover, visLayers }) {
  const visibleModules = useMemo(
    () => MODULES.filter(m => visLayers.includes(m.layer)),
    [visLayers]
  );

  const connections = useMemo(() => {
    const pairs = [];
    visibleModules.forEach(mod => {
      mod.connections.forEach(targetId => {
        const target = visibleModules.find(m => m.id === targetId);
        if (!target) return;
        const alreadyAdded = pairs.some(
          p => (p.from === mod.id && p.to === targetId) ||
               (p.from === targetId && p.to === mod.id)
        );
        if (!alreadyAdded) {
          pairs.push({ from: mod, to: target });
        }
      });
    });
    return pairs;
  }, [visibleModules]);

  return (
    <>
      <color attach="background" args={['#020617']} />
      <fog attach="fog" args={['#020617', 20, 55]} />

      <ambientLight intensity={0.2} color="#0F172A" />
      <directionalLight position={[10, 15, 8]} intensity={0.8} color="#E0E7FF" />
      <pointLight position={[-5, 8, 5]} intensity={1.2} color="#06B6D4" distance={30} decay={2} />
      <pointLight position={[5, 4, -5]} intensity={0.8} color="#6366F1" distance={25} decay={2} />
      <pointLight position={[0, -3, 0]} intensity={0.5} color="#10B981" distance={20} decay={2} />

      <TechGrid />
      <DreiSparkles count={60} scale={20} size={0.4} speed={0.2} color="#06B6D4" opacity={0.4} />

      {visibleModules.map(mod => (
        <ModuleMesh
          key={mod.id}
          mod={mod}
          isSelected={selectedId === mod.id}
          isHovered={hoveredId === mod.id}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}

      {connections.map(({ from, to }) => {
        const cfg = LAYER_CONFIG[from.layer];
        return (
          <DataFlowLine
            key={`${from.id}-${to.id}`}
            from={from.position}
            to={to.position}
            color={cfg?.color ?? '#6366F1'}
          />
        );
      })}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={35}
        target={[0, 0, 0]}
        makeDefault
        enableDamping
        dampingFactor={0.06}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   TELEMETRY SPARKLINE
═══════════════════════════════════════════════════════ */

function TelemetryBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontFamily: TOKEN.fontMono, color: TOKEN.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        <span style={{ fontSize: 11, fontFamily: TOKEN.fontMono, color, fontWeight: 700 }}>
          {value}%
        </span>
      </div>
      <div style={{ height: 4, background: 'rgba(51,65,85,0.5)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 4, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DETAIL PANEL
═══════════════════════════════════════════════════════ */

function DetailPanel({ selected, onClose }) {
  if (!selected) return null;
  const cfg = LAYER_CONFIG[selected.layer];
  const LayerIcon = cfg?.icon ?? Box;
  const statusCol = STATUS_COLOR[selected.status];

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 420,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        background: TOKEN.bgCard,
        backdropFilter: 'blur(24px)',
        border: `2px solid ${cfg?.color ?? TOKEN.indigo}30`,
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: `0 0 40px ${cfg?.color ?? TOKEN.indigo}15, 0 20px 40px rgba(0,0,0,0.4)`,
        fontFamily: TOKEN.fontSans,
        zIndex: 30,
      }}
    >
      <div style={{ height: 4, background: `linear-gradient(90deg, ${cfg?.color}, transparent)` }} />

      <div style={{
        padding: '24px 24px 20px',
        borderBottom: `1px solid ${TOKEN.border}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
      }}>
        <div style={{
          width: 50,
          height: 50,
          borderRadius: 14,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${cfg?.color}20`,
          border: `1px solid ${cfg?.color}40`,
          boxShadow: `0 0 16px ${cfg?.color}20`,
        }}>
          <LayerIcon size={24} color={cfg?.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: TOKEN.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
              {selected.name}
            </h3>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
              background: `${statusCol}20`, color: statusCol,
              fontFamily: TOKEN.fontMono, textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {selected.status}
            </span>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600, color: cfg?.color,
            fontFamily: TOKEN.fontMono, letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {cfg?.glyph} {selected.layer}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'rgba(51,65,85,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: TOKEN.textSecondary, flexShrink: 0,
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="custom-scrollbar">
        <p style={{ fontSize: 14, lineHeight: 1.7, color: TOKEN.textSecondary, marginBottom: 20 }}>
          {selected.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {selected.tags.map(tag => (
            <span key={tag} style={{
              fontSize: 10, fontFamily: TOKEN.fontMono, fontWeight: 700,
              padding: '4px 10px', borderRadius: 8,
              background: `${cfg?.color}12`, color: cfg?.color,
              border: `1px solid ${cfg?.color}25`, letterSpacing: '0.02em',
            }}>
              {tag}
            </span>
          ))}
        </div>

        <div style={{
          background: 'rgba(15,23,42,0.6)', borderRadius: 20, padding: 20,
          marginBottom: 20, border: `1px solid ${TOKEN.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Activity size={14} color={TOKEN.cyan} />
            <span style={{ fontSize: 10, fontWeight: 900, color: TOKEN.cyan, fontFamily: TOKEN.fontMono, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Live Telemetry
            </span>
          </div>
          <TelemetryBar label="Core_Load" value={selected.telemetry.cpu} color={selected.telemetry.cpu > 80 ? TOKEN.rose : selected.telemetry.cpu > 60 ? TOKEN.amber : TOKEN.emerald} />
          <TelemetryBar label="Memory_Stack" value={selected.telemetry.mem} color={selected.telemetry.mem > 85 ? TOKEN.rose : selected.telemetry.mem > 70 ? TOKEN.amber : TOKEN.cyan} />
          <TelemetryBar label="Traffic_Flow" value={selected.telemetry.traffic} color={TOKEN.indigo} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TrendingUp size={14} color={TOKEN.textMuted} />
            <span style={{ fontSize: 10, fontWeight: 900, color: TOKEN.textMuted, fontFamily: TOKEN.fontMono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Performance Metrics
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {Object.entries(selected.metrics).map(([k, v]) => (
              <div key={k} style={{
                background: 'rgba(15,23,42,0.5)', borderRadius: 14, padding: '12px 14px',
                border: `1px solid ${TOKEN.border}`,
              }}>
                <div style={{ fontSize: 9, fontFamily: TOKEN.fontMono, color: TOKEN.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  {k}
                </div>
                <div style={{ fontSize: 15, fontFamily: TOKEN.fontMono, fontWeight: 900, color: TOKEN.textPrimary }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Hash size={14} color={TOKEN.textMuted} />
            <span style={{ fontSize: 10, fontWeight: 900, color: TOKEN.textMuted, fontFamily: TOKEN.fontMono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              System Details
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(selected.details).map(([k, v]) => (
              <div key={k} style={{
                background: 'rgba(15,23,42,0.4)', borderRadius: 14, padding: '14px 16px',
                border: `1px solid ${TOKEN.border}`,
              }}>
                <div style={{ fontSize: 10, fontFamily: TOKEN.fontMono, fontWeight: 900, marginBottom: 5, color: cfg?.color, textTransform: 'uppercase' }}>
                  {k}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: TOKEN.textSecondary, fontWeight: 500 }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selected.connections.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Wifi size={14} color={TOKEN.textMuted} />
              <span style={{ fontSize: 10, fontWeight: 900, color: TOKEN.textMuted, fontFamily: TOKEN.fontMono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Active Connections
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selected.connections.map(connId => {
                const conn = MODULES.find(m => m.id === connId);
                if (!conn) return null;
                const connCfg = LAYER_CONFIG[conn.layer];
                return (
                  <span key={connId} style={{
                    fontSize: 11, fontFamily: TOKEN.fontMono, fontWeight: 900,
                    padding: '5px 12px', borderRadius: 10,
                    background: `${connCfg?.color}12`, color: connCfg?.color,
                    border: `1px solid ${connCfg?.color}25`,
                  }}>
                    → {conn.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   SIDE PANEL
═══════════════════════════════════════════════════════ */

function SidePanel({ visible, selectedId, onSelect, searchTerm, setSearchTerm, visLayers, toggleLayer, filtered, onClose }) {
  return (
    <div style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: 320,
      height: '100%',
      background: TOKEN.bgPanel,
      backdropFilter: 'blur(32px)',
      borderRight: `2px solid ${TOKEN.border}`,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: TOKEN.fontSans,
      zIndex: 30,
      transform: visible ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
    }}>
      <div style={{ padding: '32px 24px 20px', borderBottom: `1px solid ${TOKEN.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
            boxShadow: '0 10px 25px rgba(99,102,241,0.4)',
          }}>
            <GitBranch size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: TOKEN.textPrimary, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              Syntax_Arch
            </div>
            <div style={{ fontSize: 10, color: TOKEN.textMuted, fontFamily: TOKEN.fontMono, fontWeight: 900 }}>
              {filtered.length} NODES ACTIVE
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: TOKEN.textMuted }} />
          <input
            type="text"
            placeholder="Filter infrastructure..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              background: 'rgba(30,41,59,0.5)',
              border: `2px solid ${TOKEN.border}`,
              borderRadius: 14,
              color: TOKEN.textPrimary,
              fontSize: 13,
              fontFamily: TOKEN.fontMono,
              fontWeight: 700,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {LAYERS.map(layer => {
            const active = visLayers.includes(layer);
            const cfg = LAYER_CONFIG[layer];
            return (
              <button
                key={layer}
                onClick={() => toggleLayer(layer)}
                style={{
                  fontSize: 9, fontWeight: 900, padding: '5px 10px', borderRadius: 8,
                  border: `1px solid ${active ? cfg?.color + '50' : 'rgba(51,65,85,0.4)'}`,
                  background: active ? `${cfg?.color}15` : 'transparent',
                  color: active ? cfg?.color : TOKEN.textMuted,
                  cursor: 'pointer',
                  fontFamily: TOKEN.fontMono,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  transition: 'all 0.2s',
                }}
              >
                {layer}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }} className="custom-scrollbar">
        {filtered.map(mod => {
          const cfg = LAYER_CONFIG[mod.layer];
          const LayerIcon = cfg?.icon ?? Box;
          const isActive = selectedId === mod.id;
          const statusCol = STATUS_COLOR[mod.status];

          return (
            <button
              key={mod.id}
              onClick={() => onSelect(mod.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                marginBottom: 6,
                background: isActive ? `${cfg?.color}15` : 'transparent',
                border: `2px solid ${isActive ? cfg?.color + '40' : 'transparent'}`,
                borderRadius: 16,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? `${cfg?.color}25` : `${cfg?.color}10`,
                border: `1px solid ${cfg?.color}${isActive ? '60' : '20'}`,
              }}>
                <LayerIcon size={16} color={cfg?.color} strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 900,
                  color: isActive ? TOKEN.textPrimary : TOKEN.textSecondary,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  marginBottom: 2,
                }}>
                  {mod.name}
                </div>
                <div style={{ fontSize: 9, fontFamily: TOKEN.fontMono, color: TOKEN.textMuted, textTransform: 'uppercase', fontWeight: 900 }}>
                  {mod.layer}
                </div>
              </div>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: statusCol, boxShadow: `0 0 6px ${statusCol}`,
              }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */

export default function SystemArchitect3D() {
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visLayers, setVisLayers] = useState([...LAYERS]);
  const [panelOpen, setPanelOpen] = useState(true);
  const canvasRef = useRef(null);
  const roRef = useRef(null);

  useEffect(() => {
    return () => {
      if (roRef.current) { roRef.current.disconnect(); roRef.current = null; }
    };
  }, []);

  const selected = useMemo(() => MODULES.find(m => m.id === selectedId), [selectedId]);
  const hoveredModule = useMemo(() => MODULES.find(m => m.id === hoveredId), [hoveredId]);

  const toggleLayer = useCallback(layer => {
    setVisLayers(p => p.includes(layer) ? p.filter(l => l !== layer) : [...p, layer]);
  }, []);

  const filtered = useMemo(() =>
    MODULES.filter(m => {
      const q = searchTerm.toLowerCase();
      return visLayers.includes(m.layer) && (
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.layer.toLowerCase().includes(q) ||
        m.tags.some(t => t.toLowerCase().includes(q))
      );
    }), [searchTerm, visLayers]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: TOKEN.fontSans,
      background: TOKEN.bg,
    }}>
      <SidePanel
        visible={panelOpen}
        selectedId={selectedId}
        onSelect={setSelectedId}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        visLayers={visLayers}
        toggleLayer={toggleLayer}
        filtered={filtered}
        onClose={() => setPanelOpen(false)}
      />

      <div ref={canvasRef} style={{ position: 'absolute', inset: 0 }}>
        <Canvas
          shadows
          camera={{ position: [8, 5, 14], fov: 46, near: 0.1, far: 100 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
          }}
          dpr={[1, 1.5]}
          onCreated={({ gl, camera }) => {
            if (canvasRef.current) {
              let rafId;
              const ro = new ResizeObserver(entries => {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => {
                  for (const entry of entries) {
                    const { width: w, height: h } = entry.contentRect;
                    if (!w || !h) return;
                    gl.setSize(w, h, false);
                    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                    camera.aspect = w / h;
                    camera.updateProjectionMatrix();
                  }
                });
              });
              ro.observe(canvasRef.current);
              roRef.current = ro;
            }
          }}
        >
          <Suspense fallback={null}>
            <Scene selectedId={selectedId} hoveredId={hoveredId} onSelect={setSelectedId} onHover={setHoveredId} visLayers={visLayers} />
          </Suspense>
        </Canvas>

        {!selected && hoveredModule && (
          <AnimatePresence mode="wait">
            <motion.div
              key={hoveredModule.id} initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.96 }}
              style={{ position: 'absolute', bottom: 30, left: 30, width: 280, background: TOKEN.bgCard, backdropFilter: 'blur(20px)', border: `2px solid ${LAYER_CONFIG[hoveredModule.layer].color}40`, borderRadius: 20, overflow: 'hidden', boxShadow: `0 0 30px ${TOKEN.indigo}15`, pointerEvents: 'none', zIndex: 90 }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, ${LAYER_CONFIG[hoveredModule.layer].color}, transparent)` }} />
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${LAYER_CONFIG[hoveredModule.layer].color}20`, border: `1px solid ${LAYER_CONFIG[hoveredModule.layer].color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {React.createElement(LAYER_CONFIG[hoveredModule.layer].icon, { size: 18, color: LAYER_CONFIG[hoveredModule.layer].color, strokeWidth: 2.5 })}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: TOKEN.textPrimary, marginBottom: 2 }}>{hoveredModule.name}</div>
                    <div style={{ fontSize: 9, color: LAYER_CONFIG[hoveredModule.layer].color, fontFamily: TOKEN.fontMono, fontWeight: 900, textTransform: 'uppercase' }}>{hoveredModule.layer}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['CPU', 'MEM', 'TRAFFIC'].map((label, i) => (
                    <div key={label} style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px', border: `1px solid ${TOKEN.border}`, textAlign: 'center' }}>
                      <div style={{ fontSize: 8, color: TOKEN.textMuted, fontWeight: 900, marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: i === 0 ? TOKEN.indigo : i === 1 ? TOKEN.cyan : TOKEN.emerald, fontFamily: TOKEN.fontMono }}>{Object.values(hoveredModule.telemetry)[i]}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        <AnimatePresence>
          {selected && <DetailPanel selected={selected} onClose={() => setSelectedId(null)} />}
        </AnimatePresence>

        <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 10, zIndex: 120 }}>
          <button onClick={() => setSelectedId(null)} title="Reset Viewport" style={{ width: 44, height: 44, borderRadius: 14, border: `2px solid ${TOKEN.border}`, background: TOKEN.bgCard, backdropFilter: 'blur(12px)', cursor: 'pointer', color: TOKEN.textSecondary }}><RotateCcw size={18} /></button>
          <button onClick={() => setVisLayers([...LAYERS])} title="Show All Nodes" style={{ width: 44, height: 44, borderRadius: 14, border: `2px solid ${TOKEN.border}`, background: TOKEN.bgCard, backdropFilter: 'blur(12px)', cursor: 'pointer', color: TOKEN.textSecondary }}><Layers size={18} /></button>
        </div>

        <button onClick={() => setPanelOpen(p => !p)} style={{ position: 'absolute', bottom: 30, left: panelOpen ? 340 : 30, height: 48, padding: '0 20px', borderRadius: 14, border: `2px solid ${TOKEN.border}`, background: TOKEN.bgCard, backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: TOKEN.textSecondary, fontSize: 13, fontFamily: TOKEN.fontMono, fontWeight: 900, textTransform: 'uppercase', transition: 'left 0.4s cubic-bezier(0.23, 1, 0.32, 1)', zIndex: 120 }}>
          {panelOpen ? <ChevronLeft size={18} strokeWidth={3} /> : <Layers size={18} strokeWidth={3} />}
          {panelOpen ? 'Collapse_Arch' : 'Expand_Modules'}
        </button>

        {!selectedId && !hoveredId && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.5 }} style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', background: TOKEN.bgCard, backdropFilter: 'blur(20px)', border: `2px solid ${TOKEN.border}`, borderRadius: 24, fontSize: 12, fontFamily: TOKEN.fontMono, color: TOKEN.textSecondary, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Cpu size={14} color={TOKEN.cyan} /> <span>Probe a Node to Inspect Metrics</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}