import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { BackupService } from '../../services/backupService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { SnapshotBackup, TotaisBackup, ItemBackupServidor } from '../../types';
import {
  Database,
  Download,
  Upload,
  Server,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Clock,
  Archive,
} from 'lucide-react';

interface ConfigBackupProps {
  onRestauracaoConcluida: () => void;
}

export const ConfigBackup: React.FC<ConfigBackupProps> = ({ onRestauracaoConcluida }) => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [gerando, setGerando] = useState(false);
  const [salvandoServidor, setSalvandoServidor] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [carregandoLista, setCarregandoLista] = useState(false);

  // Lista de backups do servidor
  const [backupsServidor, setBackupsServidor] = useState<ItemBackupServidor[]>([]);

  // Modal de Confirmação de Restauração
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [snapshotParaRestaurar, setSnapshotParaRestaurar] = useState<SnapshotBackup | null>(null);
  const [nomeArquivoServidor, setNomeArquivoServidor] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Carregar lista de backups gravados no servidor
  const carregarBackupsServidor = async () => {
    setCarregandoLista(true);
    try {
      const lista = await BackupService.listarBackupsServidor();
      setBackupsServidor(lista);
    } catch {
      // Falha silenciosa caso API não esteja disponível
    } finally {
      setCarregandoLista(false);
    }
  };

  useEffect(() => {
    carregarBackupsServidor();
  }, []);

  // 1. Exportar e Baixar Arquivo JSON (Pendrive / Computador)
  const handleBaixarBackup = async () => {
    if (!user) return;
    setGerando(true);
    try {
      const snapshot = await BackupService.gerarSnapshot(user.name);
      BackupService.baixarBackupArquivo(snapshot);
      const totalRegistros = Object.values(snapshot.totais).reduce((a, b) => a + b, 0);
      success(
        'Backup Exportado com Sucesso',
        `Arquivo baixado com ${totalRegistros} registros. Salve em pendrive ou na nuvem.`
      );
    } catch (err: any) {
      error('Falha ao exportar', err?.message || 'Erro ao compilar dados do sistema.');
    } finally {
      setGerando(false);
    }
  };

  // 2. Salvar Ponto no Servidor (Disco do Servidor)
  const handleSalvarNoServidor = async () => {
    if (!user) return;
    setSalvandoServidor(true);
    try {
      const snapshot = await BackupService.gerarSnapshot(user.name);
      const res = await BackupService.salvarBackupNoServidor(snapshot);
      success(
        'Ponto de Restauração Criado',
        `Backup ${res.nomeArquivo} gravado com sucesso no servidor.`
      );
      carregarBackupsServidor();
    } catch (err: any) {
      error('Erro ao salvar no servidor', err?.message);
    } finally {
      setSalvandoServidor(false);
    }
  };

  // 3. Upload de Arquivo JSON Externo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const snapshot = await BackupService.lerArquivoBackup(file);
      setSnapshotParaRestaurar(snapshot);
      setNomeArquivoServidor(null);
      setIsConfirmModalOpen(true);
    } catch (err: any) {
      error('Arquivo Inválido', err?.message || 'O arquivo selecionado não é um backup válido da Mix Variedades Store.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 4. Selecionar Backup do Servidor para Restaurar
  const handleRestaurarDoServidor = async (item: ItemBackupServidor) => {
    if (!user) return;
    setRestaurando(true);
    try {
      const res = await BackupService.restaurarDoServidor(item.nomeArquivo, {
        id: user.id,
        name: user.name,
      });
      success('Restauração Concluída', res.mensagem);
      onRestauracaoConcluida();
    } catch (err: any) {
      error('Falha ao restaurar do servidor', err?.message);
    } finally {
      setRestaurando(false);
    }
  };

  // 5. Executar Restauração de Arquivo após confirmação
  const executarRestauraçãoArquivo = async () => {
    if (!snapshotParaRestaurar || !user) return;

    setRestaurando(true);
    try {
      const res = await BackupService.restaurarBackup(snapshotParaRestaurar, {
        id: user.id,
        name: user.name,
      });

      success('Restauração Concluída com Sucesso', res.mensagem);
      setIsConfirmModalOpen(false);
      setSnapshotParaRestaurar(null);
      onRestauracaoConcluida();
    } catch (err: any) {
      error('Falha na Restauração', err?.message || 'Não foi possível restaurar os dados.');
    } finally {
      setRestaurando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* CARD PRINCIPAL: ARQUITETURA DE BACKUP SEGURA */}
      <Card variant="elevated">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#FF8A00]" />
              <span>ESTRUTURA DE BACKUP SEGURO & PERSISTÊNCIA</span>
            </div>
          }
          subtitle="Segurança de dados independente do navegador: exporte arquivos físicos e salve no servidor ou pendrive."
        />
        <CardBody className="space-y-5">
          {/* Alerta de Diretriz Oficial */}
          <div className="p-4 rounded-xl bg-[#171724] border border-[#2A2A3E] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-300 leading-relaxed">
              <strong className="text-white font-semibold block mb-0.5">
                Não depende do armazenamento local do navegador:
              </strong>
              Para proteger o faturamento, estoque e ordens de serviço contra limpezas de cache ou formatações de computador, o sistema permite baixar o banco de dados inteiro em arquivos estruturados JSON (que podem ser copiados para pendrives ou Google Drive) e salvar pontos de restauração no disco do servidor.
            </div>
          </div>

          {/* Bloco de Ações de Criação de Backup */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ação 1: Baixar Arquivo Físico */}
            <div className="p-5 rounded-2xl bg-[#151522] border border-[#2A2A3E] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#FF8A00]/10 border border-[#FF8A00]/30 flex items-center justify-center text-[#FF8A00]">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">
                  Baixar Arquivo de Backup Completo (.JSON)
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Gera um arquivo físico criptografado por hash contendo todo o catálogo de produtos, histórico de vendas, fechamentos de caixa, despesas, ordens de serviço e auditoria.
                </p>
              </div>

              <Button
                variant="accent"
                icon={<Download className="w-4 h-4" />}
                onClick={handleBaixarBackup}
                disabled={gerando}
                className="w-full"
              >
                {gerando ? 'Gerando Backup...' : 'Baixar Arquivo JSON'}
              </Button>
            </div>

            {/* Ação 2: Ponto no Servidor */}
            <div className="p-5 rounded-2xl bg-[#151522] border border-[#2A2A3E] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#7B2CF6]/10 border border-[#7B2CF6]/30 flex items-center justify-center text-[#A76BFF]">
                  <Server className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">
                  Criar Ponto de Restauração no Servidor
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Grava um instantâneo do banco de dados diretamente no disco de armazenamento do servidor (diretório seguro do backend), permitindo restaurações rápidas com 1 clique.
                </p>
              </div>

              <Button
                variant="secondary"
                icon={<Server className="w-4 h-4" />}
                onClick={handleSalvarNoServidor}
                disabled={salvandoServidor}
                className="w-full"
              >
                {salvandoServidor ? 'Gravando no Servidor...' : 'Criar Ponto no Servidor'}
              </Button>
            </div>
          </div>

          {/* Bloco de Restauração a Partir de Arquivo */}
          <div className="p-5 rounded-2xl bg-[#13131F] border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Upload className="w-5 h-5" />
              <h4 className="font-bold text-sm text-white">
                Restaurar a Partir de Arquivo Externo (.JSON)
              </h4>
            </div>
            <p className="text-xs text-zinc-400">
              Selecione um arquivo de backup previamente baixado da Mix Variedades Store para recuperar o estado dos dados. Uma verificação completa de estrutura será realizada antes de aplicar as alterações.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
              id="backup-file-upload"
            />

            <Button
              variant="secondary"
              icon={<Upload className="w-4 h-4 text-amber-400" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Selecionar Arquivo de Backup para Restaurar
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* CARD 2: PONTOS DE RESTAURAÇÃO DO SERVIDOR */}
      <Card variant="elevated">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-purple-400" />
              <span>PONTOS DE RESTAURAÇÃO GRAVADOS NO DISCO DO SERVIDOR</span>
            </div>
          }
          subtitle="Histórico de backups gravados no ambiente persistente do servidor."
          action={
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${carregandoLista ? 'animate-spin' : ''}`} />}
              onClick={carregarBackupsServidor}
            >
              Atualizar
            </Button>
          }
        />
        <CardBody>
          {backupsServidor.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-[#242436] text-center text-zinc-500 text-xs">
              <Archive className="w-8 h-8 mx-auto mb-2 text-zinc-600 opacity-50" />
              Nenhum ponto gravado no servidor ainda. Clique em "Criar Ponto no Servidor" acima para salvar seu primeiro backup em disco.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#222230]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#181824] border-b border-[#222230] text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Nome do Arquivo</th>
                    <th className="py-3 px-4">Data de Gravação</th>
                    <th className="py-3 px-4 text-center">Tamanho</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F2C]">
                  {backupsServidor.map((b) => (
                    <tr key={b.nomeArquivo} className="hover:bg-[#1A1A26]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-200">
                        {b.nomeArquivo}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {new Date(b.dataCriacao).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-zinc-400">
                        {(b.tamanhoBytes / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<RefreshCw className="w-3.5 h-3.5 text-amber-400" />}
                            onClick={() => handleRestaurarDoServidor(b)}
                            disabled={restaurando}
                          >
                            Restaurar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* MODAL DE CONFIRMAÇÃO DE RESTAURAÇÃO DE ARQUIVO */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="CONFIRMAR RESTAURAÇÃO DE BACKUP"
      >
        {snapshotParaRestaurar && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-200 block mb-1">
                  Atenção: Ação de Restauração do Banco de Dados
                </strong>
                Ao confirmar, todos os dados atuais serão substituídos pelos dados contidos neste arquivo de backup. Esta operação será registrada no livro de auditoria do sistema.
              </div>
            </div>

            {/* Metadados do Snapshot */}
            <div className="p-4 rounded-xl bg-[#141420] border border-[#242436] space-y-2 text-xs">
              <div className="flex justify-between border-b border-[#222234] pb-1.5">
                <span className="text-zinc-400">Data do Backup:</span>
                <span className="font-bold text-white">
                  {new Date(snapshotParaRestaurar.timestamp).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#222234] pb-1.5">
                <span className="text-zinc-400">Gerado por:</span>
                <span className="font-bold text-white">
                  {snapshotParaRestaurar.geradoPor}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#222234] pb-1.5">
                <span className="text-zinc-400">Total de Registros:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {Object.values(snapshotParaRestaurar.totais).reduce((a: number, b: any) => a + (Number(b) || 0), 0)} itens
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-zinc-400">
                <div>Produtos: <strong className="text-white">{snapshotParaRestaurar.totais.produtos}</strong></div>
                <div>Vendas: <strong className="text-white">{snapshotParaRestaurar.totais.vendas}</strong></div>
                <div>Ordens OS: <strong className="text-white">{snapshotParaRestaurar.totais.ordensServico}</strong></div>
                <div>Caixas: <strong className="text-white">{snapshotParaRestaurar.totais.caixas}</strong></div>
                <div>Gastos: <strong className="text-white">{snapshotParaRestaurar.totais.gastos}</strong></div>
                <div>Usuários: <strong className="text-white">{snapshotParaRestaurar.totais.usuarios}</strong></div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={restaurando}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="accent"
                onClick={executarRestauraçãoArquivo}
                disabled={restaurando}
                icon={<RefreshCw className={`w-4 h-4 ${restaurando ? 'animate-spin' : ''}`} />}
              >
                {restaurando ? 'Restaurando Banco...' : 'Sim, Restaurar Este Backup'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
