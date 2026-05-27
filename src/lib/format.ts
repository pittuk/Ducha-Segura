/** Formatea un número como entero con separador de miles es-CL (ej. 229000 -> "229.000"). */
export const clp = (n: number): string => Number(n).toLocaleString('es-CL');
