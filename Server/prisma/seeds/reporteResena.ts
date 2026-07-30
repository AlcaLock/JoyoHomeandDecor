import { EstadoReporteResena } from "../../generated/prisma";


export const reporteResena = [
  { resenaId: 1, usuarioReportaId: 3, motivo: 'Contenido inapropiado', estado: EstadoReporteResena.PENDIENTE },
  { resenaId: 2, usuarioReportaId: 2, motivo: 'Spam', estado: EstadoReporteResena.PENDIENTE },
];