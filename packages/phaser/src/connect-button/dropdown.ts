import {buttonDesign} from './consts';
import {Styles} from './types';
import {hexToNumber, smoothScale} from './utils';

export interface DropdownMenuItemParams {
  style: Styles;
  text: string;
  icon: string;
  onClick?: (item: DropdownMenuItem) => void;
}
export class DropdownMenuItem extends Phaser.GameObjects.Container {
  public readonly button: Phaser.GameObjects.Graphics;
  public readonly buttonHeight: number;
  public readonly text: Phaser.GameObjects.Text;
  public readonly icon: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number = 0, y: number = 0, params: DropdownMenuItemParams) {
    super(scene, x, y);

    const styleSchema = params.style === 'dark' ? buttonDesign.dark : buttonDesign.light;

    const text = scene.add.text(
      buttonDesign.dropDownItem.horizontalPadding +
        buttonDesign.icon.width +
        buttonDesign.dropDownItem.horizontalPadding,
      buttonDesign.dropDownItem.verticalPadding,
      params.text,
      {
        color: styleSchema.fontColor,
        fontFamily: buttonDesign.fontFamily,
        fontSize: buttonDesign.fontSize
      }
    );
    this.text = text;

    const textHeight = text.height;

    const buttonWidth = buttonDesign.dropDown.width - buttonDesign.dropDown.horizontalPadding * 2;
    const buttonHeight = textHeight + buttonDesign.dropDownItem.verticalPadding * 2;
    this.buttonHeight = buttonHeight;

    const icon = scene.add.image(
      buttonDesign.dropDownItem.horizontalPadding + buttonDesign.icon.width * 0.5,
      buttonHeight * 0.5,
      params.icon
    );
    this.icon = icon;

    const button = scene.add.graphics({
      x: 0,
      y: 0,
      fillStyle: {color: hexToNumber(styleSchema.backgroundColor)}
    });
    button.fillRoundedRect(0, 0, buttonWidth, buttonHeight, 8);
    button.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, buttonWidth, buttonHeight),
      Phaser.Geom.Rectangle.Contains
    );

    button.on('pointerover', () => {
      scene.game.canvas.style.cursor = 'pointer';

      button.clear();
      button.fillStyle(hexToNumber(styleSchema.backgroundColorHover));
      button.lineStyle(buttonDesign.borderWidth, hexToNumber(styleSchema.borderColor));
      button.fillRoundedRect(0, 0, buttonWidth, buttonHeight, 8);
    });
    button.on('pointerout', () => {
      scene.game.canvas.style.cursor = 'default';

      button.clear();
      button.fillStyle(hexToNumber(styleSchema.backgroundColor));
      button.lineStyle(buttonDesign.borderWidth, hexToNumber(styleSchema.borderColor));
      button.fillRoundedRect(0, 0, buttonWidth, buttonHeight, 8);

      smoothScale(scene.tweens, this, 1, 125);
    });
    button.on('pointerdown', () => {
      console.log('down');
      smoothScale(scene.tweens, this, 0.98, 125);
    });
    button.on('pointerup', () => {
      console.log('up');
      smoothScale(scene.tweens, this, 1, 125);
    });
    this.button = button;

    if (params.onClick) {
      button.setInteractive({useHandCursor: true});
      button.on('pointerdown', () => {
        params.onClick && params.onClick(this);
      });
    }

    this.add([button, icon, text]);
  }
}

export interface DropdownMenuParams {
  items: {
    text: string;
    icon: string;
    onClick?: (item: DropdownMenuItem) => void;
  }[];
  style: Styles;
}

export class DropdownMenu extends Phaser.GameObjects.Container {
  // private readonly container: Phaser.GameObjects.Graphics;
  // private readonly containerHeight: number;
  // private readonly items: DropdownMenuItem[];

  constructor(scene: Phaser.Scene, x: number = 0, y: number = 0, params: DropdownMenuParams) {
    super(scene, x, y);

    const styleSchema = params.style === 'dark' ? buttonDesign.dark : buttonDesign.light;
    const itemsContainers: DropdownMenuItem[] = [];
    let totalHeight = buttonDesign.dropDown.verticalPadding;
    params.items.forEach((item) => {
      const itemContainer = new DropdownMenuItem(
        scene,
        buttonDesign.dropDown.horizontalPadding,
        totalHeight,
        {...item, style: params.style}
      );
      totalHeight += itemContainer.buttonHeight;
      itemsContainers.push(itemContainer);
    });
    totalHeight += buttonDesign.dropDown.verticalPadding;

    const container = scene.add.graphics({
      x: 0,
      y: 0,
      fillStyle: {color: hexToNumber(styleSchema.backgroundColor)},
      lineStyle: {width: buttonDesign.borderWidth, color: hexToNumber(styleSchema.borderColor)}
    });
    container.fillRoundedRect(
      0,
      0,
      buttonDesign.dropDown.width,
      totalHeight,
      buttonDesign.dropDown.borderRadius
    );
    container.strokeRoundedRect(
      0,
      0,
      buttonDesign.dropDown.width,
      totalHeight,
      buttonDesign.dropDown.borderRadius
    );
    this.add([container, ...itemsContainers]);

    // this.container = container;
    // this.containerHeight = totalHeight;
    // this.items = itemsContainers;
  }

  /* public setSchema(schema: typeof buttonDesign.dark) {
      this.repaintBackground(schema.backgroundColor, schema.borderColor);
      this.items.forEach((item) => {
          item.button.setFillStyle(hexToNumber(schema.backgroundColor));
          // todo change the icon
          // item.icon.setTint(hexToNumber(schema.fontColor));
          item.text.setColor(schema.fontColor);
      });
  } */

  /* private repaintBackground(backgroundColor: string, borderColor: string) {
      this.container.clear();
      this.container.fillStyle(hexToNumber(backgroundColor));
      this.container.lineStyle(buttonDesign.borderWidth, hexToNumber(borderColor));
      this.container.fillRoundedRect(0, 0, buttonDesign.dropDown.width, this.containerHeight, buttonDesign.borderRadius);
      this.container.strokeRoundedRect(0, 0, buttonDesign.dropDown.width, this.containerHeight, buttonDesign.borderRadius);
  } */
}
