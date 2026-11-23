export type ModuloId = string;
export type CategoriaId = 'excel' | 'google-sheets' | 'vba' | 'apps-script' | 'javascript';

export interface Modulo {
  id: ModuloId;
  label: string;
  categoria: CategoriaId;
  path: string;
}

export interface Categoria {
  id: CategoriaId;
  label: string;
  folder: string;
  modulos: Modulo[];
}

export interface CatalogShape {
    categorias: Categoria[];
}

