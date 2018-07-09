import { looseJSON } from '@photon-elements/photon-tools/photon-looseJSON.js';


const PhotonWarpscriptExec = {
    exec: async (url, warpscript, options) => {
        try {
            let responseObj = await fetch(url, {
                method: 'POST', // *GET, POST, PUT, DELETE, etc.
                mode: 'cors', // no-cors, cors, *same-origin
                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                credentials: 'same-origin', // include, same-origin, *omit
                headers: {
                    'Content-Type': 'text/plain; charset=UTF-8',
                },
                redirect: 'follow', // manual, *follow, error
                referrer: 'client', // no-referrer, *client
                body: warpscript, // body data type must match "Content-Type" header
            });
            if (!responseObj.ok) {
                throw (responseObj);
            }
            let response = await PhotonWarpscriptExec.handleResponse(responseObj);
            return response;
        }
        catch (error) {
            throw (PhotonWarpscriptExec.handleError(error));
        }
    },

    handleResponse: async (responseObj) => {
        let elapsed = PhotonWarpscriptExec._getElapsed(responseObj);
        let fetched = PhotonWarpscriptExec._getFetched(responseObj);
        let operations = PhotonWarpscriptExec._getOperations(responseObj);

        let responseText = await responseObj.text();
        let stack = looseJSON.parse(responseText);
        let response = {
            stack: stack,
            options: {
                elapsed: elapsed,
                fetched: fetched,
                operations: operations,
            },
        };
        console.log(response);
        return response;
    },
    handleError: (error) => {
        if (error.status !== undefined) {
            error.elapsed = PhotonWarpscriptExec._getElapsed(error);
            error.fetched = PhotonWarpscriptExec._getFetched(error);
            error.operations = PhotonWarpscriptExec._getOperations(error);
            error.errorLine = PhotonWarpscriptExec._getErrorLine(error);
            error.errorMsg = PhotonWarpscriptExec._getErrorMsg(error);
        }
        return error;
    },

    _getElapsed: (response) => {
        let elapsedHeader = 'X-Warp10-Elapsed';
        for (let header of response.headers) {
            if (header[0].match('-Elapsed')) {
                elapsedHeader = header[0];
            }
        }
        return response.headers.get(elapsedHeader);
    },
    _getFetched: (response) => {
        let fetchedHeader = 'X-Warp10-Fetched';
        for (let header of response.headers) {
            if (header[0].match('-Fetched')) {
                fetchedHeader = header[0];
            }
        }
        return response.headers.get(fetchedHeader);
    },
    _getOperations: (response) => {
        let operationsHeader = 'X-Warp10-Ops';
        for (let header of response.headers) {
            if (header[0].match('-Ops')) {
                operationsHeader = header[0];
            }
        }
        return response.headers.get(operationsHeader);
    },
    _getErrorLine: (response) => {
        var errorLineHeader = 'X-Warp10-Error-Line';
        for (let header of response.headers) {
            if (header[0].match('-Error-Line')) {
                errorLineHeader = header[0];
            }
        }
        return response.headers.get(errorLineHeader);
    },
    _getErrorMsg: (response) => {
        var errorMsgHeader = 'X-Warp10-Error-Message';
        for (let header of response.headers) {
            if (header[0].match('-Error-Message')) {
                errorMsgHeader = header[0];
            }
        }
        return response.headers.get(errorMsgHeader);
    },
};

export default PhotonWarpscriptExec;
