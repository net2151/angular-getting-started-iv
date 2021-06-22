# Getting Started with Identity Vault in `@ionic/angular`

This application walks through the basic setup and use of Ionic's Identity Vault in an `@ionic/angular` application. Rather than connecting to a back end service and storing the session data this application will just store information that you type in and tell it to store. Almost all of the work done here will be concentrated on a couple of files:

- `src/app/vault.service.ts`: a service that abstracts the logic associated with using Identity Vault. This methods and properties here model what might be done in a real application.
- `src/app/home/home.page.ts`: the main view will have several form controls that allow the user to manipulate the vault. An application would not typically do this. Rather, it would call the methods from `vault-service.ts` within various workflows. In this "getting started" demo application, however, this allows us to easily play around with the various APIs to see how they behave.

## Generate the Application

The first thing we need to do is generate our application.

```bash
ionic start getting-started-iv-angular blank --type=angular --capacitor
```

Now that the application has been generated, let's configure the native platforms.

Open the `capacitor.config.ts` file and change the `appId` to something unique like `io.ionic.gettingstartedivangular`:

```TypeScript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.gettingstartedivangular',
  appName: 'getting-started-iv-angular',
  webDir: 'www',
  bundledWebRuntime: false
};

export default config;
```

Next, build the application, then install and create the platforms:

```bash
npm run build
ionic cap add android
ionic cap add ios
```

Finally, in order to ensure that a `cap copy` happens with each build, add it to the build script in the `package.json` file as such:

```JSON
  "scripts": {
    "build": "ng build && cap copy",
    ...
  },
```

## Install Identity Vault

In order to install Identity Vault, you will need to use `ionic enterprise register` in order to register your product key. This will create a `.npmrc` file containing the product key. If you have already performed that step for your production application, you can just copy the `.npmrc` file from your production project. Since this application is just for learning purposes, you don't need to obtain another key. You can then install Identity Vault.

```bash
npm install @ionic-enterprise/identity-vault
```

## Create the Vault

In this step, we will create the vault and test it by storing an retrieving a value from it. We will call this value the `session` since storing session data in a vault is the most common use case. However, it is certainly not the _only_ use case.

First, create a service named vault.

```bash
ionic generate service vault
```

This will create a file named `src/app/vault.service.ts`. Within this file, we will define the vault as well as create a composition function that abstracts all of the logic we need in order to interact with the vault.

```TypeScript
import { Injectable } from '@angular/core';
import { Vault, IdentityVaultConfig } from '@ionic-enterprise/identity-vault';

export interface VaultServiceState {
  session: string;  
}

@Injectable({
  providedIn: 'root'
})
export class VaultService {
  public state: VaultServiceState = {
    session: ''    
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

  constructor() {
    this.init();
  }

  async init() {
    this.vault = new Vault(this.config);
  }

  async setSession(value: string): Promise<void> {
    this.state.session = value;
    await this.vault.setValue(this.key, value);
  }

  async restoreSession() {
    const value = await this.vault.getValue(this.key);
    this.state.session = value;
  }
}

```

Let's look at this file section by section. The first thing we do is define a configuration for our vault. The `key` gives the vault a name. The other properties provide a default behavior for our vault, and as we shall see later, can be changed as we use the vault.

```TypeScript
  config: IdentityVaultConfig = {
    key: 'io.ionic.getstartedivangular',
    type: 'SecureStorage',
    deviceSecurityType: 'SystemPasscode',
    lockAfterBackgrounded: 2000,
    shouldClearVaultAfterTooManyFailedAttempts: true,
    customPasscodeInvalidUnlockAttempts: 2,
    unlockVaultOnLoad: false,
  };
```

Next, we will define a key for storing data. All data within the vault is stored as a key-value pair, and you can store multiple key-value pairs within a single vault. We will also create the vault as well as an object that reflects that state of the vault so that the current `session` data can be displayed.

```TypeScript
  public state: VaultServiceState = {
    session: ''    
  };
  key = 'sessionData';

  vault: Vault;

  constructor() {
    this.init();
  }

  async init() {
    this.vault = new Vault(this.config);
  }
```

**Note:** Constructors cannot contain the await keyword. To get around this we asynchronously calling the init method. At the moment this method does not have asynchronous methods but it soon will.

Finally, we define methods for `setSession` and `restoreSession`:

```TypeScript
  async setSession(value: string): Promise<void> {
    this.state.session = value;
    await this.vault.setValue(this.key, value);
  }

  async restoreSession() {
    const value = await this.vault.getValue(this.key);
    this.state.session = value;
  }
```

**Note:** rather than create define functions such as `setSession()` and `restoreSession()`, we _could_ expose the `vault` from service and use its API directly in the rest of the application. However, that would expose the rest of the application to potential API changes as well as potentially result in duplicated code. In my opinion, it is a much better option to encapsulate an interface for Identity Vault to the rest of the application. This makes the code more maintainable and easier to debug.

Now that we have the vault in place, let's switch over to `HomePage` component and implement some simple interactions with the vault. Here is a snapshot of what we will change:

1. replace the "container" `div` with a list of form controls
1. add a `setup()` function
1. remove the existing styling

When we are done, `src/app/home/home.page.html` will look like:

```HTML
<ion-header [translucent]="true">
  <ion-toolbar>
    <ion-title>
      Blank
    </ion-title>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true">
  <ion-header collapse="condense">
    <ion-toolbar>
      <ion-title size="large">Blank</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-list>
    <ion-item>
      <ion-label position="floating">Enter the "session" data</ion-label>
      <ion-input [(ngModel)]="state.session"></ion-input>
    </ion-item>

    <ion-item>
      <ion-label>
        <ion-button expand="block" (click)="setSession(state.session)">Set Session Data</ion-button>
      </ion-label>
    </ion-item>

    <ion-item>
      <ion-label>
        <ion-button expand="block" (click)="restoreSession()">Restore Session Data</ion-button>
      </ion-label>
    </ion-item>

    <ion-item>
      <ion-label>
        <div>Session Data: {{ state.session }}</div>
      </ion-label>
    </ion-item>
  </ion-list>
</ion-content>
```

`src/app/home/home.page.ts` will look like:

```TypeScript
import { Component } from '@angular/core';
import { VaultService, VaultServiceState } from '../vault.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  public state: VaultServiceState;

  constructor(private vaultService: VaultService) {
    this.state = vaultService.state;
  }

  async setSession(data: string) {
    await this.vaultService.setSession(data);
  }

  async restoreSession() {
    await this.vaultService.restoreSession();
  }
}
```

**Notes:**

1. As we continue with this tutorial, we will just provide the new markup or code that is required. Be sure to add the correct TypeScript imports as you go.

## Locking and Unlocking the Vault

Now that we are storing data in the vault, it would be helpful to lock and unlock that data. The vault will automatically lock after `lockAfterBackgrounded` milliseconds of the application being in the background. We can also lock the vault manually if we so desire.

Add the following code to `vault.service.ts`:

```TypeScript
  async lockVault() {
    await this.vault.lock();
  }

  async unlockVault() {
    await this.vault.unlock();
  }
```

We can then add a couple of buttons to `home.page.html`:

```html
    <ion-item>
      <ion-label>
        <ion-button expand="block" (click)="lockVault()">Lock Vault</ion-button>
      </ion-label>
    </ion-item>
    
    <ion-item>
      <ion-label>
        <ion-button expand="block" (click)="unlockVault()">Unlock Vault</ion-button>
      </ion-label>
    </ion-item>
```

and in `home.page.ts`:
```TypeScript
  lockVault() {
    this.vaultService.lockVault();
  }

  unlockVault() {
    this.vaultService.unlockVault();
  }
```

We can now lock and unlock the vault, though in our current case we cannot really tell. Our application should react in some way when the vault is locked. For example, we may want to clear specific data from memory. We may also wish to redirect to a page that will only allow the user to proceed if they unlock the vault. In our case, we will just clear the `session` and have a flag that we can use to visually indicate if the vault is locked or not. We can do that by using the vault's `onLock` event.

Add the following code to `src/vault.service.ts`:

```TypeScript
...
  public state: VaultServiceState = {
    session: '',
    isLocked: false,
  };

...  

  async init() {
    this.vault = new Vault(this.config);
    this.vault.onLock(() => {
      this.state.isLocked = true;
      this.state.session = undefined;
    });

    this.vault.onUnlock(() => {
      this.state.isLocked = false;
    });
  }
```

Then update `home.page.html` to display the `vaultIsLocked` value along with the session.

```html
    <ion-item>
      <ion-label>
        <div>Session Data: {{ state.session }}</div>
        <div>Vault is locked: {{ state.isLocked }}</div>
      </ion-label>
    </ion-item>
```

Build and run the application now. When the user clicks the "Lock Vault" button, the "Session Data" will be cleared out and the "Vault is Locked" will show as false. Clicking "Unlock Vault" will cause "Vault is Locked" to show as true again. Notice as well that you can lock the vault, but then also unlock it and get the session data base by clicking "Restore Session Data".

In that latter case, you didn't have to do anything to unlock the vault. That is because we are not using a type of vault that actually locks. As a matter of fact, with the `SecureStorage` type of vault, the vault also will not automatically lock while the application is in the background.

In a couple of sections, we will explore on expanding this further by using different vault types. First, though, we will begin exploring the `Device` API.

## The `Device` API

Identity Vault allows you to have multiple vaults within your application. However, there are some capabilities that Identity Vault allows you to control that are applicable to the device that the application is running on rather than being applicable to any given vault. For these items, we will use Identity Vault's `Device` API.

One such item is the "privacy screen." When an application is put into the background, the default behavior is for the OS to take a screenshot of the current page and display that as the user scrolls through the open applications. However, if your application displays sensitive information, you may not want that information displayed at such a time, so another option is to display the splash screen (on iOS) or a plain rectangle (on Android) instead of the screenshot. This is often referred to as a "privacy screen."

We will use the `Device.isHideScreenOnBackgroundEnabled()` method to determine if our application will currently display the privacy screen or not. We will then use the `Device.setHideScreenOnBackground()` method to control whether it is displayed or not. Finally, we will hook that all up to a checkbox in the UI to allow the user to manipulate the value at run time.

All of the following code applies to the `src/app/vault.service.ts` file.

First, import the `Device` API:

```TypeScript
import { Device } from '@ionic-enterprise/identity-vault';
```

Then add the following code to the `setup()` function:

```TypeScript
  public state: VaultServiceState = {
    session: '',
    isLocked: false,
    privacyScreen: false
  };

...

  async init() {
...
    this.state.privacyScreen = await Device.isHideScreenOnBackgroundEnabled();
  ...

  setPrivacyScreen(enabled: boolean) {
    Device.setHideScreenOnBackground(enabled);
    this.state.privacyScreen = enabled;
  }
```

We can add the checkbox to `home.page.html`:

```html
    <ion-item>
      <ion-label>Use Privacy Screen</ion-label>
      <ion-checkbox [(ngModel)]="state.privacyScreen" (ionChange)="setPrivacyScreen()"></ion-checkbox>
    </ion-item>
</ion-item>
```
and the setPrivacyScreen method to `home.page.ts`:
```typescript
  setPrivacyScreen() {
    this.vaultService.setPrivacyScreen(this.state.privacyScreen);
  }
```

Build the app and play around with changing the check box and putting the app in the background. In most applications, you would set this value on startup.

## Using Different Vault Types

The mechanism used to unlock the vault is determined by a combination of the `type` and the `deviceSecurityType` configuration settings. The type can be any of the following:

- `SecureStorage`: Securely store the data in the keychain, but do not lock it.
- `DeviceSecurity`: When the vault is locked, it needs to be unlocked via a mechanism provided by the device.
- `CustomPasscode`: When the vault is locked, it needs to be unlocked via a custom method provided by the application. This is typically done in the form of a custom PIN dialog.
- `InMemory`: The data is never persisted. As a result, if the application is locked or restarted, the data is gone.

In addition to these types, if `DeviceSecurity` is used, it is further refined by the `deviceSecurityType`, which can be any of the following values:

- `Biometrics`: Use the biometric authentication type specified by the device.
- `SystemPasscode`: Use the system passcode entry screen.
- `Both`: Use `Biometrics` with the `SystemPasscode` as a backup when `Biometrics` fails.

We specified `SecureStorage` when we set up the vault:

```TypeScript
const config: IdentityVaultConfig = {
  key: 'io.ionic.getstartedivangular',
  type: 'SecureStorage',
  deviceSecurityType: 'SystemPasscode',
  lockAfterBackgrounded: 2000,
  shouldClearVaultAfterTooManyFailedAttempts: true,
  customPasscodeInvalidUnlockAttempts: 2,
  unlockVaultOnLoad: false,
};
```

However, we can use the vault's `updateConfig()` method to change this at run time.

In our application,we don't want to use every possible combination. Rather than exposing the raw `type` and `deviceSecurityType` values to the rest of the application, let's define the types of authentication we _do_ want to support:

`NoLocking`: We want to store the session data securely, but never lock it.
`Biometrics`: We want to use the device's biometric mechanism to unlock the vault when it is locked.
`SystemPasscode`: We want to use the device's passcode screen (typically a PIN or pattern) to unlock the vault when it is locked.

Now we have the types defined within the domain of our application. The only code within our application that will have to worry about what this means within the context of the Identity Vault configuration is our `vault.service.ts` service.

First let's add another property to VaultServiceState.

```TypeScript
export interface VaultServiceState {
  session: string;
  isLocked: boolean;
  privacyScreen: boolean;
  lockType: 'NoLocking' | 'Biometrics' | 'SystemPasscode'
}
```

Then set the initial state in `vault.service.ts`:
```TypeScript
  public state: VaultServiceState = {
    session: '',
    isLocked: false,
    privacyScreen: false,
    lockType: 'NoLocking'
  };
```

Next, we will define a method called `setLockType` in `vault.service.ts`:

```TypeScript
  setLockType() {
    switch(this.state.lockType) {
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
```


We can now add a group of radio buttons to our `Home` page component:

```html
    <ion-item>
      <ion-radio-group [ngModel]="state.lockType">
        <ion-list-header>
          <ion-label> Vault Locking Mechanism </ion-label>
        </ion-list-header>
    
        <ion-item>
          <ion-label>Do Not Lock</ion-label>
          <ion-radio value="NoLocking"></ion-radio>
        </ion-item>
    
        <ion-item>
          <ion-label>Use Biometrics</ion-label>
          <ion-radio [disabled]="!state.canUseBiometrics" value="Biometrics"></ion-radio>
        </ion-item>
    
        <ion-item>
          <ion-label>Use System Passcode</ion-label>
          <ion-radio value="SystemPasscode"></ion-radio>
        </ion-item>
      </ion-radio-group>
    </ion-item>
```

Notice for the "Use Biometric" radio button, we are disabling it based on a `canUseBiometrics` value. We will need to code for that.

Add a property to the `VaultServiceState` interface:
```TypeScript
  canUseBiometrics: boolean;
}
```

Initialize `canUseBiometrics` in the `init` method of `VaultService`:

```TypeScript
    this.state.canUseBiometrics = await Device.isBiometricsEnabled();
```

Notice that we are using the `Device` API again here to determine if biometrics are both supported by the current device as well as enabled by the user. We don't want users to be able to choose that option unless the biometrics are properly set up on the device.

One final bit of housekeeping before building and running the application is that if you are using an iOS device you need to open the `Info.plist` file and add the `NSFaceIDUsageDescription` key with a value like "Use Face ID to access sensitive information."

Now when you run the app, you can choose a different locking mechanism and it should be used whenever you need to unlock the vault.

## Clear the Vault

One last method we will explore before we leave is the `clear()` method. The `clear()` API will remove all items from the vault and then remove the vault itself.

To show this in action, let's add a `vaultExists` property to `VaultServiceState`:

```TypeScript
export interface VaultServiceState {
  session: string;
  isLocked: boolean;
  privacyScreen: boolean;
  lockType: 'NoLocking' | 'Biometrics' | 'SystemPasscode';
  canUseBiometrics: boolean;
  vaultExists: boolean;
}
```

Let's then add a `clearVault()` function within `VaultService`. This function will call `vault.clear()`, reset the lockType to the default of `NoLocking`, and clear our session data cache.

```typescript
  async clearVault() {
    await this.vault.clear();
    this.state.lockType = 'NoLocking';
    this.state.session = undefined;
  }
```

In order to see whether the vault exists we need to create a method in `VaultService`:
```typescript
 async checkVaultExists(): Promise<void> {
    this.state.vaultExists = await this.vault.doesVaultExist();
  }
```

Lets call this method in the `init` method, in the `clearVault` method and in the `setSession` method:
```typescript
    await this.checkVaultExists();
```

With that in place, open the `home.page.html` file and add a button to clear the vault by calling `clearVault()` on click:
```html
    <ion-item>
      <ion-label>
        <ion-button expand="block" (click)="clearVault()">Clear Vault</ion-button>
      </ion-label>
    </ion-item>
```

Add a `div` for displaying `vaultExists`:
```html
<div>Vault exists: {{ state.vaultExists }}</div>
```

Then in `home.page.ts`:
```typescript
  clearVault() {
    this.vaultService.clearVault();
  }
```

## Conclusion

This walk-through has implemented using Identity Vault in a very manual manner, allowing for a lot of user interaction with the vault. In an real application, functionality would instead be a part of several programmatic workflows.

At this point, you should have a good idea of how Identity Vault works. There is still more functionality that can be implemented. Be sure to check out our HowTo documents to determine how to facilitate specific areas of functionality within your application.
