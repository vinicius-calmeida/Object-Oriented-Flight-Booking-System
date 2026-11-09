/**
 * seed.ts
 * -------
 * Popula o banco com dados de exemplo para testes manuais.
 * Cria um admin, um usuário padrão, um usuário VIP e 12 voos
 * com origens e destinos variados — nacionais e internacionais —
 * para que a busca inteligente e os filtros tenham dados reais para
 * trabalhar.
 *
 * Para executar:
 *   npx ts-node src/tests/seed.ts
 *
 * ATENÇÃO: este script ADD dados ao banco. Se quiser partir do zero,
 * apague o arquivo database.sqlite antes de rodar.
 *
 * Credenciais criadas:
 *   admin@sistema.com        / senha123  (ADMIN)
 *   joao@sistema.com         / senha123  (PADRAO)
 *   maria@sistema.com        / senha123  (VIP)
 */

import "dotenv/config";
import "reflect-metadata";
import { AppDataSource } from "../database/data-source";
import { AuthService } from "../services/AuthService";
import { VooService } from "../services/VooService";
import { TipoUsuario } from "../enums/TipoUsuario";
import { TipoVoo } from "../enums/TipoVoo";

function diasAPartirDeHoje(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(10, 0, 0, 0);
  return d;
}

async function seed() {
  await AppDataSource.initialize();
  console.log("✅ Banco conectado. Iniciando seed...\n");

  const authService = new AuthService();
  const vooService = new VooService();

  // ── Usuários ──────────────────────────────────────────────────
  const ts = Date.now();

  const admin = await authService.cadastrar(
    "Admin Sistema",
    `admin.${ts}@sistema.com`,
    "senha123",
    TipoUsuario.ADMIN
  );
  console.log(`👤 Admin:  ${admin.email}`);

  const padrao = await authService.cadastrar(
    "João Viajante",
    `joao.${ts}@sistema.com`,
    "senha123",
    TipoUsuario.PADRAO
  );
  console.log(`👤 Padrão: ${padrao.email}`);

  const vip = await authService.cadastrar(
    "Maria VIP",
    `maria.${ts}@sistema.com`,
    "senha123",
    TipoUsuario.VIP
  );
  console.log(`👤 VIP:    ${vip.email}\n`);

  // ── Voos nacionais ────────────────────────────────────────────
  const voosNacionais: Array<[string, string, number, number, number]> = [
    // [origem, destino, diasAtePartida, precoBase, assentos]
    ["São Paulo",      "Rio de Janeiro",  3,  380, 30],
    ["São Paulo",      "Fortaleza",       5,  620, 25],
    ["São Paulo",      "Manaus",          7,  890, 20],
    ["Rio de Janeiro", "Salvador",        4,  450, 28],
    ["Rio de Janeiro", "Recife",          6,  510, 22],
    ["Brasília",       "São Paulo",       2,  340, 35],
    ["Belo Horizonte", "Porto Alegre",    8,  480, 20],
    ["Fortaleza",      "São Paulo",      10,  600, 25],
  ];

  for (const [origem, destino, dias, preco, assentos] of voosNacionais) {
    const v = await vooService.cadastrarVoo(
      admin, origem, destino,
      diasAPartirDeHoje(dias), preco, TipoVoo.NACIONAL, assentos
    );
    console.log(`✈️  NACIONAL  ${v.origem.padEnd(18)} → ${v.destino.padEnd(18)} R$${preco}  daqui ${dias}d`);
  }

  // ── Voos internacionais ───────────────────────────────────────
  const voosInternacionais: Array<[string, string, number, number, number]> = [
    ["São Paulo",  "Nova Iorque",  14, 3200, 20],
    ["São Paulo",  "Paris",        21, 4100, 18],
    ["São Paulo",  "Lisboa",       18, 2900, 20],
    ["São Paulo",  "Miami",        12, 2800, 22],
  ];

  for (const [origem, destino, dias, preco, assentos] of voosInternacionais) {
    const v = await vooService.cadastrarVoo(
      admin, origem, destino,
      diasAPartirDeHoje(dias), preco, TipoVoo.INTERNACIONAL, assentos
    );
    console.log(`✈️  INTL      ${v.origem.padEnd(18)} → ${v.destino.padEnd(18)} R$${preco}  daqui ${dias}d`);
  }

  console.log("\n✅ Seed concluído! 12 voos criados.");
  console.log("\nCredenciais para login:");
  console.log(`  Admin:  ${admin.email}  / senha123`);
  console.log(`  Padrão: ${padrao.email}  / senha123`);
  console.log(`  VIP:    ${vip.email}  / senha123`);

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
