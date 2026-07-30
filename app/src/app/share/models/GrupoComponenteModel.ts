import { ComponenteModel } from './ComponenteModel';

export interface GrupoComponenteModel {
    id: number;
    nombre: string;
    componentes: ComponenteModel[];
}