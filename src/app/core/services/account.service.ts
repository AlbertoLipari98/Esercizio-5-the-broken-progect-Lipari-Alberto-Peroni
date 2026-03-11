import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AccountRepository } from '../repositories/account.repository';
import { AccountSummary } from '../models/account.model';
import { ACCOUNT_API_CONFIG } from '../config/account-api.config';

/**
 * Servizio principale per la gestione degli account.
 *
 * providedIn: 'root' → singleton nel root injector.
 */
@Injectable()
export class AccountService {
  private readonly repo = inject(AccountRepository);
  readonly config = inject(ACCOUNT_API_CONFIG);

  constructor() {
    console.log(
      `%c[AccountService] istanziato per area: "${this.config.area}" | baseUrl: ${this.config.baseUrl}`,
      'color: #805ad5; font-weight: bold;',
      
    );
  }

  getSummary(): Observable<AccountSummary> {
    return this.repo.getSummary();
  }
}
