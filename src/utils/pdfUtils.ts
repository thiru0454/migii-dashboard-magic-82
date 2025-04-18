
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const generateWorkerIDCardPDF = async (workerId: string): Promise<void> => {
  const element = document.getElementById(`worker-card-${workerId}`);
  if (!element) return;

  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const imgWidth = 210; // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  pdf.save(`worker-id-${workerId}.pdf`);
};
