import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

export interface PdfDocParams {
  title: string;
  subtitle?: string;
  lines: Array<{ label: string; value: string }>;
  bodyRows?: string[][]; // ixtiyoriy jadval (masalan transkript)
  bodyHeader?: string[];
  verifyUrl: string;
  qrHash: string;
}

/** Rasmiy hujjat PDF'ini quradi (QR verifikatsiya bilan). Buffer qaytaradi. */
export async function buildDocumentPdf(params: PdfDocParams): Promise<Buffer> {
  const qrPng = await QRCode.toBuffer(params.verifyUrl, { margin: 1, width: 120 });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Sarlavha
    doc.fontSize(16).font('Helvetica-Bold').text('IDU UNIVERSITETI', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(18).text(params.title.toUpperCase(), { align: 'center' });
    if (params.subtitle) {
      doc.moveDown(0.2);
      doc.fontSize(11).font('Helvetica').text(params.subtitle, { align: 'center' });
    }
    doc.moveDown(1.5);

    // Maydonlar
    doc.font('Helvetica').fontSize(12);
    for (const l of params.lines) {
      doc.font('Helvetica-Bold').text(`${l.label}: `, { continued: true });
      doc.font('Helvetica').text(l.value);
      doc.moveDown(0.3);
    }

    // Ixtiyoriy jadval (transkript)
    if (params.bodyHeader && params.bodyRows) {
      doc.moveDown(0.8);
      doc.font('Helvetica-Bold').fontSize(11).text(params.bodyHeader.join('   |   '));
      doc.moveDown(0.2);
      doc.font('Helvetica').fontSize(10);
      for (const row of params.bodyRows) {
        doc.text(row.join('   |   '));
        doc.moveDown(0.1);
      }
    }

    // QR + verifikatsiya
    doc.image(qrPng, doc.page.width - 160, doc.page.height - 160, { width: 100 });
    doc.fontSize(8).font('Helvetica').text(
      `Haqiqiylikni tekshirish: ${params.verifyUrl}`,
      50,
      doc.page.height - 70,
      { width: doc.page.width - 220 },
    );
    doc.fontSize(8).text(`ID: ${params.qrHash}`, 50, doc.page.height - 55);

    doc.end();
  });
}
