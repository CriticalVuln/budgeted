import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.resolve(__dirname, 'data/db.json');

app.use(cors());
app.use(express.json());

// Get all data
app.get('/api/data', (req, res) => {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return res.status(404).json({ error: 'Database file not found' });
        }
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// Update data (merge)
app.post('/api/data', (req, res) => {
    try {
        const incomingData = req.body;
        let existingData = {};

        if (fs.existsSync(DB_PATH)) {
            existingData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        }

        const newData = { ...existingData, ...incomingData };
        fs.writeFileSync(DB_PATH, JSON.stringify(newData, null, 2), 'utf-8');

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
