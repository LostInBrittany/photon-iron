/**
@license MIT
@author Horacio Gonzalez (@lostinbrittany)
@copyright (c) 2018 OVH
 
The `photon-warpscript-caller` element exposes WarpScript network request functionality.
Loosely based on `warp10-warpscript-caller` on https://github.com/cityzendata/warp10-iron/

@customElement
@polymer
@demo demo/index.html
*/
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';

import '@polymer/iron-ajax/iron-ajax.js';

import { looseJSON } from '@photon-elements/photon-tools/photon-looseJSON.js';


class PhotonWarpscriptCaller extends window.customElements.get('iron-ajax') {
  static get is() { return 'photon-warpscript-caller'; }

  static get properties() {
    return {
      /**
       * WarpScript script to execute
       */
      warpscript: {
        type: String,
        value: '',
      },
      /**
       * If `reload > 0` it's the number of seconds between two calls
       * to the WarpScript server
       */
      reload: {
        type: Number,
        value: -1,
        observer: '_onReloadChange',
      },

      /**
       * If true debug logs are sent to the console
       */
      debug: {
        type: Boolean,
        value: false,
      },

      /**
       * @override
       */
      body: {
        type: String,
        computed: '_getBody(warpscript)',
      },
      /**
       * @override
       */
      method: { type: String, value: 'POST' },
      /**
       * @override
       */
      handleAs:  {type: String, value: 'text'},


      _reloadInterval: {
        type: Number,
      },
      _toBeReloaded: {
        type: Boolean,
        value: false,
      },
      _intervalId: {
        type: Number,
      }
    };
  }

  _onReloadChange() {
    if (this.reload > 0) {
      this._reloadInterval = parseFloat(this.reload) * 1000;
      this._toBeReloaded = true;
    } else {
      this._toBeReloaded = false;
      if (this._intervalId) {
        clearTimeout(this._intervalId);
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('iron-ajax-presend', (evt) => {
      if (this._toBeReloaded) {
        this._intervalId = setTimeout(() => { this.generateRequest() },this._reloadInterval);
      }
    });
  }

  _getBody() {
    return this.warpscript;
  }

  /**
   * @override
   */
  generateRequest() {
    if (this._intervalId) {
      clearTimeout(this._intervalId);
    }
    super.generateRequest();
  }

  /**
   * @override
   */
  _handleResponse(request) {
    let allowedHeaders = this._getAllowedHeaders(request);
    let elapsed = this._getElapsed(request, allowedHeaders);
    let fetched = this._getFetched(request, allowedHeaders);
    let operations = this._getOperations(request, allowedHeaders);

    try {
      let stack = looseJSON.parse(request.response);
      let response = {
        stack: stack,
        options: {
          elapsed: elapsed,
          fetched: fetched,
          operations: operations,
        },
      };

      if (request === this.lastRequest) {
        this._setLastResponse(response);
        this._setLastError(null);
        this._setLoading(false);
      }

      if (this.debug) {
        console.log('[photon-warpscript-caller] receivedResponse - Updated!', response);
      }

      this.dispatchEvent(new CustomEvent('response', {
        detail: response, 
        bubbles: this.bubbles, 
        composed: true
      }));

      this.dispatchEvent(new CustomEvent('iron-ajax-response', {
        detail: response, 
        bubbles: this.bubbles, 
        composed: true
      }));
    } catch (error) {
      console.warn('[photon-warpscript-caller] receivedResponse - error!', error);
      error.request = request;
      error.elapsed = elapsed;
      error.fetched = fetched;
      error.operations = operations;
      error.errorMsg = error.message;
      error.errorLine = 1;
      this.dispatchEvent(new CustomEvent('error', {
        detail: error, 
        bubbles: this.bubbles, 
        composed: true
      }));
    }
  }

  /**
   * @override
   */
  _handleError(request, error) {

    let allowedHeaders = this._getAllowedHeaders(error.request);
    error.elapsed = this._getElapsed(error.request, allowedHeaders);
    error.fetched = this._getFetched(error.request, allowedHeaders);
    error.operations = this._getOperations(error.request, allowedHeaders);

    error.errorLine = this._getErrorLine(error.request, allowedHeaders);
    error.errorMsg = this._getErrorMsg(error.request, allowedHeaders);

    if (this.verbose) {
      Base._error(error);
    }

    if (request === this.lastRequest) {
      this._setLastError({
        request: request,
        error: error,
        status: request.xhr.status,
        statusText: request.xhr.statusText,
        response: request.xhr.response
      });
      this._setLastResponse(null);
      this._setLoading(false);
    }

    // Tests fail if this goes after the normal this.fire('error', ...)
    this.dispatchEvent(new CustomEvent('iron-ajax-error', {
      detail: error, 
      bubbles: this.bubbles, 
      composed: true
    }));
    this.dispatchEvent(new CustomEvent('error', {
      detail: error, 
      bubbles: this.bubbles, 
      composed: true
    }));
  }

  _getAllowedHeaders(request) {
    return request.xhr
        .getAllResponseHeaders()
        .split('\n')
        .map( (i) => {
      return i.split(':')[0].trim();
    });
  }

  _getElapsed(request, allowedHeaders) {   
    let elapsedHeader = 'X-Warp10-Elapsed';
    for (let i in allowedHeaders) {
      if (allowedHeaders[i].match('-Elapsed')) {
        elapsedHeader = allowedHeaders[i];
      }
    }
    return request.xhr.getResponseHeader(elapsedHeader);
  }

  _getFetched(request, allowedHeaders) {
    let fetchedHeader = 'X-Warp10-Fetched';
    for (let i in allowedHeaders) {
      if (allowedHeaders[i].match('-Fetched')) {
        fetchedHeader = allowedHeaders[i];
      }
    }
    return request.xhr.getResponseHeader(fetchedHeader);
  }

  _getOperations(request, allowedHeaders) {
    let operationsHeader = 'X-Warp10-Ops';
    for (let i in allowedHeaders) {
      if (allowedHeaders[i].match('-Ops')) {
        operationsHeader = allowedHeaders[i];
      }
    }
    return request.xhr.getResponseHeader(operationsHeader);
  }


  _getErrorLine(request, allowedHeaders) {
    var errorLineHeader = 'X-Warp10-Error-Line';
    for (var i in allowedHeaders) {
      if (allowedHeaders[i].match('-Error-Line')) {
        errorLineHeader = allowedHeaders[i];
      }
    }
    return request.xhr.getResponseHeader(errorLineHeader);
  }

  _getErrorMsg(request, allowedHeaders) {
    var errorMsgHeader = 'X-Warp10-Error-Message';
    for (var i in allowedHeaders) {
      if (allowedHeaders[i].match('-Error-Message')) {
        errorMsgHeader = allowedHeaders[i];
      }
    }
    return request.xhr.getResponseHeader(errorMsgHeader);
  }
};

window.customElements.define(PhotonWarpscriptCaller.is, PhotonWarpscriptCaller);




