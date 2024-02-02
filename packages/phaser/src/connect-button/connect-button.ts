import {WalletConnector, Wallet, WalletApp} from '../../../common/interfaces';
import {Locale} from './interfaces';
import {Locales, Styles} from './types';
import {DropdownMenu, DropdownMenuItem} from './dropdown';
import {
  buttonDesign,
  locales,
  DARK_COPY,
  DARK_DISCONNECT,
  LIGHT_COPY,
  LIGHT_DISCONNECT
} from './consts';
import {hexToNumber, rawAddressToFriendly, smoothScale} from './utils';
import {loadIcons} from './icons';

interface HandleError {
  (error: Error | unknown): void;
}

export interface ConnectWalletButtonParams {
  /**
   * Light or dark mode.
   * @defaultValue light
   */
  style?: Styles;
  /**
   * Interface language.Check available `Locales` in the related type.
   * @defaultValue en
   */
  language?: Locales;
  /**
   * Which wallet app will be connected. Check `WalletApp` to see available options.
   * @defaultValue telegram-wallet
   */
  walletApp?: WalletApp;
  /**
   * Subscribe to wallet connect and disconnect events.
   * You can also use global `onWalletChange` method of `GameFi` instance instead.
   */
  onWalletChange?: (wallet: Wallet | null) => void;
  /**
   * Error handler function.
   * You can also use `try`/`catch` operator instead.
   */
  onError?: HandleError;
}

export class ConnectWalletButton extends Phaser.GameObjects.Container {
  buttonContainer: Phaser.GameObjects.Container;
  buttonBackground: Phaser.GameObjects.Graphics;
  buttonText: Phaser.GameObjects.Text;
  buttonIcon?: Phaser.GameObjects.Image;
  buttonWidth: number;
  buttonHeight: number;
  wallet: Wallet | null = null;
  params: ConnectWalletButtonParams;
  connectionSourceName: WalletApp;
  unsubscribeFromConnector: () => void;
  dropdownMenu?: DropdownMenu;
  locale: Locale;
  currentIcon: string;
  changeIconTimer: NodeJS.Timeout | number | null = null;
  private onError: HandleError;

  constructor(
    /**
     * TonConnectUI instance.
     */
    private readonly connector: WalletConnector,
    /**
     * UI scene the button will be added to.
     */
    scene: Phaser.Scene,
    /**
     * X coordinate for the button.
     */
    x: number = 0,
    /**
     * Y coordinate for the button.
     */
    y: number = 0,
    /**
     * Button related parameters. Check `ConnectWalletButtonParams` interface.
     */
    params: ConnectWalletButtonParams = {}
  ) {
    super(scene, x, y);
    this.params = params;
    this.connectionSourceName = params.walletApp || 'telegram-wallet';
    this.onError = this.params.onError
      ? this.params.onError
      : (error) => {
          throw error;
        };
    this.loadAssets(scene);

    const locale = locales[params.language ?? 'en'];
    this.locale = locale;
    const styleSchema = params.style === 'dark' ? buttonDesign.dark : buttonDesign.light;
    const backgroundColor =
      params.style === 'dark'
        ? hexToNumber(styleSchema.backgroundColor)
        : hexToNumber(styleSchema.backgroundColor);

    const btnCtr = new Phaser.GameObjects.Container(scene, 0, 0);

    const textObject = scene.add.text(
      buttonDesign.horizontalPadding + buttonDesign.icon.width,
      buttonDesign.verticalPadding,
      locale.connectWallet,
      {
        color: styleSchema.fontColor,
        fontFamily: buttonDesign.fontFamily,
        fontSize: buttonDesign.fontSize
      }
    );
    this.buttonText = textObject;

    const textWidth = textObject.width;
    const textHeight = textObject.height;
    const buttonWidth =
      textWidth +
      buttonDesign.horizontalPadding * 2 +
      buttonDesign.icon.width +
      buttonDesign.icon.horizontalPadding;
    const buttonHeight = textHeight + buttonDesign.verticalPadding * 2;

    this.buttonWidth = buttonWidth;
    this.buttonHeight = buttonHeight;

    this.currentIcon = styleSchema.icons.diamond;

    const button = scene.add.graphics({
      x: 0,
      y: 0,
      fillStyle: {
        color: this.wallet == null ? hexToNumber(styleSchema.backgroundColor) : backgroundColor
      },
      lineStyle: {width: buttonDesign.borderWidth, color: hexToNumber(styleSchema.borderColor)}
    });
    button.fillRoundedRect(0, 0, buttonWidth, buttonHeight, buttonDesign.borderRadius);
    button.strokeRoundedRect(0, 0, buttonWidth, buttonHeight, buttonDesign.borderRadius);
    this.buttonBackground = button;

    btnCtr.on('pointerover', () => {
      scene.game.canvas.style.cursor = 'pointer';
      if (this.wallet != null) {
        this.repaintButtonBackground(styleSchema.backgroundColorHover, styleSchema.borderColor);
      }
      smoothScale(scene.tweens, btnCtr, 1.02, 125);
    });
    btnCtr.on('pointerout', () => {
      scene.game.canvas.style.cursor = 'default';
      if (this.wallet != null) {
        this.repaintButtonBackground(styleSchema.backgroundColor, styleSchema.borderColor);
      }
      smoothScale(scene.tweens, btnCtr, 1, 125);
    });
    btnCtr.on('pointerdown', () => {
      smoothScale(scene.tweens, btnCtr, 0.98, 125);
    });
    btnCtr.on('pointerup', () => {
      smoothScale(scene.tweens, btnCtr, 1.02, 125);
    });

    this.buttonContainer = btnCtr;

    textObject.setText('...');

    const walletChanged = (wallet: Wallet | null) => {
      this.wallet = wallet;

      btnCtr.off('pointerdown', this.connectWallet);
      btnCtr.off('pointerdown', this.toggleDropdownMenu);

      if (wallet) {
        textObject.setText(rawAddressToFriendly(wallet.account.address, true));
        btnCtr.on('pointerdown', this.toggleDropdownMenu);

        // todo handle style change outside
        this.setSchema(styleSchema);
      } else {
        textObject.setText(locale.connectWallet);
        btnCtr.on('pointerdown', this.connectWallet);

        this.setSchema(buttonDesign.default);
      }

      if (this.params.onWalletChange) {
        this.params.onWalletChange(wallet);
      }
    };

    this.unsubscribeFromConnector = this.connector.onStatusChange(walletChanged);
    this.connector.connectionRestored.then((connected) => {
      if (!connected) {
        walletChanged(null);
      }

      this.enable();
    });

    this.setSize(this.buttonWidth, this.buttonHeight);
  }

  private async loadAssets(scene: Phaser.Scene): Promise<void> {
    await loadIcons(scene.textures);

    const icon = scene.add.image(
      buttonDesign.horizontalPadding -
        buttonDesign.icon.horizontalPadding +
        buttonDesign.icon.width * 0.5,
      this.buttonHeight * 0.5,
      this.currentIcon
    );
    this.buttonIcon = icon;

    this.dropdownMenu = new DropdownMenu(
      scene,
      0,
      this.buttonHeight + buttonDesign.dropDown.topMargin,
      {
        style: this.params.style ?? 'light',
        items: [
          {
            icon: this.params.style === 'dark' ? DARK_COPY : LIGHT_COPY,
            text: this.locale.copyAddress,
            onClick: this.copyAddress
          },
          {
            icon: this.params.style === 'dark' ? DARK_DISCONNECT : LIGHT_DISCONNECT,
            text: this.locale.disconnectWallet,
            onClick: () => {
              this.toggleDropdownMenu();
              this.disconnectWallet();
            }
          }
        ]
      }
    );
    this.dropdownMenu.setVisible(false);

    this.buttonContainer.add([this.buttonBackground, this.buttonIcon, this.buttonText]);
    this.add([this.buttonContainer, this.dropdownMenu]);
    scene.add.existing(this);
  }

  private changeIcon(icon: string) {
    this.cancelIconChange();

    if (this.buttonIcon) {
      this.currentIcon = icon;
      this.buttonIcon.setTexture(icon);
    } else {
      this.changeIconTimer = setTimeout(() => {
        this.changeIcon(icon);
      }, 4);
    }
  }

  private cancelIconChange() {
    if (this.changeIconTimer != null) {
      clearTimeout(this.changeIconTimer);
      this.changeIconTimer = null;
    }
  }

  private connectWallet = async () => {
    try {
      this.disable();
      await this.connector.openSingleWalletModal(this.connectionSourceName);
    } catch (error) {
      this.onError(error);
    } finally {
      this.enable();
    }
  };

  private disconnectWallet = async () => {
    try {
      this.disable();
      await this.connector.disconnect();
    } catch (error) {
      this.onError(error);
    } finally {
      this.enable();
    }
  };

  private copyAddress = async (item: DropdownMenuItem) => {
    if (this.wallet == null) {
      return;
    }

    try {
      await navigator.clipboard.writeText(rawAddressToFriendly(this.wallet.account.address));
      const oldText = item.text.text;
      item.text.setText(this.locale.addressCopied);
      setTimeout(() => {
        try {
          item.text.setText(oldText);
        } catch (error) {
          // ignore in case the object was destroyed by leaving the scene
        }
      }, 500);
    } catch (error) {
      this.onError(error);
    }
  };

  private disable() {
    this.buttonContainer.setInteractive(false);
  }

  private enable() {
    this.buttonContainer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, this.buttonWidth, this.buttonHeight),
      Phaser.Geom.Rectangle.Contains
    );
  }

  private toggleDropdownMenu = () => {
    if (this.dropdownMenu == null) {
      return;
    }

    this.dropdownMenu.setVisible(!this.dropdownMenu.visible);
  };

  private setSchema(schema: typeof buttonDesign.dark) {
    this.repaintButtonBackground(schema.backgroundColor, schema.borderColor);
    this.changeIcon(schema.icons.diamond);
    this.buttonText.setColor(schema.fontColor);
  }

  private repaintButtonBackground(backgroundColor: string, borderColor: string) {
    this.buttonBackground.clear();
    this.buttonBackground.fillStyle(hexToNumber(backgroundColor));
    this.buttonBackground.lineStyle(buttonDesign.borderWidth, hexToNumber(borderColor));
    this.buttonBackground.fillRoundedRect(
      0,
      0,
      this.buttonWidth,
      this.buttonHeight,
      buttonDesign.borderRadius
    );
    this.buttonBackground.strokeRoundedRect(
      0,
      0,
      this.buttonWidth,
      this.buttonHeight,
      buttonDesign.borderRadius
    );
  }

  public override destroy() {
    this.unsubscribeFromConnector();
    this.cancelIconChange();
    this.buttonContainer.removeAllListeners();
    this.buttonContainer.destroy();
    super.destroy();
  }
}
