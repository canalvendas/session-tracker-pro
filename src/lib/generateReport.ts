import { jsPDF } from 'jspdf';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clinic } from '@/types/clinic';

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

interface ClinicBreakdown {
  clinic: Clinic | null;
  sessions: number;
  value: number;
}

interface GenerateReportParams {
  monthlyHistory: DayRecord[];
  weeklyHistory: WeekRecord[];
  clinicBreakdown: ClinicBreakdown[];
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

// Convert hex color to RGB
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [61, 139, 125]; // Default primary color
};

export function generateMonthlyReport({
  monthlyHistory,
  weeklyHistory,
  clinicBreakdown,
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

  // Clinic Breakdown Section (NEW)
  if (clinicBreakdown.length > 0) {
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Faturamento por Clínica', 15, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    clinicBreakdown.forEach((item) => {
      const clinicName = item.clinic?.name || 'Sem clínica';
      const clinicColor = item.clinic ? hexToRgb(item.clinic.color) : mutedColor;
      const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0';
      
      // Background bar showing percentage
      const barWidth = totalValue > 0 ? ((item.value / totalValue) * (pageWidth - 30)) : 0;
      doc.setFillColor(250, 251, 250);
      doc.roundedRect(15, yPosition - 4, pageWidth - 30, 14, 2, 2, 'F');
      
      // Percentage fill bar with lighter color
      if (barWidth > 0) {
        // Create a lighter version of the clinic color
        const lightR = Math.min(255, clinicColor[0] + Math.floor((255 - clinicColor[0]) * 0.85));
        const lightG = Math.min(255, clinicColor[1] + Math.floor((255 - clinicColor[1]) * 0.85));
        const lightB = Math.min(255, clinicColor[2] + Math.floor((255 - clinicColor[2]) * 0.85));
        doc.setFillColor(lightR, lightG, lightB);
        doc.roundedRect(15, yPosition - 4, barWidth, 14, 2, 2, 'F');
      }
      
      // Color indicator dot
      doc.setFillColor(...clinicColor);
      doc.circle(22, yPosition + 3, 2.5, 'F');
      
      // Clinic name
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.text(clinicName, 28, yPosition + 5);
      
      // Sessions count
      doc.setTextColor(...mutedColor);
      doc.setFont('helvetica', 'normal');
      doc.text(`${item.sessions} ${item.sessions === 1 ? 'sessão' : 'sessões'} (${percentage}%)`, 90, yPosition + 5);
      
      // Value
      doc.setTextColor(...clinicColor);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(item.value), pageWidth - 20, yPosition + 5, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      
      yPosition += 16;
    });

    yPosition += 8;
  }

  // Weekly Summary Section
  if (weeklyHistory.length > 0) {
    // Check if we need a new page
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

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

      const dateLabel = format(parseISO(day.date), "EEE, d 'de' MMMM", { locale: ptBR });
      
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
