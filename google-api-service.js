import { google } from 'googleapis';
import { createReadStream } from 'fs';
import { join } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
class GoogleApiService {
    constructor() {
        // Initialize with your service account credentials
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, './intellect-website-prod.json'),
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
        this.drive = google.drive({ version: 'v3', auth });
    }

    async addToSheet(spreadsheetId, range, values) {
        try {
            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId,
                range,
                valueInputOption: 'USER_ENTERED',
                resource: { values },
            });
            return response.data;
        } catch (error) {
            console.error('Error adding to sheet:', error);
            throw error;
        }
    }

    async uploadToDrive(filePath, fileName, folderId = null) {
        try {
            const fileMetadata = {
                name: fileName,
            };

            if (folderId) {
                fileMetadata.parents = [folderId];
            }

            const media = {
                mimeType: 'application/octet-stream',
                body: createReadStream(filePath),
            };


            const response = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id,webViewLink',
            });

            await this.drive.permissions.create({
                fileId: response.data.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            })

            return response.data;
        } catch (error) {
            console.error('Error uploading to drive:', error);
            throw error;
        }
    }

    async updateSheetWithDriveLink(spreadsheetId, sheetName, rowIndex, columnIndex, link) {
        try {
            const range = `${sheetName}!${this.getColumnLetter(columnIndex)}${rowIndex}`;

            const response = await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[link]],
                },
            });

            return response.data;
        } catch (error) {
            console.error('Error updating sheet with drive link:', error);
            throw error;
        }
    }

    getColumnLetter(columnIndex) {
        let letter = '';
        while (columnIndex >= 0) {
            letter = String.fromCharCode(65 + (columnIndex % 26)) + letter;
            columnIndex = Math.floor(columnIndex / 26) - 1;
        }
        return letter;
    }
}

export default GoogleApiService;