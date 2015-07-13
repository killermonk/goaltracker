from models import Goal, ProgressLog
from rest_framework import serializers

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = ('id', 'name', 'start', 'end', 'total')
