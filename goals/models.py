from django.db import models
from django.contrib.auth.models import User

class Goal(models.Model):
    user = models.ForeignKey(User)
    name = models.CharField(max_length=200)
    start = models.DateField('start date')
    end = models.DateField('end date')
    total = models.IntegerField()

    class Meta:
        unique_together = (('user','name'),)


class ProgressLog(models.Model):
    goal = models.ForeignKey(Goal)
    date = models.DateField('entry date')
    progress = models.IntegerField()

    class Meta:
        unique_together = (('goal','date'),)
