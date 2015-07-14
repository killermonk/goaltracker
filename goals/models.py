from django.db import models
from django.contrib.auth.models import User

class Goal(models.Model):
    user = models.ForeignKey(User)
    name = models.CharField(max_length=200)
    start = models.DateField('start date')
    end = models.DateField('end date')
    total = models.IntegerField()

    def __str__(self):
        return '{} {};{}'.format(self.name, self.start, self.end)

    class Meta:
        unique_together = (('user','name'),)


class ProgressLog(models.Model):
    goal = models.ForeignKey(Goal, related_name='logs')
    date = models.DateField('entry date')
    progress = models.IntegerField()

    def __str__(self):
        return '{} {}'.format(self.goal.name, self.date)

    class Meta:
        unique_together = (('goal','date'),)
        ordering = ['-date']
