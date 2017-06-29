import { authTokenManager } from "VSS/Authentication/Services";
export function callApi(url: string,
                        method: string,
                        headers: {[header: string]: string} | undefined,
                        data: object | undefined,
                        success: (response) => void,
                        failure: (error: TfsError, errorThrown: string, status: number) => void) {
    VSS.getAccessToken().then((sessionToken) => {
        const authorizationHeaderValue = authTokenManager.getAuthorizationHeader(sessionToken);
        $.ajax({
            url: url,
            method: method,
            data: data || "",
            success: function (data/*, textStatus, jqueryXHR*/) {
                success(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.responseJSON || 401 !== jqXHR.status && 403 !== jqXHR.status) {
                    if (jqXHR.responseJSON) {
                        failure(jqXHR.responseJSON, errorThrown, jqXHR.status);
                    } else {
                        failure({name: "CallFailure", textStatus, message: "call failed with status code " + jqXHR.status}, errorThrown, jqXHR.status);
                    }
                } else {
                    failure({name: "AuthorizationFailure", textStatus, message: "unauthorized call"}, errorThrown, jqXHR.status);
                }
            },
            beforeSend: function (jqXHR) {
                jqXHR.setRequestHeader("Authorization", authorizationHeaderValue);
                if (headers) {
                    for (const header in headers) {
                        jqXHR.setRequestHeader(header, headers[header]);
                    }
                }
            }
        } as JQueryAjaxSettings);
    });
}
