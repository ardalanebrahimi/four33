import { Component } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mic, statsChart, person } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="record">
          <ion-icon name="mic"></ion-icon>
          <ion-label>Record</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="explore">
          <ion-icon name="stats-chart"></ion-icon>
          <ion-label>Explore</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="you">
          <ion-icon name="person"></ion-icon>
          <ion-label>You</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: [
    `
      ion-tab-bar {
        --background: #000;
        border-top: 1px solid #222;
      }
    `,
  ],
})
export class TabsComponent {
  constructor() {
    addIcons({ mic, statsChart, person });
  }
}
