import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer'
import { fileURLToPath } from 'url';
import GoogleApiService from './google-api-service.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ dest: 'uploads/' });
const googleApiService = new GoogleApiService();

const SPREADSHEET_ID = '1DbsTJffNWoElWk7x5kgYSNi6w_7xAp6WVWvi5MlfMus';
const SHEET_NAME = 'Sheet1';

app.use(cors());
app.use(express.json());

app.post('/api/contact', upload.single('file'), async (req, res) => {
    try {
        const { body, file } = req;

        const values = [
            body.whoYouAre,
            body.name,
            body.companyName,
            body.email,
            body.mobileNumber,
            body.message,
            Date()
        ];

        const sheetResponse = await googleApiService.addToSheet(
            SPREADSHEET_ID,
            `${SHEET_NAME}!A:Z`,
            [values]
        );

        const rowNumber = sheetResponse.updates.updatedRange[sheetResponse.updates.updatedRange.length - 1];
        //const rowNumber = `${SHEET_NAME}!F${sheetResponse.updates.updatedRange[sheetResponse.updates.updatedRange?.length - 1]}`;


        if (file) {
            const driveResponse = await googleApiService.uploadToDrive(
                file.path,
                file.originalname
            );

            await googleApiService.updateSheetWithDriveLink(
                SPREADSHEET_ID,
                SHEET_NAME,
                rowNumber,
                7,
                driveResponse.webViewLink
            );

            fs.unlinkSync(file.path);
        }

        res.status(200).json({ success: true, message: 'Message Sent Successfully.' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
const angularDistPath = path.join(__dirname, '../frontend/dist/frontend/browser');
app.use(express.static(angularDistPath));
app.get('/:splat', (req, res) => {
    console.log(`Request path: ${req.path}`);

    res.sendFile(path.join(angularDistPath, 'index.html'), (err) => {
        if (err) {
            console.log('Error sending index.html:', err);
            res.status(500).send('Something went wrong');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});