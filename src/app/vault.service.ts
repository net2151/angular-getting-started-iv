import { Injectable } from '@angular/core';
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
  vault: Vault = new Vault(this.config);

  constructor() {
    this.vault.onLock = () => {
      this.state.isLocked = true;
      this.state.session = undefined;
    };

    this.vault.onUnlock = () => {
      this.state.isLocked = false;
    };

    Device.isHideScreenOnBackgroundEnabled.then((value) => {
      this.state.privacyScreen = value;
    });

    Device.isBiometricsEnabled().then(enabled => {
      this.state.canUseBiometrics = enabled;
    });

    this.checkVaultExists();
  }

  async checkVaultExists(): Promise<void> {
    await this.vault.doesVaultExist();
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

  lockVault() {
    this.vault.lock();
  }

  unlockVault() {
    this.vault.unlock();
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
