import { Component, inject, Input, input, OnInit, signal } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon, IonFooter } from "@ionic/angular/standalone";
import { HelperService } from 'src/app/services/helper.service';

@Component({
  selector: 'app-web-modal',
  templateUrl: './web-modal.component.html',
  styleUrls: ['./web-modal.component.scss'],
  imports: [IonFooter, IonToolbar, IonContent, IonButton,IonIcon,IonHeader,IonButtons,IonButton,IonTitle]
})
export class WebModalComponent implements OnInit {

  @Input() data!:webModal

  helper = inject(HelperService)
  sanitizedUrl = signal<SafeResourceUrl>('') // Store the sanitized URL

  constructor() { }

  ngOnInit() { }

  ionViewWillEnter() {
    this.sanitizedUrl.set(this.helper.sanitize.bypassSecurityTrustResourceUrl(this.data.url))
  }

  dismiss() {
    this.helper.modalController.dismiss();
  }
  
}
export interface webModal{
  url:string
  title:string
}
