import { Injectable, NgZone } from '@angular/core';
import { Vault, IdentityVaultConfig, Device } from '@ionic-enterprise/identity-vault';

export interface VaultServiceState {
  session: string;
  isLocked: boolean;
  privacyScreen: boolean;
  lockType: 'NoLocking' | 'Biometrics' | 'SystemPasscode';
  canUseBiometrics: boolean;
  vaultExists: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VaultService {
  public state: VaultServiceState = {
    session: '',
    isLocked: false,
    privacyScreen: false,
    lockType: 'NoLocking',
    canUseBiometrics: false,
    vaultExists: false
  };

  key = 'sessionData';

  config: IdentityVaultConfig = {
    key: 'io.ionic.getstartedivangular',
    type: 'SecureStorage',
    deviceSecurityType: 'SystemPasscode',
    lockAfterBackgrounded: 2000,
    shouldClearVaultAfterTooManyFailedAttempts: true,
    customPasscodeInvalidUnlockAttempts: 2,
    unlockVaultOnLoad: false,
  };
  vault: Vault;

  constructor(private ngZone: NgZone) {
    this.init();
  }

  async init() {
    this.vault = new Vault(this.config);
    this.vault.onLock(() => {
      this.ngZone.run(() => {
        this.state.isLocked = true;
        this.state.session = undefined;
      });
    });

    this.vault.onUnlock(() => {
      this.ngZone.run(() => {
        this.state.isLocked = false;    
      });
    });

    this.state.privacyScreen = await Device.isHideScreenOnBackgroundEnabled();
    this.state.canUseBiometrics = await Device.isBiometricsEnabled();
    await this.checkVaultExists();
  }

  async checkVaultExists(): Promise<void> {
    this.state.vaultExists = await this.vault.doesVaultExist();
  }

  async setSession(value: string): Promise<void> {
    this.state.session = value;
    await this.vault.setValue(this.key, value);
    await this.checkVaultExists();
  }

  async restoreSession() {
    const value = await this.vault.getValue(this.key);
    this.state.session = value;
  }

  async lockVault() {
    await this.vault.lock();
  }

  async unlockVault() {
    await this.vault.unlock();
  }

  setPrivacyScreen(enabled: boolean) {
    Device.setHideScreenOnBackground(enabled);
    this.state.privacyScreen = enabled;
  }

  setLockType() {
    switch (this.state.lockType) {
      case 'Biometrics':
        this.config.type = 'DeviceSecurity';
        this.config.deviceSecurityType = 'Biometrics';
        break;

      case 'SystemPasscode':
        this.config.type = 'DeviceSecurity';
        this.config.deviceSecurityType = 'SystemPasscode';
        break;

      default:
        this.config.type = 'SecureStorage';
        this.config.deviceSecurityType = 'SystemPasscode';
    }
    this.vault.updateConfig(this.config);
  }

  async clearVault() {
    await this.vault.clear();
    this.state.lockType = 'NoLocking';
    this.state.session = undefined;
    await this.checkVaultExists();
  }
}
