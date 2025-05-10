import app from './app';
import { config } from 'dotenv';

config();

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});