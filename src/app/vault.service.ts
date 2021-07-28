import { Injectable, NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Vault, Device, DeviceSecurityType, VaultType, BrowserVault } from '@ionic-enterprise/identity-vault';

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

  vault: Vault | BrowserVault;

  constructor(private ngZone: NgZone) {
    this.init();
  }

  async init() {
    const config = {
      key: 'io.ionic.getstartedivangular',
      type: VaultType.SecureStorage,
      deviceSecurityType: DeviceSecurityType.SystemPasscode,
      lockAfterBackgrounded: 2000,
      shouldClearVaultAfterTooManyFailedAttempts: true,
      customPasscodeInvalidUnlockAttempts: 2,
      unlockVaultOnLoad: false,
    };

    this.vault = Capacitor.getPlatform() === 'web' ? new BrowserVault(config) : new Vault(config);    

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
        type = VaultType.DeviceSecurity;
        deviceSecurityType = DeviceSecurityType.Biometrics;
        break;

      case 'SystemPasscode':
        type = VaultType.DeviceSecurity;
        deviceSecurityType = DeviceSecurityType.SystemPasscode;
        break;

      default:
        type = VaultType.SecureStorage;
        deviceSecurityType = DeviceSecurityType.SystemPasscode;
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
