import { Component, OnInit } from '@angular/core';
import { ServerService } from './service/server.service';
import { BehaviorSubject, Observable, catchError, map, of, startWith } from 'rxjs';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { DataState } from './enum/data-state-enum';
import { Status } from './enum/status.enum';
import { NgForm } from '@angular/forms';
import { Server } from './interface/server';
import { NotifierService } from 'angular-notifier';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  appState$: Observable<AppState<CustomResponse>>
  readonly dataState = DataState;
  readonly Status = Status;
  private filterSubject = new BehaviorSubject<string>('');
  private dataSubject = new BehaviorSubject<CustomResponse>(null);
  private isLoading = new BehaviorSubject<boolean>(false);



  filterStatus$ = this.filterSubject.asObservable();
  isLoading$ = this.isLoading.asObservable();

  constructor(private serverService: ServerService) { }

  comeBack() {
    this.ngOnInit();
  }

  ngOnInit(): void {
    // Assign the result of the serverService.servers$ observable to the appState$ observable (returning all available servers).
    this.appState$ = this.serverService.servers$
      .pipe( //Operator .pipe() koristi se u RxJS-u kako bi se sastavili i primijenili niz operatora na observable (operatori: map,filter,tap...).
        map(response => {
          this.dataSubject.next(response); // notify any subscribers of dataSubject that a new value (response) is available
          return { dataState: DataState.LOADED_STATE, appData: { ...response, data: { servers: response.data.servers.reverse() } } } // Return an object with 'dataState' set to LOADED_STATE and 'appData' containing the response.
        }),
        startWith({ dataState: DataState.LOADED_STATE }), //Start with an initial value where 'dataState' is set to LOADED_STATE.
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  pingServer(ipAdress: string): void {
    this.filterSubject.next(ipAdress); // notify any subscribers of dataSubject that a new value (response) is available

    this.appState$ = this.serverService.ping$(encodeURIComponent(ipAdress))
      .pipe(
        map(response => {
          //variable which help us ping the server which we click on
          const index = this.dataSubject.value.data.servers.findIndex(server => server.id === response.data.server.id);

          this.dataSubject.value.data.servers[index] = response.data.server; //assing the value
          this.filterSubject.next(''); //stop showing the loading spinner, get variable value to the starting point  
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
          // Return an object indicating that the data is loaded with the updated appData.
        }),
        // Start with an initial state to show that data is loaded or loading.
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.filterSubject.next(''); // same thing
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  saveServer(serverForm: NgForm): void {
    this.isLoading.next(true); //setting the boolean value to the true to indicate that the is loading faze started

    this.appState$ = this.serverService.save$(serverForm.value as Server) //spremamo vrijednosti dobivene iz ngForm 'severForm'
      .pipe(
        map(response => {
          this.dataSubject.next( // notify any subscribers of dataSubject that a new value (response) is available
            { ...response, data: { servers: [response.data.server, ...this.dataSubject.value.data.servers] } }
          ); //modifiying object properties

          document.getElementById('closeModal').click(); //programatically close modal
          this.isLoading.next(false);
          serverForm.resetForm({ status: this.Status.SERVER_DOWN }); //setting the default status value of newly added servers
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
          // Return an object indicating that the data is loaded with the updated appData.
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.isLoading.next(false);
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  filterServers(status: Status): void {
    this.appState$ = this.serverService.filter$(status, this.dataSubject.value)
      //filtriramo servere po propertiima SERVER UP, SERVER DOWN or ALL 
      .pipe(
        map(response => {
          return { dataState: DataState.LOADED_STATE, appData: response };  // Map the response to indicate that the data is in a LOADED state with the updated response.
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }


  deleteServer(server: Server): void {

    this.appState$ = this.serverService.delete$(server.id)
      .pipe(
        map(response => {
          this.dataSubject.next(
            { ...response, data: { servers: this.dataSubject.value.data.servers.filter(Server => Server.id !== server.id) } }
          );
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
          // Return an object indicating that the data is loaded with the updated appData.
        }),
        // Start with an initial state to show that data is loaded or loading.
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  printReport(): void {

    let dataType = 'application/vnd.ms-excel.sheet.macroEnabled.12';
    let tableSelect = document.getElementById('servers');
    let tableHtml = tableSelect.outerHTML.replace(/ /g, '%20');
    let downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);
    downloadLink.href = 'data:' + dataType + ', ' + tableHtml;
    downloadLink.download = 'server-report.xls';
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // window.print(); //da umjesto printanja otvori windows prozor za isprintat file
  }

}
