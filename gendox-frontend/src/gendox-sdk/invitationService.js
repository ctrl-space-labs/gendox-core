import axios from "axios";
import apiRequests from "src/configs/apiRequest.js";


/**
 *
 * @param email the email of the user to be invited
 * @param invitationToken the token of the invitation
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
const acceptInvitation = async (email, invitationToken) => {
    return axios.get(
        apiRequests.acceptInvitation(email, invitationToken),
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

}

export default {
    acceptInvitation
}




