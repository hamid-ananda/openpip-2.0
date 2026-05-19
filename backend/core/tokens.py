from rest_framework_simplejwt.tokens import RefreshToken as _RefreshToken


class CustomRefreshToken(_RefreshToken):
    @classmethod
    def for_user(cls, user):
        token = super().for_user(user)
        # Store is_admin in the refresh token payload so it propagates to access tokens
        token["is_admin"] = user.is_staff
        return token

    @property
    def access_token(self):
        access = super().access_token
        # Copy is_admin from refresh payload into every access token we issue
        if "is_admin" in self.payload:
            access["is_admin"] = self.payload["is_admin"]
        return access
