// // server/src/services/formFillingService.js
// const fs = require('fs');
// const fsp = require('fs').promises;
// const path = require('path');
// const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// class FormFillingService {
//   // server/src/services/formFillingService.js
// // server/src/services/formFillingService.js
// async fillForm(filePath, formData, formFields = [], imageHeight = null) {
//   try {
//     // Load the PDF
//     const fileBuffer = await fsp.readFile(filePath);
//     const pdfDoc = await PDFDocument.load(fileBuffer);
//     const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
//     const pages = pdfDoc.getPages();
//     const firstPage = pages[0];
//     const { width: pageWidth, height: pageHeight } = firstPage.getSize();
    
//     // Process each form field
//     for (const [fieldId, value] of Object.entries(formData)) {
//       if (!value || !value.trim()) continue;
//       const field = formFields.find(f => f.id === fieldId);
      
//       if (field && field.rect) {
//         let [x, y, x2, y2] = field.rect;
        
//         if (imageHeight) {
//           // Convert y-coordinates from image space to PDF space
//           y = pageHeight - y;
//           y2 = pageHeight - y2;
          
//           // Ensure y2 > y after conversion
//           if (y2 < y) {
//             [y, y2] = [y2, y];
//           }
//         }
        
//         const fieldWidth = Math.abs(x2 - x);
//         const fieldHeight = Math.abs(y2 - y);
        
      
        
//         // Draw the text with proper vertical centering
//         const fontSize = Math.min(fieldHeight * 0.7, 18);
//         let textWidth = font.widthOfTextAtSize(String(value).trim(), fontSize);

//         while (textWidth > fieldWidth - 4 && fontSize > 6) {
//             fontSize -= 0.5;
//             textWidth = font.widthOfTextAtSize(String(value).trim(), fontSize);
//           }

//           // Center horizontally
//           const textX = x + (fieldWidth - textWidth) / 2;

//           // Center vertically (baseline adjustment)
//           const textHeight = font.heightAtSize(fontSize);
//           const textY = y + (fieldHeight / 2) - (textHeight / 2) + (fontSize * 2.5); 
          
//           firstPage.drawRectangle({
//             x: textX,
//             y: textY,
//             width: textWidth,
//             height: textHeight,
//             color: rgb(1, 1, 0.4), // Highlighter yellow
//             opacity: 1,
//             borderColor: undefined,
//             borderWidth: 0,
//           });


//           firstPage.drawText(String(value).trim(), {
//             x: textX,
//             y: textY,
//             size: fontSize,
//             font,
//             color: rgb(0, 0, 0),
//         });
//       }
//     }
    
//     // Save the filled PDF
//     const pdfBytes = await pdfDoc.save();
//     const outputPath = path.join('uploads', 'filled', `filled_${Date.now()}.pdf`);
    
//     await fsp.mkdir(path.join('uploads', 'filled'), { recursive: true }); 
//     await fsp.writeFile(outputPath, pdfBytes);
    
//     return {
//       filePath: outputPath,
//       downloadUrl: `/api/forms/download/${path.basename(outputPath)}`
//     };
//   } catch (error) {
//     console.error('Form filling error:', error);
//     throw new Error('Failed to fill form: ' + error.message);
//   }
// }


// }

// module.exports = new FormFillingService();


// server/src/services/formFillingService.js
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const fontkit = require('fontkit');
const { PDFDocument, rgb } = require('pdf-lib');

class FormFillingService {
  async fillForm(filePath, formData, formFields = [], imageHeight = null) {
    try {
      const fileBuffer = await fsp.readFile(filePath);
      const pdfDoc = await PDFDocument.load(fileBuffer);
      pdfDoc.registerFontkit(fontkit);

      // Load a Unicode Devanagari-compatible font
      const fontBuffer = await fsp.readFile(path.join(__dirname, '..', 'fonts', 'NotoSansDevanagari-Regular.ttf'));
      const font = await pdfDoc.embedFont(fontBuffer, { subset: false });

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width: pageWidth, height: pageHeight } = firstPage.getSize();

      for (const [fieldId, value] of Object.entries(formData)) {
        if (!value || !value.trim()) continue;

        const field = formFields.find(f => f.id === fieldId);
        if (!field || !field.rect) continue;

        let [x, y, x2, y2] = field.rect;

        if (imageHeight) {
          y = pageHeight - y;
          y2 = pageHeight - y2;
          if (y2 < y) [y, y2] = [y2, y];
        }

        const fieldWidth = Math.abs(x2 - x);
        const fieldHeight = Math.abs(y2 - y);
        let fontSize = Math.min(fieldHeight * 0.7, 18);

        let text = String(value).trim();
        let textWidth = font.widthOfTextAtSize(text, fontSize);
        while (textWidth > fieldWidth - 4 && fontSize > 6) {
          fontSize -= 0.5;
          textWidth = font.widthOfTextAtSize(text, fontSize);
        }

        const textX = x + (fieldWidth - textWidth) / 2;
        const textHeight = font.heightAtSize(fontSize);
        const textY = y + (fieldHeight / 2) - (textHeight / 2) + (fontSize * 2.5);

        // Optional: highlight rectangle
        firstPage.drawRectangle({
          x: textX,
          y: textY,
          width: textWidth,
          height: textHeight,
          color: rgb(1, 1, 0.4), // Yellow
          opacity: 1
        });

        firstPage.drawText(text, {
          x: textX,
          y: textY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0)
        });
      }

      const pdfBytes = await pdfDoc.save();
      const outputPath = path.join('uploads', 'filled', `filled_${Date.now()}.pdf`);
      await fsp.mkdir(path.dirname(outputPath), { recursive: true });
      await fsp.writeFile(outputPath, pdfBytes);

      return {
        filePath: outputPath,
        downloadUrl: `/api/forms/download/${path.basename(outputPath)}`
      };
    } catch (error) {
      console.error('Form filling error:', error);
      throw new Error('Failed to fill form: ' + error.message);
    }
  }
}

module.exports = new FormFillingService();
