module.exports = {
    createJWT: function (user) {
        var me = this;

        return me.jwt.encode({
            sub: user._id,
            iat: me.moment().unix(),
            exp: me.moment().add(14, 'days').unix()
        }, me._CONFIG.SECRET_TOKEN);
    }
    /**
     * Mixin no required to Jwt, THIS CAN BE DECLARED IN AUTH RESOURCE 
     * */
};