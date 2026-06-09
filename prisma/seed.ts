import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    name: 'Anime & Mangá',
    categories: [
      { name: '👑 Masterpiece', color: '#a855f7' },
      { name: '💥 Excelente', color: '#ec4899' },
      { name: '👍 Divertido', color: '#3b82f6' },
      { name: '💤 Mediano / Ok', color: '#eab308' },
      { name: '🗑️ Ruim / Fraco', color: '#64748b' },
    ],
  },
  {
    name: 'Rank de Jogos',
    categories: [
      { name: '🎮 S++ (Lendário)', color: '#ca8a04' },
      { name: '🔥 S (Incrível)', color: '#ef4444' },
      { name: '⚡ A (Muito Bom)', color: '#f97316' },
      { name: '✨ B (Aceitável)', color: '#eab308' },
      { name: '👾 C (Ruim)', color: '#84cc16' },
      { name: '💀 F (Desastre)', color: '#06b6d4' },
    ],
  },
];

async function main() {
  console.log('Seeding templates...');
  // Templates podem ser servidos via endpoint GET /api/templates
  // ou mantidos apenas no frontend (mais simples)
}

main().catch(console.error).finally(() => prisma.$disconnect());
