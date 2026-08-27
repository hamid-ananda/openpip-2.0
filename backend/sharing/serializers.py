from rest_framework import serializers

from core.views import user_card
from .models import Comment, Notification, SavedView, Share


class UserCardField(serializers.Field):
    """A user rendered as the public card, read-only."""

    def __init__(self, **kwargs):
        kwargs.setdefault("read_only", True)
        super().__init__(**kwargs)

    def to_representation(self, user):
        return user_card(user)


class SavedViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedView
        fields = ["id", "name", "query", "state", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ShareSerializer(serializers.ModelSerializer):
    saved_view = SavedViewSerializer(read_only=True)
    sender = UserCardField()
    recipient = UserCardField()

    class Meta:
        model = Share
        fields = ["id", "saved_view", "sender", "recipient", "note", "created_at"]


class CommentSerializer(serializers.ModelSerializer):
    author = UserCardField()

    class Meta:
        model = Comment
        fields = ["id", "author", "body", "created_at"]
        read_only_fields = ["id", "created_at"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "text", "link", "read", "created_at"]
        read_only_fields = ["id", "text", "link", "created_at"]
