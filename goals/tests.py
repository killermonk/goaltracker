from django.test import TestCase
from django.contrib.auth.models import User
from .models import Goal, ProgressLog

class GoalTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create(username='test', email='test@example.com', first_name='Test', last_name='Test')
        Goal.objects.create(user=self.user, name='goal1', start='2015-07-01', end='2015-07-10', total=1000)
        Goal.objects.create(user=self.user, name='goal2', start='2015-07-05', end='2015-07-15', total=10000)

    def test_get_goal_by_name(self):
        goal1 = Goal.objects.get(user=self.user, name='goal1')
        self.assertEqual(goal1.name, 'goal1')
