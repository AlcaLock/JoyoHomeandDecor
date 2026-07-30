import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  standalone: false,
  styleUrls: ['./footer.css']
})
export class Footer {
  today: Date = new Date();
  currentLanguage: string;
  dateFormat: string = 'dd/MM/yyyy'; // predeterminado español

  constructor(public translate: TranslateService) {
    const savedLang = localStorage.getItem('userLanguage');
    const defaultLang = savedLang || 'es';

    translate.setDefaultLang('es');
    translate.use(defaultLang);
    this.currentLanguage = defaultLang;

    this.updateDateFormat(defaultLang);
  }

  changeLanguage(lang: string): void {
    this.translate.use(lang);
    this.currentLanguage = lang;
    localStorage.setItem('userLanguage', lang);

    this.updateDateFormat(lang);
  }

  private updateDateFormat(lang: string) {
    this.dateFormat = lang === 'es' ? 'dd/MM/yyyy' : 'MM/dd/yyyy';
  }
}
