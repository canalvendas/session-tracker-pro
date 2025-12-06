import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DayRecord {
  date: string;
  sessions: number;
  value: number;
}

interface WeekRecord {
  weekStart: Date;
  weekEnd: Date;
  sessions: number;
  value: number;
}

interface GenerateReportParams {
  monthlyHistory: DayRecord[];
  weeklyHistory: WeekRecord[];
  year: number;
  month: number;
  therapistName?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function generateMonthlyReport({
  monthlyHistory,
  weeklyHistory,
  year,
  month,
  therapistName,
}: GenerateReportParams): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [61, 139, 125];
  const textColor: [number, number, number] = [30, 41, 38];
  const mutedColor: [number, number, number] = [107, 114, 128];

  // Calculate totals
  const totalSessions = monthlyHistory.reduce((sum, day) => sum + day.sessions, 0);
  const totalValue = monthlyHistory.reduce((sum, day) => sum + day.value, 0);

  let yPosition = 20;

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório Mensal', pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${monthNames[month]} de ${year}`, pageWidth / 2, 32, { align: 'center' });
  
  if (therapistName) {
    doc.setFontSize(11);
    doc.text(therapistName, pageWidth / 2, 40, { align: 'center' });
  }

  yPosition = 60;

  // Summary Cards
  doc.setFillColor(245, 247, 246);
  doc.roundedRect(15, yPosition, 85, 35, 3, 3, 'F');
  doc.roundedRect(105, yPosition, 85, 35, 3, 3, 'F');

  // Total Sessions Card
  doc.setTextColor(...textColor);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(totalSessions.toString(), 57.5, yPosition + 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  doc.text('sessões realizadas', 57.5, yPosition + 28, { align: 'center' });

  // Total Value Card
  doc.setTextColor(...primaryColor);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalValue), 147.5, yPosition + 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  doc.text('faturamento total', 147.5, yPosition + 28, { align: 'center' });

  yPosition += 50;

  // Weekly Summary Section
  if (weeklyHistory.length > 0) {
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Semanal', 15, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    weeklyHistory.forEach((week) => {
      const weekLabel = `${format(week.weekStart, "d MMM", { locale: ptBR })} - ${format(week.weekEnd, "d MMM", { locale: ptBR })}`;
      
      doc.setFillColor(250, 251, 250);
      doc.roundedRect(15, yPosition - 4, pageWidth - 30, 12, 2, 2, 'F');
      
      doc.setTextColor(...textColor);
      doc.text(weekLabel, 20, yPosition + 3);
      
      doc.setTextColor(...mutedColor);
      doc.text(`${week.sessions} ${week.sessions === 1 ? 'sessão' : 'sessões'}`, 100, yPosition + 3);
      
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(week.value), pageWidth - 20, yPosition + 3, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      
      yPosition += 14;
    });

    yPosition += 10;
  }

  // Daily Details Section
  if (monthlyHistory.length > 0) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento Diário', 15, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Table header
    doc.setFillColor(...primaryColor);
    doc.rect(15, yPosition - 4, pageWidth - 30, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Data', 20, yPosition + 2);
    doc.text('Sessões', 100, yPosition + 2);
    doc.text('Valor', pageWidth - 20, yPosition + 2, { align: 'right' });
    yPosition += 12;

    doc.setFont('helvetica', 'normal');

    monthlyHistory.forEach((day, index) => {
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      const dateLabel = format(new Date(day.date), "EEE, d 'de' MMMM", { locale: ptBR });
      
      if (index % 2 === 0) {
        doc.setFillColor(250, 251, 250);
        doc.rect(15, yPosition - 4, pageWidth - 30, 10, 'F');
      }
      
      doc.setTextColor(...textColor);
      doc.text(dateLabel, 20, yPosition + 2);
      
      doc.setTextColor(...mutedColor);
      doc.text(`${day.sessions}`, 100, yPosition + 2);
      
      doc.setTextColor(...primaryColor);
      doc.text(formatCurrency(day.value), pageWidth - 20, yPosition + 2, { align: 'right' });
      
      yPosition += 10;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Download the PDF
  const fileName = `relatorio-${monthNames[month].toLowerCase()}-${year}.pdf`;
  doc.save(fileName);
}
