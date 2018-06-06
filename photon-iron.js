import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';

/**
 * `photon-iron`
 * A set of visual and non-visual utility elements for dealing with Warp 10
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class PhotonIron extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <h2>Hello [[prop1]]!</h2>
    `;
  }
  static get properties() {
    return {
      prop1: {
        type: String,
        value: 'photon-iron',
      },
    };
  }
}

window.customElements.define('photon-iron', PhotonIron);
