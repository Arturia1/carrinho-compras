import express from 'express';
import cors from 'cors';
import routes from './routes'; // <--- Verifique se este import está correto

const app = express();

app.use(cors());
app.use(express.json());
app.use(routes); // <--- ESTA LINHA É A MAIS IMPORTANTE! Ela registra as rotas no Express.

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});