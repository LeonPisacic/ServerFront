import { Server } from "./server";

export interface CustomResponse {
    timetamp: Date;
    statusCode: number;
    status: string;
    reason: string;
    message: string;
    developerMessage: string;
    data: { servers?: Server[], server?: Server }; /* Properti će biti ili niz tipova Server (array) ili pojedinačan tip Server */
}