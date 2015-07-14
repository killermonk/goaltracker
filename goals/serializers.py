from models import Goal, ProgressLog
from rest_framework import serializers


class ProgressLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressLog
        fields = ('date', 'progress')


class GoalSerializer(serializers.ModelSerializer):
    #user = serializers.ReadOnlyField(source='user.username')
    logs = ProgressLogSerializer(many=True, read_only=True)

    class Meta:
        model = Goal
        fields = ('id', 'name', 'start', 'end', 'total', 'logs')
