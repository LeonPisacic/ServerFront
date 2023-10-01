import { DataState } from "../enum/data-state-enum";

export interface AppState<T> { /*ne zna se koji ce biti podatkovni tip, s toga se koristi 'T'  */
    dataState: DataState;
    appData?: T; /*podatkovni tip bit ce isti i kod slova 'T' */
    error?: string; /* '?' indicates optional property */
}