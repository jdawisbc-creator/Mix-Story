import type { TipoPeriodo, IntervaloDatas } from '../types/relatorios';

/**
 * Converte qualquer representação de data do sistema para objeto Date válido
 * Suporta: ISO (2026-09-16T14:15:00Z), YYYY-MM-DD (2026-09-16) e DD/MM/AAAA (16/09/2026)
 */
export function parseDataGenerica(dataStr?: string | null): Date | null {
  if (!dataStr) return null;
  const str = String(dataStr).trim();
  if (!str) return null;

  // DD/MM/AAAA ou DD/MM/AAAA HH:mm
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    const parts = str.split(' ')[0].split('/');
    const dia = parseInt(parts[0], 10);
    const mes = parseInt(parts[1], 10) - 1;
    const ano = parseInt(parts[2], 10);

    let horas = 0;
    let minutos = 0;
    let segundos = 0;
    if (str.includes(' ')) {
      const timeParts = str.split(' ')[1].split(':');
      horas = parseInt(timeParts[0] || '0', 10);
      minutos = parseInt(timeParts[1] || '0', 10);
      segundos = parseInt(timeParts[2] || '0', 10);
    }
    return new Date(ano, mes, dia, horas, minutos, segundos);
  }

  // YYYY-MM-DD (sem hora): trata como meio-dia local para evitar deslocamento de fuso
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [ano, mes, dia] = str.split('-').map(Number);
    return new Date(ano, mes - 1, dia, 12, 0, 0);
  }

  // ISO ou outros formatos com hora
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d;
  }
  return null;
}

/**
 * Verifica se uma data está contida dentro do intervalo [inicio, fim]
 */
export function isDataNoIntervalo(dataStr: string | undefined | null, inicio: Date, fim: Date): boolean {
  if (!dataStr) return false;
  const parsed = parseDataGenerica(dataStr);
  if (!parsed) return false;

  const t = parsed.getTime();
  return t >= inicio.getTime() && t <= fim.getTime();
}

/**
 * Formata um valor numérico em moeda brasileira (R$ 0,00)
 */
export function formatarMoeda(valor: number): string {
  return (Number(valor) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata um Date em DD/MM/AAAA
 */
export function formatarData(d: Date): string {
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata data e hora em DD/MM/AAAA HH:mm
 */
export function formatarDataHora(d: Date = new Date()): string {
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano} às ${hora}:${min}`;
}

/**
 * Calcula o intervalo de datas com base na opção selecionada
 */
export function calcularIntervaloPeriodo(
  tipo: TipoPeriodo,
  customInicio?: string,
  customFim?: string
): IntervaloDatas {
  const agora = new Date();

  let inicio: Date;
  let fim: Date;
  let label: string;

  switch (tipo) {
    case 'hoje': {
      inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0, 0);
      fim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999);
      label = `Hoje (${formatarData(inicio)})`;
      break;
    }
    case 'ontem': {
      const ontem = new Date(agora);
      ontem.setDate(ontem.getDate() - 1);
      inicio = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 0, 0, 0, 0);
      fim = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 23, 59, 59, 999);
      label = `Ontem (${formatarData(inicio)})`;
      break;
    }
    case 'esta_semana': {
      // Começo da semana (segunda-feira)
      const diaSemana = agora.getDay(); // 0 = dom, 1 = seg...
      const diffSegunda = (diaSemana === 0 ? -6 : 1) - diaSemana;
      const segunda = new Date(agora);
      segunda.setDate(agora.getDate() + diffSegunda);
      inicio = new Date(segunda.getFullYear(), segunda.getMonth(), segunda.getDate(), 0, 0, 0, 0);

      const domingo = new Date(segunda);
      domingo.setDate(segunda.getDate() + 6);
      fim = new Date(domingo.getFullYear(), domingo.getMonth(), domingo.getDate(), 23, 59, 59, 999);
      label = `Esta Semana (${formatarData(inicio)} a ${formatarData(fim)})`;
      break;
    }
    case 'este_mes': {
      inicio = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0, 0);
      fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
      const nomesMes = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      label = `Este Mês — ${nomesMes[agora.getMonth()]} / ${agora.getFullYear()}`;
      break;
    }
    case 'mes_anterior': {
      const mesAnteriorDate = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
      inicio = new Date(mesAnteriorDate.getFullYear(), mesAnteriorDate.getMonth(), 1, 0, 0, 0, 0);
      fim = new Date(mesAnteriorDate.getFullYear(), mesAnteriorDate.getMonth() + 1, 0, 23, 59, 59, 999);
      const nomesMes = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      label = `Mês Anterior — ${nomesMes[inicio.getMonth()]} / ${inicio.getFullYear()}`;
      break;
    }
    case 'personalizado': {
      if (customInicio && customFim) {
        const [anoI, mesI, diaI] = customInicio.split('-').map(Number);
        const [anoF, mesF, diaF] = customFim.split('-').map(Number);
        inicio = new Date(anoI, mesI - 1, diaI, 0, 0, 0, 0);
        fim = new Date(anoF, mesF - 1, diaF, 23, 59, 59, 999);
      } else if (customInicio) {
        const [anoI, mesI, diaI] = customInicio.split('-').map(Number);
        inicio = new Date(anoI, mesI - 1, diaI, 0, 0, 0, 0);
        fim = new Date(anoI, mesI - 1, diaI, 23, 59, 59, 999);
      } else {
        inicio = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0, 0);
        fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
      }
      label = `Período Personalizado: ${formatarData(inicio)} até ${formatarData(fim)}`;
      break;
    }
    default: {
      inicio = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0, 0);
      fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
      label = `Este Mês`;
    }
  }

  return {
    inicio,
    fim,
    label,
    inicioFormatado: formatarData(inicio),
    fimFormatado: formatarData(fim),
  };
}

/**
 * Exporta dados tabulares para arquivo CSV compatível com Excel (separador ';' e BOM UTF-8)
 */
export function exportarParaCSV(
  nomeArquivo: string,
  cabecalhos: string[],
  linhas: (string | number)[][]
): void {
  // BOM para Excel reconhecer acentuação pt-BR
  let csvContent = '\uFEFF';

  // Cabeçalhos
  csvContent += cabecalhos.map(escapeCSV).join(';') + '\r\n';

  // Linhas
  for (const linha of linhas) {
    csvContent += linha.map(escapeCSV).join(';') + '\r\n';
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${nomeArquivo}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(valor: string | number): string {
  if (valor === undefined || valor === null) return '""';
  const str = String(valor).replace(/"/g, '""');
  return `"${str}"`;
}
