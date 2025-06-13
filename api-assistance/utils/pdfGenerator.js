const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// 🔁 Quitar duplicados (último registro por alumno/curso/fecha)
function removeDuplicateAttendances(data) {
  const map = new Map();
  data.forEach(item => {
    const key = `${item.studentName}_${item.courseName}_${new Date(item.timestamp).toDateString()}`;
    if (!map.has(key) || new Date(item.timestamp) > new Date(map.get(key).timestamp)) {
      map.set(key, item);
    }
  });
  return Array.from(map.values());
}

function generateAttendancePDF({ title, data = [], outputPath }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Logos institucionales
    const logoTESJI = path.join(__dirname, '..', 'report_assets', 'logo.jpeg');
    const logoISIC = path.join(__dirname, '..', 'report_assets', 'iconoisic.png');

    if (fs.existsSync(logoTESJI)) doc.image(logoTESJI, 50, 30, { width: 60 });
    if (fs.existsSync(logoISIC)) doc.image(logoISIC, 500, 30, { width: 60 });

    // Título
    doc.fillColor('#2e7d32')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(title, 0, 100, { align: 'center' });

    doc.moveDown(2);

    // Configuración de tabla
    const headers = ['Alumno', 'Curso', 'Fecha', 'Hora de Asistencia', 'Estado'];
    const colWidths = [150, 100, 80, 110, 80];
    const colX = [50, 200, 300, 380, 490];
    const rowHeight = 25;
    const headerHeight = 35;
    let y = doc.y;

    // 🧱 Dibujar encabezado con bordes y mayor altura
    doc.fontSize(11).font('Helvetica-Bold').fillColor('black');
    headers.forEach((header, i) => {
      doc.rect(colX[i], y, colWidths[i], headerHeight).stroke();
      doc.text(header, colX[i] + 5, y + 10, { width: colWidths[i] - 10, align: 'left' });
    });

    y += headerHeight;

    // 📦 Filtrar duplicados
    const cleanData = removeDuplicateAttendances(data);

    doc.font('Helvetica').fontSize(10);

    cleanData.forEach(item => {
      const fecha = new Date(item.timestamp);
      const fechaStr = fecha.toLocaleDateString('es-MX');
      const horaStr = fecha.toLocaleTimeString('es-MX', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });

      if (y + rowHeight > 770) {
        doc.addPage();
        y = 50;

        // Redibujar encabezado
        doc.fontSize(11).font('Helvetica-Bold').fillColor('black');
        headers.forEach((header, i) => {
          doc.rect(colX[i], y, colWidths[i], headerHeight).stroke();
          doc.text(header, colX[i] + 5, y + 10, { width: colWidths[i] - 10 });
        });
        y += headerHeight;
        doc.font('Helvetica').fontSize(10);
      }

      const values = [
        item.studentName,
        item.courseName,
        fechaStr,
        horaStr,
        item.status === 'present' ? 'ASISTIÓ' : 'NO ASISTIÓ'
      ];

      values.forEach((text, i) => {
        doc.rect(colX[i], y, colWidths[i], rowHeight).stroke();
        const color = (i === 4 && text === 'NO ASISTIÓ') ? 'red' : (i === 4 ? 'green' : 'black');
        doc.fillColor(color).text(text, colX[i] + 5, y + 7, { width: colWidths[i] - 10 });
      });

      y += rowHeight;
    });

    doc.end();
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

module.exports = {
  generateAttendancePDF
};
