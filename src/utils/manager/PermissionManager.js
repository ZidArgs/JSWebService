import LoggableMixin from "../../mixins/LoggableMixin.js";

export default class PermissionManager extends LoggableMixin() {

    checkUserPermission(/* userId, permissionId */) {
        // const user = userStorage.get(userId)
        // user.hasPermission(permissionId);
        // for (const group of user.groups) group.hasPermission(permissionId);
        return false;
    }

    checkTokenPermission(/* tokenId, permissionId */) {
        // const token = tokenStorage.get(tokenId)
        // token.hasPermission(permissionId);
        return false;
    }

}
