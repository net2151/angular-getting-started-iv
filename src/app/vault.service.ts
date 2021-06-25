import { Injectable, NgZone } from '@angular/core';
import { Vault, Device, DeviceSecurityType, VaultType } from '@ionic-enterprise/identity-vault';

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

  vault: Vault;

  constructor(private ngZone: NgZone) {
    this.init();
  }

  async init() {
    this.vault = new Vault({
      key: 'io.ionic.getstartedivangular',
      type: 'SecureStorage',
      deviceSecurityType: 'SystemPasscode',
      lockAfterBackgrounded: 2000,
      shouldClearVaultAfterTooManyFailedAttempts: true,
      customPasscodeInvalidUnlockAttempts: 2,
      unlockVaultOnLoad: false,
    });

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
    await this.vault.setValue('sessionData', value);
    await this.checkVaultExists();
  }

  async restoreSession() {
    const value = await this.vault.getValue('sessionData');
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
    let type: VaultType;
    let deviceSecurityType: DeviceSecurityType;

    switch (this.state.lockType) {
      case 'Biometrics':
        type = 'DeviceSecurity';
        deviceSecurityType = 'Biometrics';
        break;

      case 'SystemPasscode':
        type = 'DeviceSecurity';
        deviceSecurityType = 'SystemPasscode';
        break;

      default:
        type = 'SecureStorage';
        deviceSecurityType = 'SystemPasscode';
    }
    this.vault.updateConfig({ ...this.vault.config, type, deviceSecurityType });
  }

  async clearVault() {
    await this.vault.clear();
    this.state.lockType = 'NoLocking';
    this.state.session = undefined;
    await this.checkVaultExists();
  }
}
