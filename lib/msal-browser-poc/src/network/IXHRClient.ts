/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * XHR client for JSON endpoints
 * https://www.npmjs.com/package/async-promise
 * @hidden
 */
export interface IXhrClient {
    sendRequestAsync(url: string, method: string, enableCaching?: boolean): Promise<any>;
}
