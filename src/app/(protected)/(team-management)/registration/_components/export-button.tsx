'use client';

import { useMemo } from 'react';

import { Button } from '@chakra-ui/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';

import { RegistrationFormProps } from './preview-form';

export default function ExportButton({
  info,
  players,
  contentRef,
}: RegistrationFormProps) {
  const handleDownloadPdf = async () => {
    const element = contentRef.current;

    if (element) {
      const canvas = await html2canvas(element, {
        scale: 3, // Higher scale for better quality
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const marginTop = 5; // Top margin
      const marginBottom = 5; // Bottom margin
      const marginLeft = 5; // Left margin
      const marginRight = 5; // Right margin
      const availableHeight = pdfHeight - marginTop - marginBottom;
      const availableWidth = pdfWidth - marginLeft - marginRight;

      // Calculate dimensions
      const imgWidth = availableWidth;
      const imgHeight = (canvas.height * availableWidth) / canvas.width;

      // If content fits in one page
      if (imgHeight <= availableHeight) {
        pdf.addImage(
          imgData,
          'PNG',
          marginLeft,
          marginTop,
          imgWidth,
          imgHeight
        );
      } else {
        // Multi-page handling
        let yPosition = 0;
        let pageNumber = 1;

        while (yPosition < imgHeight) {
          const remainingHeight = imgHeight - yPosition;
          const pageHeight = Math.min(availableHeight, remainingHeight);

          // Calculate the portion of the image for this page
          const sourceY = (yPosition / imgHeight) * canvas.height;
          const sourceHeight = (pageHeight / imgHeight) * canvas.height;

          // Create a temporary canvas for this page
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          const pageCtx = pageCanvas.getContext('2d');

          if (pageCtx) {
            pageCtx.drawImage(
              canvas,
              0,
              sourceY,
              canvas.width,
              sourceHeight,
              0,
              0,
              canvas.width,
              sourceHeight
            );

            const pageImgData = pageCanvas.toDataURL('image/png', 1.0);

            if (pageNumber > 1) {
              pdf.addPage();
            }

            pdf.addImage(
              pageImgData,
              'PNG',
              marginLeft,
              marginTop,
              imgWidth,
              pageHeight
            );
          }

          yPosition += pageHeight;
          pageNumber++;
        }
      }

      const filename = `${info.name}_SaigonRovers.pdf`;
      pdf.save(filename);
    }
  };

  const isDisabled = useMemo(() => {
    return !info.name || players.length === 0;
  }, [info.name, players.length]);

  return (
    <Button onClick={handleDownloadPdf} disabled={isDisabled}>
      <Download />
      Export PDF
    </Button>
  );
}
