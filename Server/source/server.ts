import express, {Express} from 'express'
import morgan from 'morgan'
import * as dotenv from 'dotenv' 
import cors from 'cors';
import path from 'path'
import { ErrorMiddleware } from './middleware/error.middleware';
import { AppRoutes } from './routes/routes';

const rootDir = __dirname;

const app: Express=express()

// Acceder a la configuracion del archivo .env
dotenv.config();

// Inicializar estrategias Passport despues de cargar variables de entorno
const passport = require('./config/passport').default;
app.use(passport.initialize());
// Puerto que escucha por defecto 3000 o definido .env
const port = process.env.PORT || 3000;
// Middleware CORS para aceptar llamadas en el servidor
const normalizeOrigin = (origin: string) => origin.trim().replace(/\/$/, '');

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  'http://localhost:4200,https://joyohyd-portfolio-app.onrender.com'
)
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

app.disable('x-powered-by');

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite herramientas sin origin (Postman/curl) y el frontend configurado
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    optionsSuccessStatus: 204,
  })
);
// Middleware para loggear las llamadas al servidor
app.use(morgan('dev'));

// Middleware para gestionar Requests y Response json
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

//---- Registro de rutas ----
app.use(AppRoutes.routes)

//Gestión de errores middleware
app.use(ErrorMiddleware.handleError);

//Acceso a las imágenes
app.use("/images",express.static(
  path.join(path.resolve(),"assets/uploads")))



app.listen(port, () => {
  console.log(`http://localhost:${port}`);
  console.log('Presione CTRL-C para deternerlo\n');
 });
