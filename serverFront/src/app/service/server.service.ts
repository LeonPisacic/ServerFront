import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Status } from '../enum/status.enum';
import { CustomResponse } from '../interface/custom-response';
import { Server } from '../interface/server';


@Injectable({
  providedIn: 'root'
})

export class ServerService {

  private readonly apiUrl: any = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse): Observable<never> { /* type never indicates the values that will never occur. */
    console.log(error)
    return throwError(`An error occurred - Error code ${error.status}`);
  }

  //deklariranje varijable koja koristi HTTP get zahtjev, a kao response vraca listu svih postojećih servera iz baze podataka
  servers$ = <Observable<CustomResponse>>this.http.get<CustomResponse>(`${this.apiUrl}/server/list`).pipe(
    tap(console.log),
    catchError(this.handleError)  //ukoliko dođe do pogreške prilikom HTTP zahtjeva baci error
  );

  //deklariraje varijable koja koristi HTTP post zahtjev, odnosno stvara i zapisuje novokreirani server u bazu podataka 
  save$ = (server: Server) => <Observable<CustomResponse>>this.http.post<CustomResponse>(`${this.apiUrl}/server/save`, server).pipe(
    tap(console.log),
    catchError(this.handleError) //ukoliko dođe do pogreške prilikom HTTP zahtjeva baci error
  );

  //deklariranje varijable koja koristi HTTP get zahtjev, služi za pinganje postojećih servera, kao response vraca objekt uspjeha/neuspjeha
  ping$ = (ipAdress: string) => <Observable<CustomResponse>>this.http.get<CustomResponse>(`${this.apiUrl}/server/ping/${ipAdress}`).pipe(
    tap(console.log),
    catchError(this.handleError)  //ukoliko dođe do pogreške prilikom HTTP zahtjeva baci error
  );

  //deklariranje varijable koja koristi HTTP delete zahtjev, koristi se za brisanje postojećih servera
  delete$ = (serverId: number) => <Observable<CustomResponse>>this.http.delete<CustomResponse>(`${this.apiUrl}/server/delete/ ${serverId}`).pipe(
    tap(console.log),
    catchError(this.handleError)  //ukoliko dođe do pogreške prilikom HTTP zahtjeva baci error
  );


  //dekleriranje varijable za filtriranje seervera po SERVER UP, SERVER DOWN ili ALL (default value)
  filter$ = (status: Status, response: CustomResponse) => <Observable<CustomResponse>>
    new Observable<CustomResponse>(
      suscriber => {
        suscriber.next(
          status === Status.ALL ? { ...response, message: `Servers filtered by ${status} status` } :
            /*The JavaScript spread operator (...) allows us to quickly copy all or part of an existing array or object into 
            another array or object, in this case they are all properties of interface 'CustomResponse' */
            {
              ...response,
              message: response.data.servers
                /*filtriraj ako je vrijendnost koju smo izabrali u 'selection-u' jednaka funckijsko-argumentnom statusu  */
                .filter(server => server.status === status).length > 0 ? `Servers filtered by  
        ${status === Status.SERVER_UP ? 'SERVER UP' /*ukoliko se pretražuju po SERVER_UP modificraj poruku u console (nepotrebno) */
                : 'SERVER DOWN'} status` : `No servers of ${status} found`,
              data: { //za property 'data' unutar response object-a navedi sve rezultate koji spadaju pod filtriranom severu (SERVER_UP ili SERVER_DOWN)
                servers: response.data.servers
                  .filter(server => server.status === status)
              }
            }
        );
        suscriber.complete();  // Complete the observable to indicate that it has finished emitting values.
      }
    )
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );
}
