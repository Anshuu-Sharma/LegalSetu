const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const fontkit = require('fontkit');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { s3 } = require('../config/s3'); 
const { v4: uuidv4 } = require('uuid');


class FormFillingService {
  async fillForm(filePath, formData, formFields = [], imageHeight = null) {
    try {
      const fileBuffer = await fsp.readFile(filePath);
      const pdfDoc = await PDFDocument.load(fileBuffer);
      pdfDoc.registerFontkit(fontkit);

      // Load fonts
      const defaultFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const devFontPath = path.join(__dirname, '..', 'fonts', 'NotoSansDevanagari-Regular.ttf');

      let unicodeFont = null;
      try {
        const fontBuffer = await fsp.readFile(devFontPath);
        unicodeFont = await pdfDoc.embedFont(fontBuffer, { subset: false });
      } catch (err) {
        console.warn('⚠️ Hindi font not found. Only default font will be used.');
      }

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { height: pageHeight } = firstPage.getSize();

      for (const [fieldId, valueRaw] of Object.entries(formData)) {
        const value = String(valueRaw || '').trim();
        if (!value) continue;

        const field = formFields.find(f => f.id === fieldId);
        if (!field || !Array.isArray(field.rect) || field.rect.length !== 4) {
          console.warn(`⚠️ Skipping "${fieldId}": invalid or missing rectangle info.`);
          continue;
        }

        let [x, y, x2, y2] = field.rect;
        if (imageHeight) {
          y = pageHeight - y;
          y2 = pageHeight - y2;
          if (y2 < y) [y, y2] = [y2, y];
        }

        const fieldWidth = Math.abs(x2 - x);
        const fieldHeight = Math.abs(y2 - y);

        // Determine which font to use
        const isHindi = /[\u0900-\u097F]/.test(value);
        let font = defaultFont;

        if (isHindi) {
          if (!unicodeFont) {
            console.warn(`⚠️ Hindi text detected in "${fieldId}" but Devanagari font not loaded.`);
          } else {
            font = unicodeFont;
          }
        }

        if (!font) {
          console.error(`❌ No font available for field "${fieldId}". Skipping.`);
          continue;
        }

        let fontSize = Math.min(fieldHeight * 0.7, 18);
        let textWidth = font.widthOfTextAtSize(value, fontSize);
        while (textWidth > fieldWidth - 4 && fontSize > 6) {
          fontSize -= 0.5;
          textWidth = font.widthOfTextAtSize(value, fontSize);
        }

        const textX = x + (fieldWidth - textWidth) / 2;
        const textHeight = font.heightAtSize(fontSize);
        const textY = y + (fieldHeight / 2) - (textHeight / 2) + (fontSize * 2.5);

        // Highlight box 
        firstPage.drawRectangle({
          x: textX,
          y: textY,
          width: textWidth,
          height: textHeight,
          color: rgb(1, 1, 0.4), // yellow
          opacity: 1
        });

        // Draw text
        firstPage.drawText(value, {
          x: textX,
          y: textY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0)
        });
      }

      const pdfBytes = await pdfDoc.save();

      // local save:
      // const outputPath = path.join('uploads', 'filled', `filled_${Date.now()}.pdf`);
      // await fsp.mkdir(path.dirname(outputPath), { recursive: true });
      // await fsp.writeFile(outputPath, pdfBytes);

      // return {
      //   filePath: outputPath,
      //   downloadUrl: `/api/forms/download/${path.basename(outputPath)}`

      // AWS save:
      const fileName = `filled_${uuidv4()}.pdf`;
      const s3Key = `filled-forms/${fileName}`;

      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
        Body: pdfBytes,
        ContentType: 'application/pdf',
        ACL: 'private' // Keep files private
      };

      const uploadResult = await s3.upload(uploadParams).promise();

      // Generate a pre-signed URL for download (expires in 1 hour)
      const downloadUrl = s3.getSignedUrl('getObject', {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
        Expires: 3600 // 1 hour
      });

      return {
        filePath: uploadResult.Location,
        downloadUrl: downloadUrl,
        s3Key: s3Key,
        fileName: fileName
      };
    } catch (error) {
      console.error('Form filling error:', error);
      throw new Error('Failed to fill form: ' + error.message);
    }
  }
}

module.exports = new FormFillingService();
