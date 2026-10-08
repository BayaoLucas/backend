import { RowDataPacket } from 'mysql2';
import { db, testarConexao, mensagemConexao } from '../config/database';

async function verificar(): Promise<void> {
  try {
    await testarConexao();
    const [info] = await db.query<RowDataPacket[]>(
      'SELECT DATABASE() AS banco, @@port AS porta, VERSION() AS versao'
    );
    console.table(info);
    const [tabelas] = await db.query<RowDataPacket[]>(
      'SELECT TABLE_NAME AS nome FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME'
    );
    console.table(tabelas);
    const nomes = tabelas.map(t => String(t.nome));
    const faltantes = ['usuarios', 'clientes', 'produtos', 'vendas', 'itens_venda'].filter(t => !nomes.includes(t));
    if (faltantes.length) {
      console.error('Tabelas ausentes:', faltantes.join(', '));
      process.exitCode = 1;
    } else {
      console.log('As cinco tabelas foram encontradas.');
    }
  } catch (erro) {
    console.error(mensagemConexao(erro));
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}
verificar();
